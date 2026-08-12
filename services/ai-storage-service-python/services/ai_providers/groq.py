import httpx
from config.settings import settings
from loguru import logger
from typing import Dict, Any


async def chat(messages: list[Dict[str, str]], model: str = None) -> Dict[str, Any]:
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "content-type": "application/json",
        "authorization": f"Bearer {settings.ai_api_key}"
    }
    payload = {
        "model": model or settings.ai_model,
        "messages": messages
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload)
        
    if not response.is_success:
        error_text = response.text
        logger.error(f"Groq API error: {error_text}")
        raise Exception(f"Groq API error: {error_text}")
    
    data = response.json()
    return {
        "content": data.get("choices", [{}])[0].get("message", {}).get("content", ""),
        "usage": data.get("usage", {})
    }
