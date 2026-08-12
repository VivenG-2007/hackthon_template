from typing import Dict, Any


async def chat(messages: list[Dict[str, str]], model: str = None) -> Dict[str, Any]:
    last_user = next((m for m in reversed(messages) if m["role"] == "user"), None)
    content = f'[mock provider] I received: "{(last_user.get("content", "")[:200])}". Set AI_PROVIDER + AI_API_KEY in .env to use a real model.'
    return {
        "content": content,
        "usage": {"prompt_tokens": 0, "completion_tokens": 0}
    }
