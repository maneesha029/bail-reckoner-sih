"""
JWT auth middleware for the gateway.

Every request to /api/v1/* must carry a valid Bearer token EXCEPT the
login endpoint itself (you can't have a token before you've logged in).

On success, the decoded user_id/role are attached to request.state so
downstream code (or logging) can use them, and the ORIGINAL Authorization
header is still forwarded to the backend service untouched - the gateway
does not strip it, it only validates it.
"""
import json
import jwt
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from config import JWT_SECRET

# Paths that must work without a token.
PUBLIC_PATHS = {"/api/v1/auth/login", "/api/v1/auth/case-login"}


def _unauthorized(code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=401,
        content={"success": False, "data": None,
                 "error": {"code": code, "message": message}},
    )


class JWTAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return await call_next(request)

        if request.url.path in PUBLIC_PATHS:
            return await call_next(request)

        if not request.url.path.startswith("/api/v1/"):
            return await call_next(request)

        auth_header = request.headers.get("authorization", "")
        if not auth_header.startswith("Bearer "):
            return _unauthorized("MISSING_TOKEN", "Authorization header with a Bearer token is required.")

        token = auth_header.removeprefix("Bearer ").strip()
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return _unauthorized("TOKEN_EXPIRED", "Your session has expired. Please log in again.")
        except jwt.InvalidTokenError:
            return _unauthorized("INVALID_TOKEN", "The provided token is invalid.")

        request.state.user_id = payload.get("user_id")
        request.state.role = payload.get("role")
        scoped_case_id = payload.get("case_id")

        if scoped_case_id:
            # A token with a case_id claim (undertrial, or a case-assigned
            # legal_aid user) may never see the roster or another case.
            if request.url.path.rstrip("/").endswith("/cases"):
                return _unauthorized("CASE_SCOPE_VIOLATION", "This account cannot view the full case list.")

            path_parts = request.url.path.rstrip("/").split("/")
            if len(path_parts) >= 2 and path_parts[-1] not in ("check", "search", "requirements", "override"):
                if path_parts[-1] != scoped_case_id:
                    return _unauthorized("CASE_SCOPE_VIOLATION", "This account can only access its own case.")

            if request.method in ("POST", "PUT"):
                raw_body = await request.body()
                body_case_id = None
                if raw_body:
                    try:
                        body_case_id = json.loads(raw_body).get("case_id")
                    except (json.JSONDecodeError, AttributeError):
                        pass
                if body_case_id and body_case_id != scoped_case_id:
                    return _unauthorized("CASE_SCOPE_VIOLATION", "This account can only access its own case.")
                async def receive():
                    return {"type": "http.request", "body": raw_body}
                request._receive = receive

        return await call_next(request)