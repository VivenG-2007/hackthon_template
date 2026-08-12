import uuid
import os
import re
from datetime import datetime
from config.azure_blob import get_container_client
from config.database import get_database
from config.settings import settings
from fastapi import HTTPException
from bson import ObjectId
from azure.storage.blob import ContentSettings

def sanitize_filename(name: str) -> str:
    safe_name = re.sub(r'[^a-zA-Z0-9._-]', '_', name)
    return safe_name[-150:]

async def upload_file(owner_id: str, file_bytes: bytes, original_name: str, mime_type: str) -> dict:
    client = get_container_client()
    if not client:
        raise HTTPException(status_code=503, detail="Azure Blob Storage not configured")
        
    safe_name = sanitize_filename(original_name or "upload")
    _, ext = os.path.splitext(safe_name)
    blob_name = f"{owner_id}/{uuid.uuid4()}{ext}"
    
    blob_client = client.get_blob_client(blob_name)
    
    await blob_client.upload_blob(
        file_bytes, 
        overwrite=True, 
        content_settings=ContentSettings(content_type=mime_type)
    )
    
    db = get_database()
    asset = {
        "ownerId": owner_id,
        "blobName": blob_name,
        "originalName": safe_name,
        "mimeType": mime_type,
        "sizeBytes": len(file_bytes),
        "container": settings.azure_container,
        "metadata": {},
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    result = await db.files.insert_one(asset)
    asset["_id"] = str(result.inserted_id)
    return asset

async def get_download_stream(owner_id: str, file_id: str) -> tuple:
    db = get_database()
    try:
        obj_id = ObjectId(file_id)
    except:
        return None, None
        
    asset = await db.files.find_one({"_id": obj_id, "ownerId": owner_id})
    if not asset:
        return None, None
        
    client = get_container_client()
    if not client:
        raise HTTPException(status_code=503, detail="Azure Blob Storage not configured")
        
    blob_client = client.get_blob_client(asset["blobName"])
    stream = await blob_client.download_blob()
    
    asset["_id"] = str(asset["_id"])
    return asset, stream

async def delete_file(owner_id: str, file_id: str) -> bool:
    db = get_database()
    try:
        obj_id = ObjectId(file_id)
    except:
        return False
        
    asset = await db.files.find_one({"_id": obj_id, "ownerId": owner_id})
    if not asset:
        return False
        
    client = get_container_client()
    if client:
        blob_client = client.get_blob_client(asset["blobName"])
        try:
            await blob_client.delete_blob()
        except:
            pass
            
    await db.files.delete_one({"_id": obj_id})
    return True

async def list_files(owner_id: str, limit: int = 100) -> list:
    db = get_database()
    cursor = db.files.find({"ownerId": owner_id}).sort("createdAt", -1).limit(limit)
    files = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        files.append(doc)
    return files
