"""Local service boundary tests, including the real trained checkpoint when present."""
import json
import http.client
from pathlib import Path
import tempfile
import threading
import unittest
import urllib.error
import urllib.request

from common import ROOT, metrics
from runtime import Detector, utf16_length, window_indices
from server import ThreadingHTTPServer, create_handler


class LocalDetectorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not (ROOT / ".local/ml-model/metadata.json").exists():
            raise unittest.SkipTest("Train the real checkpoint before running inference tests")
        cls.detector = Detector(ROOT / ".local/ml-model")
        cls.token = "synthetic-test-token-with-no-account-access"
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), create_handler(cls.detector, cls.token))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def request(self, path="/predict", data=None, authorized=True, content_type="application/json"):
        headers = {"Content-Type": content_type}
        if authorized:
            headers["Authorization"] = "Bearer " + self.token
        body = data if isinstance(data, bytes) else json.dumps(data).encode() if data is not None else None
        request = urllib.request.Request(self.base + path, data=body, headers=headers)
        try:
            response = urllib.request.urlopen(request, timeout=20)
        except urllib.error.HTTPError as response:
            return response.code, json.load(response)
        return response.status, json.load(response)

    def test_health_never_exposes_credentials(self):
        status, result = self.request("/health")
        self.assertEqual(status, 200)
        self.assertTrue(result["ready"])
        self.assertNotIn(self.token, json.dumps(result))
        self.assertTrue(result["experimental"])

    def test_real_prediction_and_utf16_offsets(self):
        document = "😀 Synthetic Unicode inference check. A local government can compare policy options using cost, feasibility and accessibility. " * 5
        status, result = self.request(data={"document": document})
        self.assertEqual(status, 200)
        self.assertEqual(result["scoreType"], "model_confidence")
        self.assertTrue(0 <= result["score"] <= 1)
        self.assertEqual(result["totalCharacters"], utf16_length(document))
        self.assertGreater(result["analyzedCharacters"], 0)
        self.assertTrue(all(0 <= segment["start"] < segment["end"] <= result["totalCharacters"] for segment in result["segments"]))

    def test_missing_or_wrong_bearer_token_rejected(self):
        self.assertEqual(self.request(data={"document": "A" * 500}, authorized=False)[0], 401)

    def test_invalid_short_and_large_documents_rejected(self):
        self.assertEqual(self.request(data=b"{invalid")[0], 400)
        self.assertEqual(self.request(data={"document": ["invalid"]})[0], 400)
        self.assertEqual(self.request(data={"document": "short"})[0], 400)
        self.assertEqual(self.request(data={"document": "a" * 150001})[0], 400)
        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port)
        connection.putrequest("POST", "/predict")
        connection.putheader("Content-Type", "application/json")
        connection.putheader("Authorization", "Bearer " + self.token)
        connection.putheader("Content-Length", "1000001")
        connection.endheaders()
        self.assertEqual(connection.getresponse().status, 413)
        connection.close()
        self.assertEqual(self.request(data=b"not json", content_type="text/plain")[0], 415)

    def test_long_document_sampling_is_explicit(self):
        document = "A practical policy proposal needs evidence and transparent review. " * 1500
        result = self.detector.predict(document)
        self.assertFalse(result["coverageComplete"])
        self.assertLess(result["analyzedTokens"], result["totalTokens"])
        self.assertEqual(len(result["segments"]), 32)
        self.assertIn("sampled", result["message"])


class PureContractTests(unittest.TestCase):
    def test_no_checkpoint_means_no_ready_model(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(FileNotFoundError):
                Detector(directory)

    def test_window_sampling_and_metrics(self):
        self.assertEqual(window_indices(20), [0])
        self.assertEqual(len(window_indices(10000)), 32)
        self.assertEqual(len(window_indices(10000, max_windows=1)), 1)
        self.assertEqual(metrics([0, 1], [.1, .9])["auroc"], 1)
        self.assertEqual(metrics([0, 1], [.5, .5])["auroc"], .5)


if __name__ == "__main__":
    unittest.main()
