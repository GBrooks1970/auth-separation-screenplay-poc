"""Data models aligned with specs/authz-api_v1.yaml OpenAPI specification."""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class UserRole(str, Enum):
    SECURITY_ADMIN = "SecurityAdmin"
    STANDARD_USER = "StandardUser"
    AUDITOR = "Auditor"
    GUEST = "Guest"


class ActionVerb(str, Enum):
    CREATE = "CREATE"
    READ = "READ"
    UPDATE = "UPDATE"
    DELETE = "DELETE"


class CheckPermissionRequest(BaseModel):
    user_id: str = Field(..., description="Subject user ID")
    role: UserRole = Field(..., description="User role under evaluation")
    action: ActionVerb = Field(..., description="Action verb")
    resource: str = Field(..., description="Target resource name")
    resource_owner_id: Optional[str] = Field(None, description="Owner of the target resource for dynamic ABAC checks")


class CheckPermissionResponse(BaseModel):
    decision: str = Field(..., description="Evaluation outcome: PERMITTED or DENIED")
    user_id: str
    action: ActionVerb
    resource: str
    reason: str
    evaluated_at: str


class UserRolesResponse(BaseModel):
    user_id: str
    roles: List[str]
    permissions: List[str]


class PermissionsCatalogResponse(BaseModel):
    roles: List[str]
    actions: List[str]
    resources: List[str]
