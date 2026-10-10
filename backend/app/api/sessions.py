import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Header, Query, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.models.chat import ValidationSession, ConversationMessage
from app.services.chat_service import ChatService
from app.core.limiter import limiter
from app.schemas.envelope import SuccessResponse

router = APIRouter(tags=["Conversational Validation Engine"])


class CreateSessionRequest(BaseModel):
    initialMessage: Optional[str] = None


class SendMessageRequest(BaseModel):
    message: Optional[str] = None
    content: Optional[str] = None
    client_message_id: Optional[str] = None


@router.post("/sessions", status_code=status.HTTP_201_CREATED)
@router.post("/conversations", status_code=status.HTTP_201_CREATED)
def create_session(
    body: Optional[CreateSessionRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chat_service = ChatService(db)
    initial_msg = body.initialMessage if body else None
    session = chat_service.get_or_create_session(
        user_id=current_user.id,
        initial_message=initial_msg
    )
    details = chat_service.get_session_details(session.id, current_user.id)
    return {"conversation": details, "session": details}


@router.get("/sessions")
@router.get("/conversations")
def list_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chat_service = ChatService(db)
    sessions = chat_service.list_user_sessions(current_user.id)
    return {"conversations": sessions, "sessions": sessions}


@router.get("/sessions/{session_id}")
@router.get("/conversations/{session_id}")
def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chat_service = ChatService(db)
    details = chat_service.get_session_details(session_id, current_user.id)
    if not details:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Validation conversation session not found or access denied."
        )
    return {"conversation": details, "session": details}


@router.get("/sessions/{session_id}/messages")
@router.get("/conversations/{session_id}/messages")
def get_session_messages(
    session_id: str,
    cursor: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ValidationSession).filter(
        ValidationSession.id == session_id,
        ValidationSession.user_id == current_user.id,
        ValidationSession.is_deleted == False
    ).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or access denied."
        )

    query = db.query(ConversationMessage).filter(
        ConversationMessage.session_id == session_id
    )
    if cursor:
        query = query.filter(ConversationMessage.id > cursor)

    messages = query.order_by(ConversationMessage.created_at.asc()).limit(limit).all()

    items = []
    for m in messages:
        meta = m.metadata_json or {}
        items.append({
            "id": m.id,
            "conversationId": session_id,
            "sender": m.role.upper(),
            "message": m.content,
            "actionType": meta.get("actionType"),
            "metadata": json.dumps(meta) if meta else None,
            "client_message_id": m.client_message_id,
            "createdAt": m.created_at.isoformat()
        })
    next_cursor = items[-1]["id"] if items and len(items) == limit else None
    return {"messages": items, "next_cursor": next_cursor}


@router.post("/sessions/{session_id}/messages")
@router.post("/conversations/{session_id}/messages")
@limiter.limit("30/minute")
def send_message(
    request: Request,
    session_id: str,
    body: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    content = body.message or body.content or ""
    if not content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty."
        )

    chat_service = ChatService(db)
    result = chat_service.process_user_message(
        session_id=session_id,
        user=current_user,
        message_content=content,
        client_message_id=body.client_message_id
    )
    return result


@router.post("/sessions/{session_id}/messages/stream")
@router.post("/conversations/{session_id}/messages/stream")
def stream_message(
    session_id: str,
    body: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    content = body.message or body.content or ""
    if not content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty."
        )

    chat_service = ChatService(db)
    result = chat_service.process_user_message(
        session_id=session_id,
        user=current_user,
        message_content=content,
        client_message_id=body.client_message_id
    )

    assistant_text = result["assistantMessage"]["message"]

    def event_generator():
        # Stream chunks of assistant reply via Server-Sent Events
        words = assistant_text.split(" ")
        for i, word in enumerate(words):
            chunk = word + (" " if i < len(words) - 1 else "")
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        yield f"data: {json.dumps({'done': True, 'full': result})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/sessions/{session_id}/validate")
@router.post("/conversations/{session_id}/validate")
@limiter.limit("15/minute")
def validate_session(
    request: Request,
    session_id: str,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chat_service = ChatService(db)
    try:
        res = chat_service.validate_session(
            session_id=session_id,
            user=current_user,
            idempotency_key=idempotency_key
        )
        return res
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/sessions/{session_id}")
@router.delete("/conversations/{session_id}")
def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ValidationSession).filter(
        ValidationSession.id == session_id,
        ValidationSession.user_id == current_user.id,
        ValidationSession.is_deleted == False
    ).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Validation conversation session not found or access denied."
        )

    session.is_deleted = True
    db.commit()
    return {"message": "Validation session deleted successfully."}
