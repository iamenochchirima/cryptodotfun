use redis::{Client, RedisError, aio::ConnectionManager};
use std::env;
use std::sync::Arc;
use tokio::sync::OnceCell;

static REDIS_CLIENT: OnceCell<Arc<RedisClient>> = OnceCell::const_new();

pub struct RedisClient {
    pub manager: ConnectionManager,
}

impl RedisClient {
    pub async fn new() -> Result<Self, RedisError> {
        let redis_url = env::var("REDIS_URL")
            .unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());
        
        println!("🔄 Connecting to Redis...");
        
        let client = Client::open(redis_url)?;
        let manager = ConnectionManager::new(client).await?;
        
        redis::cmd("PING")
            .query_async(&mut manager.clone())
            .await
            .map(|response: String| {
                println!("✅ Redis connected 🚀 - {}", response);
            })?;
        
        Ok(RedisClient { manager })
    }

    /// Initialize and store the global instance
    pub async fn initialize_global() -> Result<(), RedisError> {
        let client = Self::new().await?;
        REDIS_CLIENT.set(Arc::new(client)).map_err(|_| {
            RedisError::from((redis::ErrorKind::InvalidClientConfig, "Redis client already initialized"))
        })?;
        Ok(())
    }

    /// Get the global instance of the Redis client
    pub async fn instance() -> &'static Arc<RedisClient> {
        REDIS_CLIENT.get().expect("Redis client not initialized. Call RedisClient::initialize_global() first.")
    }

    pub async fn get(&self, key: &str) -> Result<Option<String>, RedisError> {
        let mut conn = self.manager.clone();
        redis::cmd("GET")
            .arg(key)
            .query_async(&mut conn)
            .await
    }

    pub async fn set(&self, key: &str, value: &str) -> Result<(), RedisError> {
        let mut conn = self.manager.clone();
        redis::cmd("SET")
            .arg(key)
            .arg(value)
            .query_async(&mut conn)
            .await
    }

    pub async fn set_ex(&self, key: &str, value: &str, seconds: u64) -> Result<(), RedisError> {
        let mut conn = self.manager.clone();
        redis::cmd("SET")
            .arg(key)
            .arg(value)
            .arg("EX")
            .arg(seconds)
            .query_async(&mut conn)
            .await
    }

    pub async fn del(&self, key: &str) -> Result<(), RedisError> {
        let mut conn = self.manager.clone();
        redis::cmd("DEL")
            .arg(key)
            .query_async(&mut conn)
            .await
    }

    pub async fn exists(&self, key: &str) -> Result<bool, RedisError> {
        let mut conn = self.manager.clone();
        redis::cmd("EXISTS")
            .arg(key)
            .query_async(&mut conn)
            .await
    }
}
