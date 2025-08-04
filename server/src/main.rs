use actix_web::{get, App, HttpResponse, HttpServer, Responder};

#[get("/")]
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("Hello, Actix!")
}

#[actix_web::main]  // Uses tokio runtime
async fn main() -> std::io::Result<()> {
    println!("Server running at http://localhost:3000");

    HttpServer::new(|| {
        App::new()
            .service(hello)  // Register the route
    })
    .bind("127.0.0.1:3000")?  // Listen on localhost:3000
    .run()
    .await
}