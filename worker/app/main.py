import hashlib
import hmac
import os
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Dict
from uuid import UUID

from fastapi import BackgroundTasks, FastAPI, Header, HTTPException, Request

from .media import MediaError, build_render_command, run, safe_storage_path
from .schemas import JobStatus, RenderJob, RenderRequest

app = FastAPI(title="FramePilot Render Worker", version="0.1.0")
STORAGE_ROOT = Path(os.getenv("STORAGE_ROOT", "/data"))
FFMPEG_BIN = os.getenv("FFMPEG_BIN", "ffmpeg")
SIGNING_SECRET = os.getenv("WORKER_SIGNING_SECRET", "")
jobs: Dict[UUID, RenderJob] = {}
jobs_lock = Lock()


def update_job(job_id: UUID, **changes) -> None:
    with jobs_lock:
        jobs[job_id] = jobs[job_id].model_copy(update={**changes, "updated_at": datetime.now(timezone.utc)})


def render(request: RenderRequest) -> None:
    try:
        update_job(request.job_id, status=JobStatus.processing, stage="rendering", progress=0.1)
        source = safe_storage_path(STORAGE_ROOT / "source", request.source_key)
        output = safe_storage_path(STORAGE_ROOT / "exports", request.output_key)
        if not source.is_file():
            raise MediaError("ASSET_MISSING")
        output.parent.mkdir(parents=True, exist_ok=True)
        command = build_render_command(FFMPEG_BIN, source, output, request.source_start, request.source_end, request.width, request.height, request.fps, request.fit, request.normalize_audio)
        run(command)
        if not output.is_file() or output.stat().st_size == 0:
            raise MediaError("RENDER_EMPTY")
        update_job(request.job_id, status=JobStatus.completed, stage="completed", progress=1, output_key=request.output_key)
    except (MediaError, ValueError) as exc:
        code = str(exc).split(":", 1)[0]
        update_job(request.job_id, status=JobStatus.failed, stage="failed", error_code=code, error_message="Video processing failed. The detailed error is retained in worker logs.")


async def verify_request(request: Request, signature: str) -> bytes:
    if not SIGNING_SECRET:
        raise HTTPException(status_code=503, detail="Worker signing is not configured")
    raw = await request.body()
    expected = hmac.new(SIGNING_SECRET.encode(), raw, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
    return raw


@app.get("/health")
def health():
    return {"status": "ok", "service": "framepilot-worker"}


@app.post("/v1/render", response_model=RenderJob, status_code=202)
async def create_render(request: Request, tasks: BackgroundTasks, x_framepilot_signature: str = Header(default="")):
    raw = await verify_request(request, x_framepilot_signature)
    render_request = RenderRequest.model_validate_json(raw)
    job = RenderJob(id=render_request.job_id, project_id=render_request.project_id, status=JobStatus.queued)
    with jobs_lock:
        if render_request.job_id in jobs:
            return jobs[render_request.job_id]
        jobs[render_request.job_id] = job
    tasks.add_task(render, render_request)
    return job


@app.get("/v1/render/{job_id}", response_model=RenderJob)
def get_render(job_id: UUID):
    with jobs_lock:
        job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Render job not found")
    return job
