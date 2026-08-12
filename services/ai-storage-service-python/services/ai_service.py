import hashlib
import json
from typing import Optional
from config.settings import settings
from config.redis import get_redis
from config.database import get_database
from loguru import logger
from services.ai_providers.provider_factory import get_provider
from bson import ObjectId


def cache_key_for(messages: list, model: str) -> str:
    data = json.dumps({"messages": messages, "model": model}, sort_keys=True)
    hash_value = hashlib.sha256(data.encode()).hexdigest()
    return f"ai:cache:{hash_value}"


async def run_chat(
    owner_id: Optional[str],
    messages: list[dict],
    model: Optional[str] = None,
    conversation_id: Optional[str] = None,
    use_cache: bool = True
) -> dict:
    provider = get_provider()
    cache_key = cache_key_for(messages, model or settings.ai_model)
    
    if use_cache:
        try:
            redis_client = await get_redis()
            cached = await redis_client.get(cache_key)
            if cached:
                return {**json.loads(cached), "cached": True}
        except Exception as err:
            logger.warning(f"AI cache read failed: {err}")
    
    result = await provider.chat(messages, model or settings.ai_model)
    
    if use_cache:
        try:
            redis_client = await get_redis()
            await redis_client.setex(cache_key, 300, json.dumps(result))
        except Exception as err:
            logger.warning(f"AI cache write failed: {err}")
    
    if owner_id:
        try:
            db = get_database()
            assistant_message = {"role": "assistant", "content": result["content"]}
            
            if conversation_id:
                await db.conversations.update_one(
                    {"_id": ObjectId(conversation_id), "owner_id": owner_id},
                    {"$push": {"messages": {"$each": [messages[-1], assistant_message]}}}
                )
            else:
                conversation_doc = {
                    "owner_id": owner_id,
                    "provider": settings.ai_provider,
                    "model": model or settings.ai_model,
                    "messages": messages + [assistant_message],
                    "title": "New conversation",
                    "created_at": None,
                    "updated_at": None
                }
                await db.conversations.insert_one(conversation_doc)
        except Exception as err:
            logger.warning(f"Failed to persist conversation (non-fatal): {err}")
    
    return {**result, "cached": False}
