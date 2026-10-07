import hashlib
import io
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import Mock, patch

import model_artifact


class ArtifactTests(unittest.TestCase):
    def setUp(self):
        self.directory = TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / "model.keras"
        self.content = b"test-artifact"
        self.digest = hashlib.sha256(self.content).hexdigest()

    def test_existing_artifact_is_verified_without_network(self):
        self.path.write_bytes(self.content)
        with patch.object(model_artifact, "build_opener") as opener:
            model_artifact.provision_model(self.path, None, self.digest)
            opener.assert_not_called()

    def test_checksum_is_required_and_mismatch_does_not_overwrite(self):
        self.path.write_bytes(self.content)
        for digest in ("", "0" * 64):
            with self.assertRaises(ValueError):
                model_artifact.provision_model(self.path, None, digest)
        self.assertEqual(self.path.read_bytes(), self.content)

    def test_download_is_atomic_and_checked(self):
        opener = Mock()
        opener.open.return_value = io.BytesIO(self.content)
        with patch.object(model_artifact, "build_opener", return_value=opener):
            model_artifact.provision_model(self.path, "https://example.com/model", self.digest)
        self.assertEqual(self.path.read_bytes(), self.content)
        self.assertEqual(list(self.path.parent.iterdir()), [self.path])

    def test_failed_checksum_cleans_partial_download(self):
        opener = Mock()
        opener.open.return_value = io.BytesIO(b"wrong")
        with patch.object(model_artifact, "build_opener", return_value=opener):
            with self.assertRaises(ValueError):
                model_artifact.provision_model(self.path, "https://example.com/model", self.digest)
        self.assertEqual(list(self.path.parent.iterdir()), [])

    def test_refuses_insecure_download_and_redirect(self):
        with self.assertRaises(ValueError):
            model_artifact.provision_model(self.path, "http://example.com/model", self.digest)
        with self.assertRaises(ValueError):
            model_artifact.HTTPSOnlyRedirect().redirect_request(
                None, None, 302, "", {}, "http://example.com/model")


if __name__ == "__main__":
    unittest.main()
