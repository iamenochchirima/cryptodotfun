use actix_web::{web, HttpResponse, Responder};
use sqlx::PgPool;
use uuid::Uuid;

use crate::db::{CollectionDraft, CreateDraftRequest, UpdateDraftRequest};
use crate::storage::R2Client;

pub async fn create_draft(
    pool: web::Data<PgPool>,
    req: web::Json<CreateDraftRequest>,
) -> impl Responder {
    let metadata = req.metadata.clone().unwrap_or(serde_json::json!({}));

    let result = sqlx::query_as::<_, CollectionDraft>(
        r#"
        INSERT INTO collection_drafts (
            user_id, blockchain, nft_standard, name, symbol, description,
            supply, mint_price, royalty_bps, collection_image_url, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
        "#
    )
    .bind(&req.user_id)
    .bind(&req.blockchain)
    .bind(&req.nft_standard)
    .bind(&req.name)
    .bind(&req.symbol)
    .bind(&req.description)
    .bind(req.supply)
    .bind(&req.mint_price)
    .bind(req.royalty_bps)
    .bind(&req.collection_image_url)
    .bind(&metadata)
    .fetch_one(pool.get_ref())
    .await;

    match result {
        Ok(draft) => HttpResponse::Ok().json(draft),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("Failed to create draft: {}", e)
        }))
    }
}

pub async fn get_draft(
    pool: web::Data<PgPool>,
    draft_id: web::Path<Uuid>,
) -> impl Responder {
    let result = sqlx::query_as::<_, CollectionDraft>(
        "SELECT * FROM collection_drafts WHERE id = $1"
    )
    .bind(draft_id.into_inner())
    .fetch_optional(pool.get_ref())
    .await;

    match result {
        Ok(Some(draft)) => HttpResponse::Ok().json(draft),
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({
            "error": "Draft not found"
        })),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("Failed to fetch draft: {}", e)
        }))
    }
}

pub async fn get_user_drafts(
    pool: web::Data<PgPool>,
    user_id: web::Path<String>,
) -> impl Responder {
    let result = sqlx::query_as::<_, CollectionDraft>(
        "SELECT * FROM collection_drafts WHERE user_id = $1 ORDER BY created_at DESC"
    )
    .bind(user_id.into_inner())
    .fetch_all(pool.get_ref())
    .await;

    match result {
        Ok(drafts) => HttpResponse::Ok().json(drafts),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("Failed to fetch drafts: {}", e)
        }))
    }
}

pub async fn update_draft(
    pool: web::Data<PgPool>,
    draft_id: web::Path<Uuid>,
    req: web::Json<UpdateDraftRequest>,
) -> impl Responder {
    let mut set_clauses = Vec::new();
    let mut bind_count = 1;

    if req.name.is_some() {
        set_clauses.push(format!("name = ${}", bind_count));
        bind_count += 1;
    }
    if req.symbol.is_some() {
        set_clauses.push(format!("symbol = ${}", bind_count));
        bind_count += 1;
    }
    if req.description.is_some() {
        set_clauses.push(format!("description = ${}", bind_count));
        bind_count += 1;
    }
    if req.supply.is_some() {
        set_clauses.push(format!("supply = ${}", bind_count));
        bind_count += 1;
    }
    if req.mint_price.is_some() {
        set_clauses.push(format!("mint_price = ${}", bind_count));
        bind_count += 1;
    }
    if req.royalty_bps.is_some() {
        set_clauses.push(format!("royalty_bps = ${}", bind_count));
        bind_count += 1;
    }
    if req.collection_image_url.is_some() {
        set_clauses.push(format!("collection_image_url = ${}", bind_count));
        bind_count += 1;
    }
    if req.metadata.is_some() {
        set_clauses.push(format!("metadata = ${}", bind_count));
        bind_count += 1;
    }
    if req.status.is_some() {
        set_clauses.push(format!("status = ${}", bind_count));
        bind_count += 1;
    }

    if set_clauses.is_empty() {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "error": "No fields to update"
        }));
    }

    let query = format!(
        "UPDATE collection_drafts SET {}, updated_at = NOW() WHERE id = ${} RETURNING *",
        set_clauses.join(", "),
        bind_count
    );

    let mut sqlx_query = sqlx::query_as::<_, CollectionDraft>(&query);

    if let Some(ref v) = req.name { sqlx_query = sqlx_query.bind(v); }
    if let Some(ref v) = req.symbol { sqlx_query = sqlx_query.bind(v); }
    if let Some(ref v) = req.description { sqlx_query = sqlx_query.bind(v); }
    if let Some(v) = req.supply { sqlx_query = sqlx_query.bind(v); }
    if let Some(ref v) = req.mint_price { sqlx_query = sqlx_query.bind(v); }
    if let Some(v) = req.royalty_bps { sqlx_query = sqlx_query.bind(v); }
    if let Some(ref v) = req.collection_image_url { sqlx_query = sqlx_query.bind(v); }
    if let Some(ref v) = req.metadata { sqlx_query = sqlx_query.bind(v); }
    if let Some(ref v) = req.status { sqlx_query = sqlx_query.bind(v); }

    sqlx_query = sqlx_query.bind(draft_id.into_inner());

    let result = sqlx_query.fetch_optional(pool.get_ref()).await;

    match result {
        Ok(Some(draft)) => HttpResponse::Ok().json(draft),
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({
            "error": "Draft not found"
        })),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("Failed to update draft: {}", e)
        }))
    }
}

pub async fn delete_draft(
    pool: web::Data<PgPool>,
    r2_client: web::Data<R2Client>,
    draft_id: web::Path<Uuid>,
) -> impl Responder {
    let draft_result = sqlx::query_as::<_, CollectionDraft>(
        "SELECT * FROM collection_drafts WHERE id = $1"
    )
    .bind(draft_id.as_ref())
    .fetch_optional(pool.get_ref())
    .await;

    let draft = match draft_result {
        Ok(Some(d)) => d,
        Ok(None) => {
            return HttpResponse::NotFound().json(serde_json::json!({
                "error": "Draft not found"
            }));
        }
        Err(e) => {
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "error": format!("Failed to fetch draft: {}", e)
            }));
        }
    };

    if let Some(image_url) = &draft.collection_image_url {
        if let Err(e) = r2_client.delete_file(image_url).await {
            eprintln!("Failed to delete R2 file {}: {}", image_url, e);
        }
    }

    if let Some(metadata) = draft.metadata.as_object() {
        if let Some(assets) = metadata.get("nft_assets_urls") {
            if let Some(urls) = assets.as_array() {
                let url_strings: Vec<String> = urls
                    .iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect();

                if let Err(e) = r2_client.delete_files(url_strings).await {
                    eprintln!("Failed to delete R2 assets: {}", e);
                }
            }
        }
    }

    let result = sqlx::query("DELETE FROM collection_drafts WHERE id = $1")
        .bind(draft_id.into_inner())
        .execute(pool.get_ref())
        .await;

    match result {
        Ok(res) if res.rows_affected() > 0 => HttpResponse::Ok().json(serde_json::json!({
            "message": "Draft deleted successfully"
        })),
        Ok(_) => HttpResponse::NotFound().json(serde_json::json!({
            "error": "Draft not found"
        })),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("Failed to delete draft: {}", e)
        }))
    }
}
