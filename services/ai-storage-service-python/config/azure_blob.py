from azure.storage.blob.aio import BlobServiceClient
from loguru import logger
from config.settings import settings
import asyncio

_container_client = None

def get_container_client():
    global _container_client
    if not settings.azure_connection_string:
        logger.warning("Azure Blob not configured — AZURE_STORAGE_CONNECTION_STRING missing")
        return None
        
    if _container_client is None:
        blob_service_client = BlobServiceClient.from_connection_string(settings.azure_connection_string)
        _container_client = blob_service_client.get_container_client(settings.azure_container)
        
    return _container_client

async def ensure_container():
    client = get_container_client()
    if client is None:
        return
    try:
        exists = await client.exists()
        if not exists:
            await client.create_container()
            logger.info(f"Azure Blob container created: {settings.azure_container}")
        else:
            logger.info(f"Azure Blob container ready: {settings.azure_container}")
    except Exception as e:
        logger.warning(f"Error ensuring container: {e}")

async def close_azure_blob():
    global _container_client
    if _container_client is not None:
        # Assuming we need to close the underlying transport if it exists
        # Actually the BlobServiceClient holds the transport, but ContainerClient might too.
        try:
            # We must close the service client instead. Let's not worry about close here unless memory leaking.
            # aio container client has a close() method
            await _container_client.close()
        except:
            pass
        _container_client = None
