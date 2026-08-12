from motor.motor_asyncio import AsyncIOMotorClient
from config.settings import settings
from loguru import logger


class Database:
    client: AsyncIOMotorClient = None
    database = None


async def connect_to_mongo():
    Database.client = AsyncIOMotorClient(
        settings.mongo_uri,
        maxPoolSize=20,
        serverSelectionTimeoutMS=10000
    )
    Database.database = Database.client[settings.mongo_database]
    logger.info("MongoDB connected (ai-storage-service)")


async def close_mongo_connection():
    if Database.client:
        Database.client.close()
        logger.info("MongoDB connection closed")


def get_database():
    return Database.database
