from config.settings import settings
from loguru import logger
from services.ai_providers import mock, openai, azure_openai, groq


providers = {
    "mock": mock,
    "groq": groq,
    "openai": openai,
    "azure-openai": azure_openai
}


def get_provider():
    provider = providers.get(settings.ai_provider)
    if not provider:
        available = ", ".join(providers.keys())
        raise ValueError(f'Unknown AI_PROVIDER "{settings.ai_provider}". Supported: {available}')
    return provider
