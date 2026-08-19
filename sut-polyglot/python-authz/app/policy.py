"""Policy evaluation logic for Python FastAPI AuthZ service."""

from typing import Optional, Tuple
from .models import UserRole, ActionVerb


def evaluate_policy(
    user_id: str,
    role: UserRole,
    action: ActionVerb,
    resource: str,
    resource_owner_id: Optional[str] = None
) -> Tuple[bool, str]:
    """Evaluates role-based and attribute-based permissions against security policy rules."""

    # 1. SecurityAdmin: unrestricted system-wide access
    if role == UserRole.SECURITY_ADMIN:
        return True, f"SecurityAdmin role has full {action.value} grant on {resource}"

    # 2. StandardUser: limited domain access and ownership scoping
    if role == UserRole.STANDARD_USER:
        if resource in ["SecurityPolicy", "UserRole"]:
            return False, f"StandardUser lacks {action.value} grant on restricted resource {resource}"

        if resource == "UserProfile":
            if action == ActionVerb.READ:
                return True, "StandardUser has READ grant on UserProfile"
            if action in [ActionVerb.UPDATE, ActionVerb.DELETE]:
                if resource_owner_id and resource_owner_id != user_id:
                    return False, f"StandardUser cannot modify profile owned by another user ({resource_owner_id})"
                return True, f"StandardUser is permitted to {action.value} own profile"

    # 3. Guest: read-only access to public profiles
    if role == UserRole.GUEST:
        if action == ActionVerb.READ and resource == "UserProfile":
            return True, "Guest has READ grant on public UserProfile"
        return False, f"Guest role cannot perform {action.value} on {resource}"

    # Default deny rule
    return False, f"Default deny: no matching policy rule for role {role.value} attempting {action.value} on {resource}"
