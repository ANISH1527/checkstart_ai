"""
Utility to test and verify Redis connectivity for CheckStart AI.

Safe for production: Masks all passwords and tokens in output.
Tests:
1. URL parsing & SSL/TLS negotiation
2. Redis PING command
3. Key read/write/delete verification
"""

import argparse
import os
import sys
import time
import urllib.parse


def mask_redis_url(url: str) -> str:
    """Mask password in Redis connection string for safe console logging."""
    try:
        parsed = urllib.parse.urlsplit(url)
        netloc = parsed.netloc
        if "@" in netloc:
            auth, host_port = netloc.split("@", 1)
            if ":" in auth:
                user, _ = auth.split(":", 1)
                netloc = f"{user}:****@{host_port}"
            else:
                netloc = f"****@{host_port}"
        return urllib.parse.urlunsplit((parsed.scheme, netloc, parsed.path, parsed.query, parsed.fragment))
    except Exception:
        return "[MASKED_REDIS_URL]"


def test_redis(redis_url: str) -> bool:
    import redis

    masked = mask_redis_url(redis_url)
    print(f"\n[REDIS] Testing connection to: {masked}")

    kwargs = {}
    if redis_url.startswith("rediss://"):
        kwargs["ssl_cert_reqs"] = None

    try:
        start_time = time.time()
        client = redis.Redis.from_url(
            redis_url,
            socket_timeout=3.0,
            socket_connect_timeout=3.0,
            decode_responses=True,
            **kwargs
        )

        # 1. PING test
        print("[REDIS] Sending PING command...")
        response = client.ping()
        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        if response:
            print(f"[REDIS] SUCCESS: PING received PONG in {elapsed_ms}ms")
        else:
            print("[REDIS] FAILURE: PING did not return True/PONG")
            return False

        # 2. Write / Read test
        test_key = "checkstart:health:probe"
        test_val = f"ping-{int(time.time())}"
        print(f"[REDIS] Testing SET and GET on key '{test_key}'...")
        client.set(test_key, test_val, ex=30)
        retrieved = client.get(test_key)
        client.delete(test_key)

        if retrieved == test_val:
            print("[REDIS] SUCCESS: Write/Read/Delete operations verified.")
            return True
        else:
            print(f"[REDIS] FAILURE: Retrieved value '{retrieved}' does not match '{test_val}'")
            return False

    except redis.exceptions.AuthenticationError:
        print("[REDIS] AUTHENTICATION ERROR: Invalid password or username for Redis.")
        return False
    except redis.exceptions.ConnectionError as e:
        print(f"[REDIS] CONNECTION ERROR: Could not reach Redis host. {e}")
        return False
    except redis.exceptions.TimeoutError:
        print("[REDIS] TIMEOUT ERROR: Connection timed out after 3 seconds.")
        return False
    except Exception as e:
        print(f"[REDIS] ERROR: Unexpected failure - {type(e).__name__}: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Test Redis connectivity safely.")
    parser.add_argument("--url", default=None, help="Redis connection URL (defaults to REDIS_URL env var).")
    args = parser.parse_args()

    url = args.url or os.getenv("REDIS_URL")
    if not url:
        print("ERROR: Provide a Redis URL via --url or set the REDIS_URL environment variable.")
        sys.exit(1)

    ok = test_redis(url)
    if ok:
        print("\n=============================================")
        print("REDIS CONNECTIVITY TEST: PASSED (OK)")
        print("=============================================\n")
        sys.exit(0)
    else:
        print("\n=============================================")
        print("REDIS CONNECTIVITY TEST: FAILED (ERROR)")
        print("=============================================\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
