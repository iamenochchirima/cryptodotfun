// Récupérer la variable d'environnement de manière sécurisée
export const getDatabaseUrl = () => {
    const url = process.env.DATABASE_URL
    if (!url) {
      console.error("DATABASE_URL is not defined")
      throw new Error("Configuration error: DATABASE_URL is not defined")
    }
    return url
  }
  