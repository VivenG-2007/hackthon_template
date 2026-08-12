from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId


class Message(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str
    timestamp: Optional[datetime] = None


class Conversation(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    owner_id: str
    title: str = "New conversation"
    provider: Optional[str] = None
    model: Optional[str] = None
    messages: List[Message] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class ConversationCreate(BaseModel):
    owner_id: str
    title: str = "New conversation"
    provider: Optional[str] = None
    model: Optional[str] = None
    messages: List[Message] = []


class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    messages: Optional[List[Message]] = None
