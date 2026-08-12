from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from loguru import logger


limiter = Limiter(key_func=get_remote_address)


def get_ai_limiter():
    return limiter.limit("20/minute")


def get_upload_limiter():
    return limiter.limit("30/minute")


def get_general_limiter():
    return limiter.limit("300/minute")
