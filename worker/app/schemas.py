from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class JobStatus(str, Enum):
    queued = "queued"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class MediaMetadata(BaseModel):
    asset_id: UUID
    duration: float = Field(gt=0)
    width: int = Field(gt=0)
    height: int = Field(gt=0)
    fps: float = Field(gt=0)
    video_codec: str
    audio_codec: Optional[str] = None
    audio_channels: Optional[int] = None
    sample_rate: Optional[int] = None
    rotation: int = 0


class RenderRequest(BaseModel):
    job_id: UUID
    project_id: UUID
    source_key: str = Field(min_length=1, max_length=500)
    output_key: str = Field(min_length=1, max_length=500)
    source_start: float = Field(ge=0)
    source_end: float = Field(gt=0)
    width: int = Field(default=1080, ge=320, le=3840)
    height: int = Field(default=1920, ge=320, le=3840)
    fps: int = Field(default=30, ge=15, le=60)
    fit: str = Field(default="cover", pattern="^(cover|contain)$")
    normalize_audio: bool = True

    @model_validator(mode="after")
    def validate_range(self):
        if self.source_end <= self.source_start:
            raise ValueError("source_end must be after source_start")
        if self.source_end - self.source_start > 600:
            raise ValueError("a single render may not exceed 10 minutes")
        return self


class RenderJob(BaseModel):
    id: UUID
    project_id: UUID
    status: JobStatus
    progress: float = Field(default=0, ge=0, le=1)
    stage: str = "queued"
    output_key: Optional[str] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class QCStatus(str, Enum):
    passed = "PASS"
    warning = "WARNING"
    failed = "FAIL"


class QCCheck(BaseModel):
    name: str
    status: QCStatus
    severity: str
    message: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class QCReport(BaseModel):
    job_id: UUID
    checks: List[QCCheck]
    passed: bool
