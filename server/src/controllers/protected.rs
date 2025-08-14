use actix_web::{HttpResponse, Responder, Result};
use serde_json::json;
use crate::middleware::{AuthenticatedUser};

pub async fn protected_endpoint(user: AuthenticatedUser) -> Result<impl Responder> {
    let auth_user = &user.0;
    
    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "message": "This is a protected endpoint",
        "user": {
            "principal": auth_user.principal,
            "session_id": auth_user.session_id,
            "session_created": auth_user.session_created.to_rfc3339(),
            "session_expires": auth_user.session_expires.to_rfc3339()
        }
    })))
}

pub async fn user_profile(user: AuthenticatedUser) -> Result<impl Responder> {
    let auth_user = &user.0;
    
    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "profile": {
            "principal": auth_user.principal,
            "authenticated_at": auth_user.session_created.to_rfc3339(),
            "session_expires": auth_user.session_expires.to_rfc3339(),
            "session_valid": true
        }
    })))
}
