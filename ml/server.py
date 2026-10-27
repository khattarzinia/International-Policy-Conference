"""Private local HTTP service for the fine-tuned IPC research detector."""
from __future__ import annotations

import argparse
import hmac
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path

from common import ROOT
from runtime import Detector

MAX_BODY_BYTES = 1_000_000


def create_handler(detector, token):
    if not isinstance(token, str) or len(token) < 24:
        raise ValueError("IPC_MODEL_TOKEN must contain at least24 characters")

    class Handler(BaseHTTPRequestHandler):
        server_version = "IPCResearchDetector/1"

        def log_message(self, *args):
            pass  # No submitted text, credentials, or request paths in logs.

        def send_json(self, payload, status=200):
            content = json.dumps(payload, allow_nan=False).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(content)

        def authorized(self):
            supplied = self.headers.get("Authorization", "")
            return hmac.compare_digest(supplied.encode(), ("Bearer " + token).encode())

        def do_GET(self):
            if self.path != "/health":
                return self.send_json({"error": "Not found"}, 404)
            # Readiness is public only on this loopback interface, no secrets included.
            return self.send_json({"ready": True, "modelVersion": detector.metadata["modelVersion"], "experimental": True})

        def do_POST(self):
            if self.path != "/predict":
                return self.send_json({"error": "Not found"}, 404)
            if not self.authorized():
                return self.send_json({"error": "Unauthorized"}, 401)
            if self.headers.get("Content-Type", "").split(";")[0] != "application/json":
                return self.send_json({"error": "Send JSON"}, 415)
            try:
                size = int(self.headers.get("Content-Length", "-1"))
            except ValueError:
                return self.send_json({"error": "Invalid request length"}, 400)
            if size < 0 or size > MAX_BODY_BYTES:
                return self.send_json({"error": "Request too large"}, 413)
            self.connection.settimeout(15)
            try:
                payload = json.loads(self.rfile.read(size))
                if not isinstance(payload, dict) or not isinstance(payload.get("document"), str):
                    raise ValueError("Provide a document string")
                result = detector.predict(payload["document"])
            except (ValueError, UnicodeError, TimeoutError) as error:
                return self.send_json({"error": str(error)}, 400)
            except Exception:
                return self.send_json({"error": "The local model could not analyze this document"}, 503)
            return self.send_json(result)

    return Handler


def load_env(path):
    """Small explicit env-file reader; secrets are never printed."""
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key, value.strip().strip('"').strip("'"))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--env-file")
    parser.add_argument("--port", type=int, default=4319)
    args = parser.parse_args()
    if args.env_file:
        load_env(args.env_file)
    detector = Detector(os.environ.get("IPC_MODEL_DIR", str(ROOT / ".local/ml-model")))
    token = os.environ.get("IPC_MODEL_TOKEN", "")
    server = ThreadingHTTPServer(("127.0.0.1", args.port), create_handler(detector, token))
    server.daemon_threads = True
    print(json.dumps({"ready": True, "address": f"http://127.0.0.1:{args.port}", "pid": os.getpid(), "modelVersion": detector.metadata["modelVersion"], "experimental": True}), flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
