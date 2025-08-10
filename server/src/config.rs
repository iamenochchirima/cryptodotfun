use std::env;

/// Application configuration
#[derive(Debug, Clone)]
pub struct AppConfig {
    pub port: u16,
    pub environment: String,
    pub identity_key: String,
    pub redis_url: String,
}

impl AppConfig {
    pub fn from_env() -> Self {
        Self {
            port: env::var("PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()
                .expect("PORT must be a valid number"),
            environment: env::var("ENVIRONMENT").unwrap_or_else(|_| "local".to_string()),
            identity_key: env::var("IDENTITY_KEY").unwrap_or_else(|_| "default_key".to_string()),
            redis_url: env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".to_string()),
        }
    }
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            port: 8080,
            environment: "local".to_string(),
            identity_key: "default_key".to_string(),
            redis_url: "redis://localhost:6379".to_string(),
        }
    }
}
