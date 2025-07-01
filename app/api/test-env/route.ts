import { getDatabaseUrl } from "@/lib/db/db";

export async function GET() {
    // const secret = process.env.SECRET_API_KEY;
    const dbUrl = process.env.DATABASE_URL;

    const dd = getDatabaseUrl();

    console.log("Database URL from function:", dd);

    console.log("Secret API Key:", secret);
    console.log("Database URL:", dbUrl);
  
    if ( !dbUrl) {
      return Response.json(
        { error: "Environment variables missing!" },
        { status: 500 }
      );
    }
  
    return Response.json({

      dbUrl: dbUrl, // (Avoid exposing real DB URLs in production!)
    });
  }
