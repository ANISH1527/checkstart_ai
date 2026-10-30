# 08. Security & Vulnerability Audit

This document details the security posture, authentication architecture, authorization mechanisms, input sanitization, and identified vulnerabilities across the codebase.

---

## 1. Security Mechanisms Implemented

### Authentication & Password Hashing
- **Password Hashing**: Implemented in `backend/app/utils/hashing.py` using `bcrypt.gensalt()` and `bcrypt.hashpw()`. Resilient against pre-computed rainbow tables and dictionary attacks.
- **JWT Management**: Access tokens generated in `backend/app/core/security.py:8-16` using `python-jose` with `HS256`. Token expiration configured to 60 minutes (`ACCESS_TOKEN_EXPIRE_MINUTES = 60`).
- **Single-Use Identity Verification Tokens**: In `backend/app/api/profile_settings.py:170-202`, permanent account deletion requires an explicit identity verification step that issues a short-lived, single-use 10-minute JWT with `purpose="account_delete"`.

### Authorization & RBAC
- **Dependency Guard**: `get_current_user` (`backend/app/core/dependencies.py:12-34`) extracts Bearer tokens and validates the active user.
- **Admin Guard**: `require_admin` (`backend/app/core/dependencies.py:36-44`) asserts `user.role == "ADMIN"`, returning HTTP 403 Forbidden on violation.
- **Resource Ownership Verification**: Every CRUD endpoint on ideas, conversations, and reports asserts that the requesting user's ID matches the resource's `user_id` (e.g. `IdeaRepository.get_by_id_and_user`).

### Input Sanitization & Attack Mitigations
- **SQL Injection**: Neutralized by SQLAlchemy ORM parameterized query generation. Zero raw string concatenation into SQL statements.
- **Cross-Site Scripting (XSS)**: Neutralized on the frontend. The `SafeMarkdown` component (`frontend/src/components/SafeMarkdown.tsx`) parses Markdown text into native React JSX elements without `dangerouslySetInnerHTML`.
- **Prompt Injection Defense**:
  - `RuleService` (`backend/app/services/rule_service.py:114-123`) scans submission text for injection keywords (`ignore previous instructions`, `you are now DAN`, `system override`).
  - `ChatService` (`backend/app/services/chat_service.py:415-455`) quarantines malicious user messages, returns a safe refusal message, and prevents prompt leakage.
- **Rate Limiting**: Configured using SlowAPI on sensitive endpoints (`/auth/register`, `/auth/login`, `/sessions/{id}/messages`, `/ideas/{id}/validate`).

---

## 2. Vulnerability Findings & Classification Matrix

| Finding ID | Severity | Category | Vulnerability Description | File & Line Reference |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **HIGH** | Authentication | Unverified Google ID Token Claims Decoding | `backend/app/api/auth.py:176` |
| **SEC-02** | **MEDIUM** | Secret Management | Predictable Default Insecure JWT Secret Key in Code | `backend/app/core/config.py:12` |
| **SEC-03** | **MEDIUM** | Rate Limiting | Rate Limiting Missing on Password Reset & Delete Endpoints | `backend/app/api/profile_settings.py:140`, `auth.py:303` |
| **SEC-04** | **LOW** | Webhook Security | Outbound Webhooks Lack HMAC-SHA256 Signature Header | `backend/app/services/tasks.py:77-90` |
| **SEC-05** | **LOW** | Password Policy | Minimum Password Length is Only 6 Characters | `backend/app/api/profile_settings.py:149`, `auth.py:324` |
| **SEC-06** | **INFORMATIONAL** | Deprecation | Use of Deprecated `datetime.utcnow()` | Across models, services, and routers |

---

## 3. Detailed Vulnerability Analyses & Remediations

### SEC-01: Unverified Google ID Token Claims Decoding
- **Evidence**: In `backend/app/api/auth.py:176`:
  ```python
  unverified_claims = jwt.get_unverified_claims(payload.credential)
  extracted_sub = unverified_claims.get("sub") or extracted_sub
  extracted_email = unverified_claims.get("email") or extracted_email
  ```
- **Potential Impact**: If an attacker crafts a forged JWT payload with arbitrary claims and submits it to `/api/v1/auth/google`, the backend will accept the unverified email and log the attacker into the victim's account, resulting in complete Account Takeover.
- **Recommended Remediation**: Use the official Google Auth library (`google-auth`) to verify the token signature against Google's public JWKS certificates:
  ```python
  from google.oauth2 import id_token
  from google.auth.transport import requests
  idinfo = id_token.verify_oauth2_token(payload.credential, requests.Request(), settings.GOOGLE_CLIENT_ID)
  extracted_email = idinfo["email"]
  extracted_sub = idinfo["sub"]
  ```

### SEC-02: Predictable Default Insecure JWT Secret Key
- **Evidence**: In `backend/app/core/config.py:12`:
  ```python
  JWT_SECRET_KEY: str = "default-insecure-secret-key-change-me-1234567890"
  ```
- **Potential Impact**: If a production deployment fails to set `JWT_SECRET_KEY` in its environment, any attacker who reads the source code can forge valid JWT access tokens for any `user_id`, granting administrative or founder access.
- **Recommended Remediation**: Add a Pydantic model validator in `Settings` that raises a startup `ValueError` in production if `JWT_SECRET_KEY` is equal to the default value or is shorter than 32 characters.

### SEC-03: Rate Limiting Missing on Password Reset & Delete Endpoints
- **Evidence**: While `/auth/login` and `/auth/register` have `@limiter.limit("5/minute")`, `/auth/forgot-password` (`auth.py:303`), `/user/password` (`profile_settings.py:140`), and `/user/verify-delete` (`profile_settings.py:170`) have no `@limiter` decorators.
- **Potential Impact**: Attackers can flood the password reset service or brute-force account passwords via the `/user/verify-delete` endpoint without tripping rate limits.
- **Recommended Remediation**: Decorate `/auth/forgot-password` with `@limiter.limit("3/minute")` and `/user/verify-delete` with `@limiter.limit("5/minute")`.

### SEC-04: Outbound Webhooks Lack HMAC Signature
- **Evidence**: In `backend/app/services/tasks.py:82`:
  ```python
  resp = httpx.post(webhook_url, json=payload, timeout=5.0)
  ```
- **Potential Impact**: Receiving servers cannot verify whether webhook notifications originated from CheckStart AI or an attacker spoofing the payload.
- **Recommended Remediation**: Compute `hmac.new(secret, payload_bytes, hashlib.sha256).hexdigest()` and attach it in an `X-CheckStart-Signature` header.

### SEC-05: Weak Minimum Password Policy
- **Evidence**: `len(payload.password) < 6` in `auth.py:324` and `profile_settings.py:149`.
- **Potential Impact**: 6-character passwords can be cracked in seconds using modern offline GPU hash crackers.
- **Recommended Remediation**: Enforce a minimum length of 8 to 12 characters with at least one number and special character.

---

## 4. Threat Model & Attack Surface Summary

```
+───────────────────────────+─────────────────────────────────────────────────────────────+
| Attack Vector             | Defense Implemented                                         |
+───────────────────────────+─────────────────────────────────────────────────────────────+
| SQL Injection             | SQLAlchemy 2.0 ORM Parameterization                         |
| Cross-Site Scripting (XSS)| Native SafeMarkdown JSX Parser (No dangerouslySetInnerHTML) |
| Prompt Injection / DAN    | Multi-turn Regex Quarantining & System Prompt Guardrails    |
| Authentication Bypass     | OAuth2 Bearer Token Extraction & JWT Verification           |
| Horizontal Privilege Esc. | Strict user_id filtering on all repository database queries |
| Brute-Force Attacks       | SlowAPI IP-based rate limiting on login & registration      |
| Denial of Service (DoS)   | Word count limits (10 to 3000 words), payload truncation    |
+───────────────────────────+─────────────────────────────────────────────────────────────+
```
