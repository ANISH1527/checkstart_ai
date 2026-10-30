"""
Deployment Health & Smoke Verification Script for CheckStart AI.

Verifies:
1. Frontend accessibility and root HTML serving.
2. Backend /health endpoint status (database, server, LLM status).
3. Backend OpenAPI documentation accessibility.
4. Cross-Origin Resource Sharing (CORS) headers for frontend-backend communication.
"""

import argparse
import sys
import time
import httpx


def parse_args():
    parser = argparse.ArgumentParser(description="Verify CheckStart AI production deployment health.")
    parser.add_argument("--backend-url", default=None, help="Base URL of the Render backend service.")
    parser.add_argument("--frontend-url", default=None, help="Base URL of the Vercel frontend application.")
    parser.add_argument("--retries", type=int, default=6, help="Number of retry attempts for health polling.")
    parser.add_argument("--delay", type=int, default=10, help="Delay in seconds between retry attempts.")
    return parser.parse_args()


def check_backend_health(client: httpx.Client, backend_url: str, retries: int, delay: int) -> bool:
    health_url = f"{backend_url.rstrip('/')}/health"
    print(f"\n[BACKEND] Probing health endpoint: {health_url}")

    for attempt in range(1, retries + 1):
        try:
            res = client.get(health_url, timeout=15.0)
            if res.status_code == 200:
                data = res.json()
                print(f"[BACKEND] Response: {data}")
                status = data.get("data", {}).get("status")
                db_status = data.get("data", {}).get("db")
                if status == "ok" and db_status == "ok":
                    print("[BACKEND] SUCCESS: Backend server and Database are healthy.")
                    return True
                else:
                    print(f"[BACKEND] WARNING: Service returned status={status}, db={db_status}")
            else:
                print(f"[BACKEND] Attempt {attempt}/{retries}: Received status {res.status_code}")
        except Exception as e:
            print(f"[BACKEND] Attempt {attempt}/{retries}: Connection error - {e}")

        if attempt < retries:
            print(f"[BACKEND] Waiting {delay}s for service warmup/provisioning...")
            time.sleep(delay)

    print("[BACKEND] FAILURE: Backend health check failed after maximum retries.")
    return False


def check_backend_docs(client: httpx.Client, backend_url: str) -> bool:
    docs_url = f"{backend_url.rstrip('/')}/docs"
    print(f"\n[DOCS] Probing API docs: {docs_url}")
    try:
        res = client.get(docs_url, timeout=10.0)
        if res.status_code == 200:
            print("[DOCS] SUCCESS: FastAPI interactive documentation is accessible.")
            return True
        else:
            print(f"[DOCS] WARNING: /docs returned HTTP {res.status_code}")
            return False
    except Exception as e:
        print(f"[DOCS] WARNING: Could not access /docs: {e}")
        return False


def check_frontend(client: httpx.Client, frontend_url: str, retries: int, delay: int) -> bool:
    target_url = frontend_url.rstrip("/")
    print(f"\n[FRONTEND] Probing frontend deployment: {target_url}")

    for attempt in range(1, retries + 1):
        try:
            res = client.get(target_url, timeout=15.0, follow_redirects=True)
            if res.status_code == 200:
                html = res.text
                if "<html" in html.lower() or "id=\"root\"" in html or "<!doctype html" in html.lower():
                    print(f"[FRONTEND] SUCCESS: Frontend HTML delivered successfully (status {res.status_code}).")
                    return True
                else:
                    print(f"[FRONTEND] WARNING: Received 200 but HTML payload looks unexpected.")
            else:
                print(f"[FRONTEND] Attempt {attempt}/{retries}: Received status {res.status_code}")
        except Exception as e:
            print(f"[FRONTEND] Attempt {attempt}/{retries}: Connection error - {e}")

        if attempt < retries:
            time.sleep(delay)

    print("[FRONTEND] FAILURE: Frontend check failed after maximum retries.")
    return False


def check_cors(client: httpx.Client, backend_url: str, frontend_url: str) -> bool:
    origin = frontend_url.rstrip("/")
    health_url = f"{backend_url.rstrip('/')}/health"
    print(f"\n[CORS] Testing CORS headers from origin: {origin}")
    try:
        headers = {"Origin": origin}
        res = client.options(
            health_url,
            headers={
                **headers,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization,content-type"
            },
            timeout=10.0
        )
        allow_origin = res.headers.get("access-control-allow-origin")
        print(f"[CORS] Status: {res.status_code}, Access-Control-Allow-Origin: {allow_origin}")
        if allow_origin in ("*", origin):
            print("[CORS] SUCCESS: Origin is accepted by backend CORS policy.")
            return True
        else:
            print(f"[CORS] WARNING: Origin {origin} not explicitly reflected in response headers.")
            return False
    except Exception as e:
        print(f"[CORS] Notice during CORS preflight test: {e}")
        return False


def main():
    args = parse_args()
    backend_url = args.backend_url
    frontend_url = args.frontend_url

    if not backend_url and not frontend_url:
        print("ERROR: Provide at least one target URL (--backend-url or --frontend-url).")
        sys.exit(1)

    all_passed = True
    with httpx.Client() as client:
        if backend_url:
            backend_ok = check_backend_health(client, backend_url, args.retries, args.delay)
            docs_ok = check_backend_docs(client, backend_url)
            all_passed = all_passed and backend_ok

        if frontend_url:
            frontend_ok = check_frontend(client, frontend_url, args.retries, args.delay)
            all_passed = all_passed and frontend_ok

        if backend_url and frontend_url:
            check_cors(client, backend_url, frontend_url)

    if all_passed:
        print("\n=============================================")
        print("ALL CRITICAL DEPLOYMENT CHECKS PASSED (OK)")
        print("=============================================\n")
        sys.exit(0)
    else:
        print("\n=============================================")
        print("DEPLOYMENT HEALTH VERIFICATION FAILED (ERROR)")
        print("=============================================\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
