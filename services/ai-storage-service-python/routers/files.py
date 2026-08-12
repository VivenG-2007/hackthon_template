from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request, Response
from fastapi.responses import StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from models.schemas import FileAssetResponse, FileListResponse
from services.storage_service import upload_file, get_download_stream, delete_file, list_files
from middleware.auth import require_auth
from loguru import logger

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

@router.get("/", response_model=FileListResponse)
async def list_user_files(
    request: Request,
    user: dict = Depends(require_auth)
):
    try:
        files = await list_files(owner_id=user["id"], limit=100)
        return {"files": files}
    except Exception as err:
        logger.error(f"List files error: {err}")
        raise HTTPException(status_code=500, detail={"message": str(err), "code": "INTERNAL_ERROR"})

@router.post("/upload", response_model=FileAssetResponse, status_code=201)
@limiter.limit("30/minute")
async def upload(
    request: Request,
    file: UploadFile = File(...),
    user: dict = Depends(require_auth)
):
    try:
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail={"message": 'No file provided', "code": 'NO_FILE'})
            
        asset = await upload_file(
            owner_id=user["id"],
            file_bytes=file_bytes,
            original_name=file.filename,
            mime_type=file.content_type or "application/octet-stream"
        )
        return {"file": asset}
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"Upload error: {err}")
        raise HTTPException(status_code=500, detail={"message": str(err), "code": "INTERNAL_ERROR"})

@router.get("/{file_id}")
async def download(
    request: Request,
    file_id: str,
    user: dict = Depends(require_auth)
):
    try:
        asset, stream = await get_download_stream(owner_id=user["id"], file_id=file_id)
        if not asset or not stream:
            raise HTTPException(status_code=404, detail={"message": 'File not found', "code": 'NOT_FOUND'})
            
        async def stream_generator():
            async for chunk in stream.chunks():
                yield chunk
                
        return StreamingResponse(
            stream_generator(),
            media_type=asset.get("mimeType", "application/octet-stream"),
            headers={"Content-Disposition": f'attachment; filename="{asset.get("originalName", "download")}"'}
        )
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"Download error: {err}")
        raise HTTPException(status_code=500, detail={"message": str(err), "code": "INTERNAL_ERROR"})

@router.delete("/{file_id}", status_code=204)
async def remove_file(
    request: Request,
    file_id: str,
    user: dict = Depends(require_auth)
):
    try:
        success = await delete_file(owner_id=user["id"], file_id=file_id)
        if not success:
            raise HTTPException(status_code=404, detail={"message": 'File not found', "code": 'NOT_FOUND'})
        return Response(status_code=204)
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"Delete file error: {err}")
        raise HTTPException(status_code=500, detail={"message": str(err), "code": "INTERNAL_ERROR"})
