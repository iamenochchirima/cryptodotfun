use actix_web::web::{self, ServiceConfig};
use crate::controllers::{
    health_check, api_info,
    auth::{initiate_auth, verify_auth, auth_status, logout},
    protected::{protected_endpoint, user_profile},
    users::{test_connection},
};

pub fn configure_routes(cfg: &mut ServiceConfig) {
    cfg
        .route("/", web::get().to(api_info))
        
        .route("/health", web::get().to(health_check))
        
        .service(
            web::scope("/api/auth")
                .route("/initiate", web::post().to(initiate_auth))
                .route("/verify", web::get().to(verify_auth))
                .route("/status", web::get().to(auth_status))
                .route("/logout", web::post().to(logout))
        )
        
        .service(
            web::scope("/api/protected")
                .route("/test", web::get().to(protected_endpoint))
                .route("/profile", web::get().to(user_profile))
        )
        
        .service(
            web::scope("/api/users")

        )
        
        .service(
            web::scope("/api/ic")
                .route("/test", web::get().to(test_connection))
        );
}
