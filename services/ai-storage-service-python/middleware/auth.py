from typing import Optional
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from config.settings import settings
from loguru import logger


security = HTTPBearer()


def extract_token(request: Request) -> Optional[str]:
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:]
    
    access_token = request.cookies.get("access_token")
    if access_token:
        return access_token
    
    return None


async def require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    
    try:
        payload = jwt.decode(
            token,
            settings.jwt_public_key,
            algorithms=["RS256"],
            issuer=settings.jwt_issuer,
            audience=settings.jwt_audience
        )
        
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=401,
                detail={"message": "Invalid token type", "code": "INVALID_TOKEN"}
            )
        
        return {"id": payload.get("sub"), "role": payload.get("role")}
    
    except Exception as err:
        logger.warning(f"Token validation failed: {err}")
        raise HTTPException(
            status_code=401,
            detail={"message": "Invalid or expired token", "code": "INVALID_TOKEN"}
        )


async def optional_auth(request: Request) -> Optional[dict]:
    token = extract_token(request)
    if not token:
        return None
    
    try:
        payload = jwt.decode(
            token,
            settings.jwt_public_key,
            algorithms=["RS256"],
            issuer=settings.jwt_issuer,
            audience=settings.jwt_audience
        )
        
        if payload.get("type") != "access":
            return None
        
        return {"id": payload.get("sub"), "role": payload.get("role")}
    
    except Exception:
        return None
