import unittest
from pathlib import Path

from worker.app.media import MediaError, build_render_command, safe_storage_path, vertical_filter


class MediaCommandTests(unittest.TestCase):
    def test_cover_filter(self):
        self.assertEqual(vertical_filter(1080, 1920, "cover"), "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920")

    def test_command_is_argument_array_and_normalizes_audio(self):
        command = build_render_command("ffmpeg", Path("/data/source/a.mp4"), Path("/data/out/a.mp4"), 2.5, 12.5)
        self.assertIsInstance(command, list)
        self.assertIn("loudnorm=I=-16:TP=-1.5:LRA=11", command)
        self.assertNotIn("shell=True", command)
        self.assertEqual(command[-1], "/data/out/a.mp4")

    def test_rejects_invalid_range(self):
        with self.assertRaises(ValueError):
            build_render_command("ffmpeg", Path("a"), Path("b"), 10, 4)

    def test_storage_path_blocks_traversal(self):
        with self.assertRaises(MediaError):
            safe_storage_path(Path("/tmp/framepilot"), "../../etc/passwd")


if __name__ == "__main__":
    unittest.main()
