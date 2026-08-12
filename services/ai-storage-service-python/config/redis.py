import redis.asyncio as redis
from config.settings import settings
from loguru import logger


class RedisClient:
    client: redis.Redis = None
    
    @classmethod
    async def connect(cls):
        cls.client = redis.from_url(
            settings.redis_url,
            max_retries=2,
            retry_on_timeout=True
        )
        logger.info("Redis connected (ai-storage-service)")
    
    @classmethod
    async def close(cls):
        if cls.client:
            await cls.client.close()
            logger.info("Redis connection closed")
    
    @classmethod
    def get_client(cls):
        return cls.client


async def get_redis():
    return RedisClient.get_client()
