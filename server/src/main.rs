use actix_web::{middleware::Logger, App, HttpServer};
use env_logger::Env;
use dotenv::dotenv;

mod controllers;
mod routes;
mod config;
mod redis;

use config::AppConfig;
use routes::configure_routes;
use redis::RedisClient;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    
    env_logger::init_from_env(Env::default().default_filter_or("info"));

    let config = AppConfig::from_env();

    let _redis_client = match RedisClient::new().await {
        Ok(client) => {
            println!("✅ Redis connection established successfully!");
            client
        },
        Err(e) => {
            eprintln!("❌ Failed to connect to Redis: {}", e);
            eprintln!("🔄 Server will continue without Redis...");
            return Err(std::io::Error::new(
                std::io::ErrorKind::ConnectionRefused,
                format!("Redis connection failed: {}", e)
            ));
        }
    };

    println!("🚀 Server starting at http://localhost:{}", config.port);
    println!("🌍 Environment: {}", config.environment);

    HttpServer::new(|| {
        App::new()
            // Add logging middleware
            .wrap(Logger::default())
            // Configure all routes
            .configure(configure_routes)
    })
    .bind(format!("localhost:{}", config.port))?
    .run()
    .await
}