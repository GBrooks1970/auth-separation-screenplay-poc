"""FastAPI Reference Service for Authorisation API (AuthZ).

Implements OpenAPI 3.1 specification at specs/authz-api_v1.yaml.
"""

import json
import urllib.request
from datetime import datetime, timezone
from typing import Dict, List
from fastapi import FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from .models import (
    CheckPermissionRequest,
    CheckPermissionResponse,
    UserRolesResponse,
    PermissionsCatalogResponse,
    UserRole
)
from .policy import evaluate_policy

app = FastAPI(
    title="Authorisation API (AuthZ) — Python FastAPI Reference Implementation",
    description="Fine-grained policy evaluation engine implementing RBAC and ABAC dynamic access controls.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

INITIAL_ROLES: Dict[str, Dict[str, List[str]]] = {
    "usr_alice_123": {
        "roles": ["SecurityAdmin"],
        "permissions": [
            "UserRole:UPDATE",
            "UserRole:CREATE",
            "SecurityPolicy:READ",
            "SecurityPolicy:UPDATE",
            "UserProfile:READ",
            "UserProfile:UPDATE"
        ]
    },
    "usr_bob_456": {
        "roles": ["StandardUser"],
        "permissions": ["UserProfile:READ", "UserProfile:UPDATE"]
    },
    "usr_charlie_789": {
        "roles": ["Guest"],
        "permissions": ["UserProfile:READ"]
    }
}

user_roles: Dict[str, Dict[str, List[str]]] = dict(INITIAL_ROLES)


def emit_event(channel: str, name: str, payload: dict):
    """Dispatches domain event to centralized event broker."""
    try:
        req = urllib.request.Request(
            "http://localhost:3001/events",
            data=json.dumps({"channel": channel, "name": name, "payload": payload}).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        urllib.request.urlopen(req, timeout=1.0)
    except Exception:
        # Gracefully handle disconnected broker in standalone unit runs
        pass


@app.post(
    "/authz/check-permission",
    response_model=CheckPermissionResponse,
    summary="Evaluate access control policy",
    responses={
        200: {"description": "Access is permitted"},
        403: {"description": "Access is denied by security policy"},
        400: {"description": "Validation failed"}
    }
)
def check_permission(request: CheckPermissionRequest, response: Response):
    permitted, reason = evaluate_policy(
        user_id=request.user_id,
        role=request.role,
        action=request.action,
        resource=request.resource,
        resource_owner_id=request.resource_owner_id
    )

    decision = "PERMITTED" if permitted else "DENIED"
    evaluated_at = datetime.now(timezone.utc).isoformat()

    # Emit domain event to broker
    emit_event(
        channel="authz.events",
        name="AccessDecisionLogged",
        payload={
            "event_id": f"evt_authz_{int(datetime.now().timestamp() * 1000)}",
            "user_id": request.user_id,
            "role": request.role.value,
            "action": request.action.value,
            "resource": request.resource,
            "decision": decision,
            "timestamp": evaluated_at
        }
    )

    if not permitted:
        response.status_code = status.HTTP_403_FORBIDDEN

    return CheckPermissionResponse(
        decision=decision,
        user_id=request.user_id,
        action=request.action,
        resource=request.resource,
        reason=reason,
        evaluated_at=evaluated_at
    )


@app.get(
    "/authz/roles/{user_id}",
    response_model=UserRolesResponse,
    summary="Query assigned roles for a subject"
)
def get_user_roles(user_id: str):
    mapping = user_roles.get(user_id)
    if not mapping:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No role assignment found for user ID {user_id}"
        )
    return UserRolesResponse(
        user_id=user_id,
        roles=mapping["roles"],
        permissions=mapping["permissions"]
    )


@app.get(
    "/authz/permissions",
    response_model=PermissionsCatalogResponse,
    summary="List available roles and permissions"
)
def get_permissions_catalog():
    return PermissionsCatalogResponse(
        roles=["SecurityAdmin", "StandardUser", "Auditor", "Guest"],
        actions=["CREATE", "READ", "UPDATE", "DELETE"],
        resources=["UserRole", "SecurityPolicy", "UserProfile", "AuditLog"]
    )


@app.post("/internal/reset", summary="Reset in-memory state for test isolation")
def reset_state():
    global user_roles
    user_roles = dict(INITIAL_ROLES)
    return {"status": "reset", "service": "authz-python"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3002)
