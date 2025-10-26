use actix_web::{web, HttpResponse, Responder};
use actix_multipart::Multipart;
use futures_util::StreamExt;
use bytes::BytesMut;
use std::collections::HashMap;

use crate::storage::R2Client;

pub async fn upload_draft_image(
    r2_client: web::Data<R2Client>,
    mut payload: Multipart,
) -> impl Responder {
    let mut file_data = BytesMut::new();
    let mut content_type = String::from("application/octet-stream");
    let mut filename = String::new();

    while let Some(item) = payload.next().await {
        let mut field = match item {
            Ok(field) => field,
            Err(e) => {
                return HttpResponse::BadRequest().json(serde_json::json!({
                    "error": format!("Error reading multipart field: {}", e)
                }));
            }
        };

        if let Some(ct) = field.content_type() {
            content_type = ct.to_string();
        }

        if let Some(cd) = field.content_disposition() {
            if let Some(fname) = cd.get_filename() {
                filename = fname.to_string();
            }
        }

        while let Some(chunk) = field.next().await {
            let data = match chunk {
                Ok(data) => data,
                Err(e) => {
                    return HttpResponse::InternalServerError().json(serde_json::json!({
                        "error": format!("Error reading chunk: {}", e)
                    }));
                }
            };
            file_data.extend_from_slice(&data);
        }
    }

    if file_data.is_empty() {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "error": "No file data received"
        }));
    }

    match r2_client.upload_file(file_data.freeze(), &content_type, "drafts").await {
        Ok(url) => HttpResponse::Ok().json(serde_json::json!({
            "url": url,
            "filename": filename
        })),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("Failed to upload file: {}", e)
        }))
    }
}

pub async fn batch_upload_nft_assets(
    r2_client: web::Data<R2Client>,
    mut payload: Multipart,
) -> impl Responder {
    let mut uploaded_files = Vec::new();
    let mut failed_files = Vec::new();

    while let Some(item) = payload.next().await {
        let mut field = match item {
            Ok(field) => field,
            Err(e) => {
                return HttpResponse::BadRequest().json(serde_json::json!({
                    "error": format!("Error reading multipart field: {}", e)
                }));
            }
        };

        let mut file_data = BytesMut::new();
        let mut content_type = String::from("image/png");
        let mut filename = String::new();

        if let Some(ct) = field.content_type() {
            content_type = ct.to_string();
        }

        if let Some(cd) = field.content_disposition() {
            if let Some(fname) = cd.get_filename() {
                filename = fname.to_string();
            }
        }

        while let Some(chunk) = field.next().await {
            let data = match chunk {
                Ok(data) => data,
                Err(e) => {
                    failed_files.push(serde_json::json!({
                        "filename": filename,
                        "error": format!("Error reading chunk: {}", e)
                    }));
                    continue;
                }
            };
            file_data.extend_from_slice(&data);
        }

        if file_data.is_empty() {
            continue;
        }

        match r2_client.upload_file(file_data.freeze(), &content_type, "nft-assets").await {
            Ok(url) => {
                uploaded_files.push(serde_json::json!({
                    "filename": filename,
                    "url": url
                }));
            }
            Err(e) => {
                failed_files.push(serde_json::json!({
                    "filename": filename,
                    "error": format!("Failed to upload: {}", e)
                }));
            }
        }
    }

    HttpResponse::Ok().json(serde_json::json!({
        "uploaded": uploaded_files,
        "failed": failed_files,
        "total_uploaded": uploaded_files.len(),
        "total_failed": failed_files.len()
    }))
}
