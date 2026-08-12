from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager
from config.settings import settings
from config.database import connect_to_mongo, close_mongo_connection
from config.redis import RedisClient
from config.logger import logger
from middleware.request_id import RequestIdMiddleware
from routers.ai import router as ai_router
from routers.files import router as files_router
from config.azure_blob import ensure_container, close_azure_blob

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.service_name} on port {settings.port}")
    await connect_to_mongo()
    await RedisClient.connect()
    await ensure_container()
    yield
    logger.info("Shutting down...")
    await close_azure_blob()
    await close_mongo_connection()
    await RedisClient.close()


app = FastAPI(
    title=settings.service_name,
    lifespan=lifespan,
    docs_url="/docs" if settings.node_env == "development" else None,
    redoc_url="/redoc" if settings.node_env == "development" else None
)

app.state.limiter = None
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(RequestIdMiddleware)
app.add_middleware(GZipMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.service_name}


@app.get("/ready")
async def ready():
    db = await connect_to_mongo.__wrapped__ if hasattr(connect_to_mongo, '__wrapped__') else None
    mongo_ready = db is not None
    return {
        "ready": mongo_ready,
        "service": settings.service_name,
        "dependencies": {"mongodb": mongo_ready}
    }


@app.get("/metrics")
async def metrics():
    import psutil
    import time
    process = psutil.Process()
    mem_info = process.memory_info()
    
    return {
        "service": settings.service_name,
        "uptime_seconds": time.time() - process.create_time(),
        "ai_provider": settings.ai_provider,
        "memory": {
            "rss_mb": round(mem_info.rss / 1024 / 1024, 1),
            "heap_used_mb": round(mem_info.rss / 1024 / 1024, 1)
        }
    }


app.include_router(ai_router, prefix="/api/ai", tags=["AI"])
app.include_router(files_router, prefix="/api/files", tags=["Files"])
