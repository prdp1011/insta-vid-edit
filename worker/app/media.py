import json
import math
import subprocess
from pathlib import Path
from typing import List


class MediaError(RuntimeError):
    pass


def safe_storage_path(root: Path, key: str) -> Path:
    if not key or "\x00" in key:
        raise MediaError("ASSET_MISSING")
    root = root.resolve()
    candidate = (root / key).resolve()
    if root != candidate and root not in candidate.parents:
        raise MediaError("INVALID_STORAGE_PATH")
    return candidate


def vertical_filter(width: int, height: int, fit: str) -> str:
    if fit == "cover":
        return f"scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height}"
    if fit == "contain":
        return f"scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:black"
    raise ValueError("fit must be cover or contain")


def build_render_command(ffmpeg: str, source: Path, output: Path, start: float, end: float, width: int = 1080, height: int = 1920, fps: int = 30, fit: str = "cover", normalize_audio: bool = True) -> List[str]:
    if start < 0 or end <= start:
        raise ValueError("invalid source range")
    command = [ffmpeg, "-hide_banner", "-nostdin", "-y", "-ss", f"{start:.3f}", "-t", f"{end-start:.3f}", "-i", str(source), "-vf", vertical_filter(width, height, fit), "-r", str(fps)]
    if normalize_audio:
        command += ["-af", "loudnorm=I=-16:TP=-1.5:LRA=11"]
    command += ["-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(output)]
    return command


def run(command: List[str]) -> None:
    try:
        result = subprocess.run(command, check=False, capture_output=True, text=True, timeout=1200, shell=False)
    except subprocess.TimeoutExpired as exc:
        raise MediaError("RENDER_TIMEOUT") from exc
    if result.returncode != 0:
        raise MediaError(f"RENDER_FAILED: {result.stderr[-1200:]}")


def probe(ffprobe: str, path: Path) -> dict:
    command = [ffprobe, "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)]
    try:
        result = subprocess.run(command, check=False, capture_output=True, text=True, timeout=60, shell=False)
    except subprocess.TimeoutExpired as exc:
        raise MediaError("FFPROBE_TIMEOUT") from exc
    if result.returncode != 0:
        raise MediaError("FFPROBE_FAILED")
    return json.loads(result.stdout)


def parse_fps(value: str) -> float:
    try:
        numerator, denominator = value.split("/", 1)
        fps = float(numerator) / float(denominator)
        return fps if math.isfinite(fps) else 0.0
    except (ValueError, ZeroDivisionError):
        return 0.0
