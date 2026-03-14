import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    GOOGLE_GENAI_USE_VERTEXAI: str = os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "FALSE")

    # Models
    FAST_MODEL: str = "gemini-2.5-flash"
    PRO_MODEL: str = "gemini-2.5-flash"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8080
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:9000",
    ]

    # Output
    OUTPUT_DIR: str = os.path.join(os.path.dirname(__file__), "..", "..", "output")

    # Cache
    CACHE_DIR: str = os.path.join(os.path.dirname(__file__), "..", "..", "cache")
    CACHE_TTL_HOURS: int = int(os.getenv("CACHE_TTL_HOURS", "48"))


settings = Settings()
