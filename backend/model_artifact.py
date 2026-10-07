import hashlib
import hmac
import os
from pathlib import Path
import re
import tempfile
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, build_opener

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
MAX_MODEL_BYTES = 256 * 1024 * 1024


def verify_model(path, expected_hash):
    if not re.fullmatch(r"[0-9a-fA-F]{64}", expected_hash or ""):
        raise ValueError("MODEL_SHA256 must be the expected artifact's SHA-256 digest.")
    with path.open("rb") as handle:
        actual = hashlib.file_digest(handle, "sha256").hexdigest()
    if not hmac.compare_digest(actual, expected_hash.lower()):
        raise ValueError("Model checksum mismatch; refusing to load the artifact.")


class HTTPSOnlyRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if urlsplit(newurl).scheme != "https":
            raise ValueError("Model download redirected to a non-HTTPS URL.")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def provision_model(path, url, expected_hash):
    if not re.fullmatch(r"[0-9a-fA-F]{64}", expected_hash or ""):
        raise ValueError("MODEL_SHA256 is required, including for an existing model.")
    if path.exists():
        verify_model(path, expected_hash)
        return
    parsed = urlsplit(url or "")
    if parsed.scheme != "https" or not parsed.netloc or parsed.username or parsed.password:
        raise ValueError("Set MODEL_URL to an authorized HTTPS artifact URL.")
    temporary = None
    try:
        with build_opener(HTTPSOnlyRedirect()).open(url, timeout=60) as response:
            with tempfile.NamedTemporaryFile(dir=path.parent, prefix="model-",
                                             suffix=".part", delete=False) as handle:
                temporary = Path(handle.name)
                size = 0
                while chunk := response.read(1024 * 1024):
                    size += len(chunk)
                    if size > MAX_MODEL_BYTES:
                        raise ValueError("Model download exceeds the 256 MiB limit.")
                    handle.write(chunk)
        verify_model(temporary, expected_hash)
        os.replace(temporary, path)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


if __name__ == "__main__":
    load_dotenv(BASE_DIR / ".env")
    path = BASE_DIR / os.getenv("MODEL_PATH", "cattlenet_B4_phase1_epoch9.keras")
    try:
        provision_model(path, os.getenv("MODEL_URL"), os.getenv("MODEL_SHA256"))
    except Exception as exc:
        # Download exceptions can contain signed URLs. Never put them in build logs.
        raise SystemExit(
            f"Model provisioning failed ({type(exc).__name__}). "
            "Check MODEL_URL access, MODEL_PATH, MODEL_SHA256, network and disk space."
        ) from None
    print("Model artifact present and SHA-256 verified.")
