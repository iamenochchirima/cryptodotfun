use actix_web::{web, HttpResponse, Responder, Result, HttpRequest, cookie::Cookie};
use serde::{Deserialize, Serialize};
use serde_json::json;
use chrono::{DateTime, Utc, Duration};
use candid::{CandidType, Deserialize as CandidDeserialize};
use crate::ic_agent::BackendActor;
use crate::redis::RedisClient;
use rand::{Rng, thread_rng};

#[derive(Deserialize)]
pub struct LoginRequest {
    pub principal: String,
    pub signature: Option<String>,
}

#[derive(Deserialize)]
pub struct InitAuthRequest {
    pub expiration_minutes: Option<u32>,
}

#[derive(Serialize)]
pub struct AuthResponse {
    pub success: bool,
    pub message: String,
    pub user_id: Option<String>,
}

#[derive(Serialize)]
pub struct InitAuthResponse {
    pub success: bool,
    pub session_id: String,
    pub expires_at: String,
    pub message: String,
}

#[derive(Serialize)]
pub struct VerifyAuthResponse {
    pub success: bool,
    pub principal: Option<String>,
    pub message: String,
}

#[derive(Serialize, Deserialize)]
pub struct SessionData {
    pub session_id: String,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub status: SessionStatus,
    pub principal: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub enum SessionStatus {
    #[serde(rename = "initiated")]
    Initiated,
    #[serde(rename = "confirmed")]
    Confirmed,
    #[serde(rename = "verified")]
    Verified,
}

#[derive(Serialize, Deserialize)]
pub struct UserSession {
    pub session_id: String,
    pub principal: String,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
}

// Define the AuthResponse type from the canister
#[derive(CandidType, CandidDeserialize, Debug)]
pub enum CanisterAuthResponse {
    Ok,
    Unauthorized,
    Expired,
    NotConfirmed,
    InvalidSession,
}

// Generate secure session ID
fn generate_session_id() -> String {
    let mut rng = thread_rng();
    let random_bytes: [u8; 32] = rng.gen();
    hex::encode(random_bytes)
}

pub async fn initiate_auth(req: web::Json<InitAuthRequest>) -> Result<impl Responder> {
    println!("🔄 Initiating authentication...");
    
    let session_id = generate_session_id();
    let expiration_minutes = req.expiration_minutes.unwrap_or(5) as i64;
    let expires_at = Utc::now() + Duration::minutes(expiration_minutes);
    
    // Store session in Redis
    let session_data = SessionData {
        session_id: session_id.clone(),
        created_at: Utc::now(),
        expires_at,
        status: SessionStatus::Initiated,
        principal: None,
    };
    
    // Store in Redis with expiration
    let redis_client = RedisClient::instance().await;
    let session_json = serde_json::to_string(&session_data)
        .map_err(|e| {
            println!("❌ Failed to serialize session data: {}", e);
            e
        });
    
    match session_json {
        Ok(json_data) => {
            let redis_key = format!("auth_session:{}", session_id);
            if let Err(e) = redis_client.set_ex(&redis_key, &json_data, (expiration_minutes * 60) as u64).await {
                println!("❌ Failed to store session in Redis: {}", e);
                return Ok(HttpResponse::InternalServerError().json(json!({
                    "success": false,
                    "error": "Failed to store session",
                    "details": e.to_string()
                })));
            }
            println!("✅ Session stored in Redis: {}", redis_key);
        },
        Err(e) => {
            return Ok(HttpResponse::InternalServerError().json(json!({
                "success": false,
                "error": "Failed to serialize session data",
                "details": e.to_string()
            })));
        }
    }
    
    match call_ic_initiate_auth(&session_id, expiration_minutes as u64).await {
        Ok(response) => match response {
            CanisterAuthResponse::Ok => {
                println!("✅ IC authentication initiated successfully");
                Ok(HttpResponse::Ok().json(InitAuthResponse {
                    success: true,
                    session_id,
                    expires_at: expires_at.to_rfc3339(),
                    message: "Authentication session initiated. User should call confirmIdentity with this sessionId.".to_string(),
                }))
            },
            _ => {
                println!("❌ IC authentication initiation failed: {:?}", response);
                // Clean up Redis session on failure
                let redis_key = format!("auth_session:{}", session_id);
                let _ = redis_client.del(&redis_key).await;
                Ok(HttpResponse::BadRequest().json(json!({
                    "success": false,
                    "error": "Failed to initiate authentication",
                    "details": format!("{:?}", response)
                })))
            }
        },
        Err(e) => {
            println!("❌ Error calling IC canister: {}", e);
            // Clean up Redis session on failure
            let redis_key = format!("auth_session:{}", session_id);
            let _ = redis_client.del(&redis_key).await;
            Ok(HttpResponse::InternalServerError().json(json!({
                "success": false,
                "error": "Internal server error",
                "details": e.to_string()
            })))
        }
    }
}

async fn call_ic_initiate_auth(session_id: &str, expiration_minutes: u64) -> Result<CanisterAuthResponse, Box<dyn std::error::Error + Send + Sync>> {
    let backend_actor = BackendActor::instance().await;
    
    let expiration_nanoseconds = expiration_minutes * 60 * 1000 * 1000 * 1000; // Convert to nanoseconds
    let expiration_nat = candid::Nat::from(expiration_nanoseconds);
    
    println!("🔄 Calling IC initiateAuth with:");
    println!("  sessionId: '{}'", session_id);
    println!("  expirationNanoseconds: {:?}", Some(expiration_nat.clone()));
    
    // Try using the lower-level ic-agent API
    use candid::Encode;
    let args = Encode!(&session_id, &Some(expiration_nat))?;
    
    let response = backend_actor.agent
        .update(&backend_actor.canister_id, "initiateAuth")
        .with_arg(args)
        .call_and_wait()
        .await
        .map_err(|e| {
            println!("❌ IC call error: {}", e);
            e
        })?;

    // Decode the response
    use candid::Decode;
    let result: CanisterAuthResponse = Decode!(response.as_slice(), CanisterAuthResponse)
        .map_err(|e| format!("Failed to decode response: {}", e))?;

    println!("✅ IC initiateAuth response: {:?}", result);
    Ok(result)
}

pub async fn verify_auth(req: web::Query<std::collections::HashMap<String, String>>) -> Result<impl Responder> {
    let session_id = match req.get("sessionId") {
        Some(id) => id,
        None => {
            return Ok(HttpResponse::BadRequest().json(json!({
                "success": false,
                "error": "Session ID is required"
            })));
        }
    };
    
    println!("🔍 Verifying identity for sessionId: {}", session_id);
    
    // Get session from Redis
    let redis_client = RedisClient::instance().await;
    let redis_key = format!("auth_session:{}", session_id);
    
    let session_data_str = match redis_client.get(&redis_key).await {
        Ok(Some(data)) => data,
        Ok(None) => {
            return Ok(HttpResponse::BadRequest().json(json!({
                "success": false,
                "error": "Session not found or expired"
            })));
        },
        Err(e) => {
            println!("❌ Failed to get session from Redis: {}", e);
            return Ok(HttpResponse::InternalServerError().json(json!({
                "success": false,
                "error": "Internal server error",
                "details": e.to_string()
            })));
        }
    };
    
    let session_data: SessionData = match serde_json::from_str(&session_data_str) {
        Ok(data) => data,
        Err(e) => {
            println!("❌ Failed to deserialize session data: {}", e);
            // Clean up invalid session
            let _ = redis_client.del(&redis_key).await;
            return Ok(HttpResponse::BadRequest().json(json!({
                "success": false,
                "error": "Invalid session data"
            })));
        }
    };
    
    // Check if session expired
    if Utc::now() > session_data.expires_at {
        let _ = redis_client.del(&redis_key).await;
        return Ok(HttpResponse::BadRequest().json(json!({
            "success": false,
            "error": "Authentication session expired",
            "details": "Expired"
        })));
    }
    
    match call_ic_verify_identity(session_id).await {
        Ok((auth_response, principal_opt)) => {
            match auth_response {
                CanisterAuthResponse::Ok => {
                    if let Some(principal) = principal_opt {
                        println!("✅ Identity verified for principal: {}", principal);
                        
                        // 1. Create a user session with longer expiration (7 days)
                        let user_session_id = generate_session_id();
                        let user_session_expiry = Utc::now() + Duration::days(7);
                        
                        let user_session = UserSession {
                            session_id: user_session_id.clone(),
                            principal: principal.clone(),
                            created_at: Utc::now(),
                            expires_at: user_session_expiry,
                        };
                        
                        // Store user session in Redis (expires in 7 days)
                        let user_session_json = match serde_json::to_string(&user_session) {
                            Ok(json) => json,
                            Err(e) => {
                                println!("❌ Failed to serialize user session: {}", e);
                                return Ok(HttpResponse::InternalServerError().json(json!({
                                    "success": false,
                                    "error": "Failed to create user session"
                                })));
                            }
                        };
                        
                        let user_redis_key = format!("user_session:{}", user_session_id);
                        if let Err(e) = redis_client.set_ex(&user_redis_key, &user_session_json, 7 * 24 * 60 * 60).await {
                            println!("❌ Failed to store user session: {}", e);
                            return Ok(HttpResponse::InternalServerError().json(json!({
                                "success": false,
                                "error": "Failed to store user session",
                                "details": e.to_string()
                            })));
                        }
                        
                        // 2. Set HTTP-only cookie
                        let cookie = Cookie::build("CRYPTO_DOT_FUN_SESSION", user_session_id.clone())
                            .http_only(true)
                            .secure(false) // Set to true in production with HTTPS
                            .same_site(actix_web::cookie::SameSite::Strict)
                            .max_age(actix_web::cookie::time::Duration::days(7))
                            .path("/")
                            .finish();
                        
                        // 3. Clean up the auth session
                        let _ = redis_client.del(&redis_key).await;
                        
                        println!("✅ User session created: {}", user_redis_key);
                        
                        Ok(HttpResponse::Ok()
                            .cookie(cookie)
                            .json(VerifyAuthResponse {
                                success: true,
                                principal: Some(principal),
                                message: "Identity verified successfully and session created".to_string(),
                            }))
                    } else {
                        Ok(HttpResponse::BadRequest().json(json!({
                            "success": false,
                            "error": "No principal returned from verification"
                        })))
                    }
                },
                CanisterAuthResponse::NotConfirmed => {
                    Ok(HttpResponse::BadRequest().json(json!({
                        "success": false,
                        "error": "User has not confirmed their identity yet",
                        "details": "NotConfirmed"
                    })))
                },
                CanisterAuthResponse::Expired => {
                    // Clean up expired session
                    let _ = redis_client.del(&redis_key).await;
                    Ok(HttpResponse::BadRequest().json(json!({
                        "success": false,
                        "error": "Authentication session expired",
                        "details": "Expired"
                    })))
                },
                CanisterAuthResponse::InvalidSession => {
                    // Clean up invalid session
                    let _ = redis_client.del(&redis_key).await;
                    Ok(HttpResponse::BadRequest().json(json!({
                        "success": false,
                        "error": "Invalid session ID",
                        "details": "InvalidSession"
                    })))
                },
                CanisterAuthResponse::Unauthorized => {
                    Ok(HttpResponse::BadRequest().json(json!({
                        "success": false,
                        "error": "Unauthorized to verify this session",
                        "details": "Unauthorized"
                    })))
                },
            }
        },
        Err(e) => {
            println!("❌ Error verifying identity: {}", e);
            Ok(HttpResponse::InternalServerError().json(json!({
                "success": false,
                "error": "Internal server error",
                "details": e.to_string()
            })))
        }
    }
}

async fn call_ic_verify_identity(session_id: &str) -> Result<(CanisterAuthResponse, Option<String>), Box<dyn std::error::Error + Send + Sync>> {
    let backend_actor = BackendActor::instance().await;
    
    println!("🔍 Calling IC verifyIdentity with sessionId: '{}'", session_id);
    
    // Use the lower-level ic-agent API
    use candid::Encode;
    let args = Encode!(&session_id)?;
    
    let response = backend_actor.agent
        .update(&backend_actor.canister_id, "verifyIdentity")
        .with_arg(args)
        .call_and_wait()
        .await
        .map_err(|e| {
            println!("❌ IC verifyIdentity call error: {}", e);
            e
        })?;

    // Decode the response: (Response, opt principal)
    use candid::Decode;
    let (auth_response, principal_opt): (CanisterAuthResponse, Option<candid::Principal>) = 
        Decode!(response.as_slice(), CanisterAuthResponse, Option<candid::Principal>)
            .map_err(|e| format!("Failed to decode response: {}", e))?;

    let principal_string = principal_opt.map(|p| p.to_text());
    
    println!("✅ IC verifyIdentity response: {:?}, principal: {:?}", auth_response, principal_string);
    
    Ok((auth_response, principal_string))
}

pub async fn auth_status(req: HttpRequest) -> Result<impl Responder> {
    // Check if user has a valid session cookie
    let session_cookie = req.cookie("CRYPTO_DOT_FUN_SESSION");
    
    match session_cookie {
        Some(cookie) => {
            let session_id = cookie.value();
            let redis_client = RedisClient::instance().await;
            let user_redis_key = format!("user_session:{}", session_id);
            
            match redis_client.get(&user_redis_key).await {
                Ok(Some(session_str)) => {
                    match serde_json::from_str::<UserSession>(&session_str) {
                        Ok(user_session) => {
                            // Check if session is still valid
                            if Utc::now() <= user_session.expires_at {
                                Ok(HttpResponse::Ok().json(json!({
                                    "authenticated": true,
                                    "principal": user_session.principal,
                                    "expires_at": user_session.expires_at.to_rfc3339(),
                                    "message": "User is authenticated"
                                })))
                            } else {
                                // Session expired, clean it up
                                let _ = redis_client.del(&user_redis_key).await;
                                Ok(HttpResponse::Ok()
                                    .cookie(
                                        Cookie::build("CRYPTO_DOT_FUN_SESSION", "")
                                            .max_age(actix_web::cookie::time::Duration::ZERO)
                                            .path("/")
                                            .finish()
                                    )
                                    .json(json!({
                                        "authenticated": false,
                                        "message": "Session expired"
                                    })))
                            }
                        },
                        Err(_) => {
                            // Invalid session data, clean it up
                            let _ = redis_client.del(&user_redis_key).await;
                            Ok(HttpResponse::Ok()
                                .cookie(
                                    Cookie::build("CRYPTO_DOT_FUN_SESSION", "")
                                        .max_age(actix_web::cookie::time::Duration::ZERO)
                                        .path("/")
                                        .finish()
                                )
                                .json(json!({
                                    "authenticated": false,
                                    "message": "Invalid session data"
                                })))
                        }
                    }
                },
                Ok(None) => {
                    // No session found
                    Ok(HttpResponse::Ok()
                        .cookie(
                            Cookie::build("CRYPTO_DOT_FUN_SESSION", "")
                                .max_age(actix_web::cookie::time::Duration::ZERO)
                                .path("/")
                                .finish()
                        )
                        .json(json!({
                            "authenticated": false,
                            "message": "No valid session found"
                        })))
                },
                Err(e) => {
                    println!("❌ Redis error checking auth status: {}", e);
                    Ok(HttpResponse::InternalServerError().json(json!({
                        "error": "Failed to check authentication status"
                    })))
                }
            }
        },
        None => {
            Ok(HttpResponse::Ok().json(json!({
                "authenticated": false,
                "message": "No session cookie found"
            })))
        }
    }
}

pub async fn logout(req: HttpRequest) -> Result<impl Responder> {
    let session_cookie = req.cookie("CRYPTO_DOT_FUN_SESSION");
    
    match session_cookie {
        Some(cookie) => {
            let session_id = cookie.value();
            let redis_client = RedisClient::instance().await;
            let user_redis_key = format!("user_session:{}", session_id);
            
            // Delete session from Redis
            if let Err(e) = redis_client.del(&user_redis_key).await {
                println!("❌ Failed to delete session from Redis: {}", e);
            }
            
            // Clear the cookie
            Ok(HttpResponse::Ok()
                .cookie(
                    Cookie::build("CRYPTO_DOT_FUN_SESSION", "")
                        .max_age(actix_web::cookie::time::Duration::ZERO)
                        .path("/")
                        .finish()
                )
                .json(json!({
                    "success": true,
                    "message": "Logged out successfully"
                })))
        },
        None => {
            Ok(HttpResponse::Ok().json(json!({
                "success": true,
                "message": "No active session found"
            })))
        }
    }
}
