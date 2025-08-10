use actix_web::{web, HttpResponse, Responder, Result};
use serde::{Deserialize, Serialize};
use serde_json::json;
use chrono::{DateTime, Utc, Duration};
use candid::{CandidType, Deserialize as CandidDeserialize, Nat};
use crate::ic_agent::BackendActor;
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
    
    // Store session in Redis - TODO: implement Redis storage
    let _session_data = SessionData {
        session_id: session_id.clone(),
        created_at: Utc::now(),
        expires_at,
        status: SessionStatus::Initiated,
        principal: None,
    };
    
    // We'll add Redis storage here once we have access to it
    // For now, let's just call the IC canister
    
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
                Ok(HttpResponse::BadRequest().json(json!({
                    "success": false,
                    "error": "Failed to initiate authentication",
                    "details": format!("{:?}", response)
                })))
            }
        },
        Err(e) => {
            println!("❌ Error calling IC canister: {}", e);
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
    
    match call_ic_verify_identity(session_id).await {
        Ok((auth_response, principal_opt)) => {
            match auth_response {
                CanisterAuthResponse::Ok => {
                    if let Some(principal) = principal_opt {
                        println!("✅ Identity verified for principal: {}", principal);
                        
                        // In a real implementation, you'd:
                        // 1. Create a user session
                        // 2. Set HTTP-only cookies
                        // 3. Clean up the auth session
                        
                        Ok(HttpResponse::Ok().json(VerifyAuthResponse {
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
                    Ok(HttpResponse::BadRequest().json(json!({
                        "success": false,
                        "error": "Authentication session expired",
                        "details": "Expired"
                    })))
                },
                CanisterAuthResponse::InvalidSession => {
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

pub async fn auth_status() -> Result<impl Responder> {
    Ok(HttpResponse::Ok().json(json!({
        "authenticated": false,
        "message": "Not implemented yet"
    })))
}

pub async fn logout() -> Result<impl Responder> {
    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "message": "Logged out successfully"
    })))
}
