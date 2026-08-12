from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class ChatRequest(BaseModel):
    messages: List[Dict[str, str]] = Field(..., min_length=1)
    model: Optional[str] = None
    conversation_id: Optional[str] = None


class GenerateRequest(BaseModel):
    prompt: str
    model: Optional[str] = None


class AnalyzeRequest(BaseModel):
    input: str
    instructions: Optional[str] = "Analyze the following input and summarize the key points."
    model: Optional[str] = None


class AIResponse(BaseModel):
    content: str
    usage: Dict[str, Any] = {}
    cached: bool = False


class ErrorResponse(BaseModel):
    error: Dict[str, Any]


class FileAsset(BaseModel):
    id: str = Field(alias="_id", default="")
    ownerId: str
    blobName: str
    originalName: str
    mimeType: str
    sizeBytes: int
    container: str
    metadata_field: Dict[str, Any] = Field(default={}, alias="metadata")
    createdAt: Optional[Any] = None
    updatedAt: Optional[Any] = None
    
    class Config:
        populate_by_name = True


class FileAssetResponse(BaseModel):
    file: FileAsset


class FileListResponse(BaseModel):
    files: List[FileAsset]
