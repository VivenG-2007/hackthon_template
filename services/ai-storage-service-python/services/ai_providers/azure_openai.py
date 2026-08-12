import httpx
from config.settings import settings
from loguru import logger
from typing import Dict, Any


async def chat(messages: list[Dict[str, str]], model: str = None) -> Dict[str, Any]:
    if not settings.azure_openai_endpoint or not settings.azure_openai_deployment:
        raise Exception("AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_DEPLOYMENT not configured")
    
    url = f"{settings.azure_openai_endpoint}/openai/deployments/{settings.azure_openai_deployment}/chat/completions?api-version=2024-06-01"
    headers = {
        "content-type": "application/json",
        "api-key": settings.ai_api_key
    }
    payload = {"messages": messages}
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload)
        
    if not response.is_success:
        error_text = response.text
        logger.error(f"Azure OpenAI error: {error_text}")
        raise Exception(f"Azure OpenAI error: {error_text}")
    
    data = response.json()
    return {
        "content": data.get("choices", [{}])[0].get("message", {}).get("content", ""),
        "usage": data.get("usage", {})
    }
