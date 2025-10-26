use aws_sdk_s3::{Client, config::{Credentials, Region, BehaviorVersion}, Config};
use bytes::Bytes;
use std::env;
use uuid::Uuid;

#[derive(Clone)]
pub struct R2Client {
    client: Client,
    bucket_name: String,
    public_url: String,
}

impl R2Client {
    pub async fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let account_id = env::var("R2_ACCOUNT_ID")?;
        let access_key_id = env::var("R2_ACCESS_KEY_ID")?;
        let secret_access_key = env::var("R2_SECRET_ACCESS_KEY")?;
        let bucket_name = env::var("R2_BUCKET_NAME")?;
        let public_url = env::var("R2_PUBLIC_URL")?;

        let credentials = Credentials::new(
            access_key_id,
            secret_access_key,
            None,
            None,
            "r2",
        );

        let endpoint_url = format!("https://{}.r2.cloudflarestorage.com", account_id);

        let config = Config::builder()
            .credentials_provider(credentials)
            .region(Region::new("auto"))
            .endpoint_url(endpoint_url)
            .behavior_version(BehaviorVersion::latest())
            .build();

        let client = Client::from_conf(config);

        Ok(Self {
            client,
            bucket_name,
            public_url,
        })
    }

    pub async fn upload_file(
        &self,
        file_data: Bytes,
        content_type: &str,
        folder: &str,
    ) -> Result<String, Box<dyn std::error::Error>> {
        let file_id = Uuid::new_v4();
        let extension = self.get_extension_from_content_type(content_type);
        let key = format!("{}/{}.{}", folder, file_id, extension);

        self.client
            .put_object()
            .bucket(&self.bucket_name)
            .key(&key)
            .body(file_data.into())
            .content_type(content_type)
            .send()
            .await?;

        let url = format!("{}/{}", self.public_url, key);
        Ok(url)
    }

    pub async fn delete_file(&self, url: &str) -> Result<(), Box<dyn std::error::Error>> {
        let key = url.replace(&format!("{}/", self.public_url), "");

        self.client
            .delete_object()
            .bucket(&self.bucket_name)
            .key(&key)
            .send()
            .await?;

        Ok(())
    }

    pub async fn delete_files(&self, urls: Vec<String>) -> Result<(), Box<dyn std::error::Error>> {
        for url in urls {
            if let Err(e) = self.delete_file(&url).await {
                eprintln!("Failed to delete file {}: {}", url, e);
            }
        }
        Ok(())
    }

    fn get_extension_from_content_type(&self, content_type: &str) -> &str {
        match content_type {
            "image/jpeg" => "jpg",
            "image/png" => "png",
            "image/gif" => "gif",
            "image/webp" => "webp",
            _ => "bin",
        }
    }
}
