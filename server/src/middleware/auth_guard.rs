use actix_web::{HttpRequest, HttpResponse, Error, Result, dev::Payload};
use serde::{Deserialize, Serialize};
use serde_json::json;
use chrono::{DateTime, Utc};
use crate::redis::RedisClient;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthUser {
    pub principal: String,
    pub session_id: String,
    pub session_created: DateTime<Utc>,
    pub session_expires: DateTime<Utc>,
}

#[derive(Serialize, Deserialize)]
pub struct UserSession {
    pub session_id: String,
    pub principal: String,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
}

pub struct AuthenticatedUser(pub AuthUser);

impl actix_web::FromRequest for AuthenticatedUser {
    type Error = Error;
    type Future = std::pin::Pin<Box<dyn std::future::Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(req: &HttpRequest, _payload: &mut Payload) -> Self::Future {
        let req = req.clone();
        Box::pin(async move {
            let session_cookie = req.cookie("CRYPTO_DOT_FUN_SESSION");

            let session_id = match session_cookie {
                Some(cookie) => cookie.value().to_string(),
                None => {
                    return Err(actix_web::error::ErrorUnauthorized(json!({
                        "success": false,
                        "error": "Authentication required - no session cookie found"
                    }).to_string()));
                }
            };

            let redis_client = RedisClient::instance().await;
            let user_redis_key = format!("user_session:{}", session_id);
            
            let user_session_str = match redis_client.get(&user_redis_key).await {
                Ok(Some(data)) => data,
                Ok(None) => {
                    return Err(actix_web::error::ErrorUnauthorized(json!({
                        "success": false,
                        "error": "Authentication required - session not found or expired"
                    }).to_string()));
                },
                Err(e) => {
                    println!("❌ Redis error in auth guard: {}", e);
                    return Err(actix_web::error::ErrorInternalServerError(json!({
                        "success": false,
                        "error": "Internal server error during authentication check"
                    }).to_string()));
                }
            };

            let user_session: UserSession = match serde_json::from_str(&user_session_str) {
                Ok(session) => session,
                Err(e) => {
                    println!("❌ Failed to deserialize user session: {}", e);
                    // Clean up invalid session
                    let _ = redis_client.del(&user_redis_key).await;
                    return Err(actix_web::error::ErrorUnauthorized(json!({
                        "success": false,
                        "error": "Authentication required - invalid session data"
                    }).to_string()));
                }
            };

            if Utc::now() > user_session.expires_at {
                let _ = redis_client.del(&user_redis_key).await;
                return Err(actix_web::error::ErrorUnauthorized(json!({
                    "success": false,
                    "error": "Authentication required - session expired"
                }).to_string()));
            }

            let auth_user = AuthUser {
                principal: user_session.principal,
                session_id: user_session.session_id,
                session_created: user_session.created_at,
                session_expires: user_session.expires_at,
            };

            Ok(AuthenticatedUser(auth_user))
        })
    }
}
