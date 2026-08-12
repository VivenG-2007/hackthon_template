import os
import base64
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


def decode_base64_key(base64_value: Optional[str]) -> Optional[str]:
    if not base64_value:
        return None
    try:
        return base64.b64decode(base64_value).decode('utf-8')
    except Exception:
        return None


class Settings(BaseSettings):
    node_env: str = Field(default="development", alias="NODE_ENV")
    port: int = Field(default=5002, alias="PORT")
    service_name: str = Field(default="ai-storage-service", alias="SERVICE_NAME")
    cors_origins: str = Field(default="http://localhost:3000", alias="CORS_ORIGINS")
    
    jwt_public_key_base64: Optional[str] = Field(default=None, alias="JWT_PUBLIC_KEY_BASE64")
    jwt_issuer: str = Field(default="hackathon-auth-service", alias="JWT_ISSUER")
    jwt_audience: str = Field(default="hackathon-platform", alias="JWT_AUDIENCE")
    internal_service_token: str = Field(default="", alias="INTERNAL_SERVICE_TOKEN")
    
    mongo_uri: Optional[str] = Field(default=None, alias="MONGODB_URI")
    mongo_database: str = Field(default="ai_storage_db", alias="MONGODB_DATABASE")
    
    redis_url: str = Field(default="redis://localhost:6379", alias="REDIS_URL")
    
    azure_connection_string: Optional[str] = Field(default=None, alias="AZURE_STORAGE_CONNECTION_STRING")
    azure_container: str = Field(default="hackathon-uploads", alias="AZURE_STORAGE_CONTAINER")
    max_upload_bytes: int = Field(default=26214400, alias="MAX_UPLOAD_BYTES")
    
    ai_provider: str = Field(default="mock", alias="AI_PROVIDER")
    ai_model: str = Field(default="llama-3.1-8b-instant", alias="AI_MODEL")
    ai_api_key: str = Field(default="", alias="AI_API_KEY")
    azure_openai_endpoint: str = Field(default="", alias="AZURE_OPENAI_ENDPOINT")
    azure_openai_deployment: str = Field(default="", alias="AZURE_OPENAI_DEPLOYMENT")
    
    project_name: str = Field(default="hackathon-template", alias="PROJECT_NAME")
    log_level: str = Field(default="info", alias="LOG_LEVEL")
    
    @property
    def jwt_public_key(self) -> Optional[str]:
        return decode_base64_key(self.jwt_public_key_base64)
    
    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

if settings.node_env == "production" and not settings.jwt_public_key:
    raise ValueError("JWT_PUBLIC_KEY_BASE64 must be set in production")
