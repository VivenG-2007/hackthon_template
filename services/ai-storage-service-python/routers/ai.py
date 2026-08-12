from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from models.schemas import ChatRequest, GenerateRequest, AnalyzeRequest, AIResponse, ErrorResponse
from services.ai_service import run_chat
from middleware.auth import require_auth, optional_auth
from middleware.rate_limiter import get_ai_limiter
from loguru import logger


router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/chat", response_model=AIResponse)
@limiter.limit("20/minute")
async def chat(
    request: Request,
    chat_request: ChatRequest,
    user: dict = Depends(require_auth)
):
    try:
        result = await run_chat(
            owner_id=user["id"],
            messages=chat_request.messages,
            model=chat_request.model,
            conversation_id=chat_request.conversation_id
        )
        return result
    except Exception as err:
        logger.error(f"Chat error: {err}")
        raise HTTPException(status_code=500, detail={"message": str(err), "code": "INTERNAL_ERROR"})


@router.post("/generate", response_model=AIResponse)
@limiter.limit("20/minute")
async def generate(
    request: Request,
    generate_request: GenerateRequest
):
    try:
        if not generate_request.prompt:
            raise HTTPException(
                status_code=400,
                detail={"message": '"prompt" is required', "code": "VALIDATION_ERROR"}
            )
        
        result = await run_chat(
            owner_id=None,
            messages=[{"role": "user", "content": generate_request.prompt}],
            model=generate_request.model,
            use_cache=True
        )
        return result
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"Generate error: {err}")
        raise HTTPException(status_code=500, detail={"message": str(err), "code": "INTERNAL_ERROR"})


@router.post("/analyze", response_model=AIResponse)
@limiter.limit("20/minute")
async def analyze(
    request: Request,
    analyze_request: AnalyzeRequest,
    user: dict = Depends(optional_auth)
):
    try:
        if not analyze_request.input:
            raise HTTPException(
                status_code=400,
                detail={"message": '"input" is required', "code": "VALIDATION_ERROR"}
            )
        
        messages = [
            {"role": "system", "content": analyze_request.instructions or "Analyze the following input and summarize the key points."},
            {"role": "user", "content": str(analyze_request.input)[:8000]}
        ]
        
        result = await run_chat(
            owner_id=user["id"] if user else None,
            messages=messages,
            model=analyze_request.model,
            use_cache=True
        )
        return result
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"Analyze error: {err}")
        raise HTTPException(status_code=500, detail={"message": str(err), "code": "INTERNAL_ERROR"})
