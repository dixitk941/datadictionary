import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    MISTRAL_API_KEY: str = os.getenv("MISTRAL_API_KEY", "")

    # Comma-separated extra origins via env on Railway
    # e.g. CORS_ORIGINS_EXTRA=https://aitoolcraft.com,https://www.aitoolcraft.com
    _extra = [o.strip() for o in os.getenv("CORS_ORIGINS_EXTRA", "").split(",") if o.strip()]
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "https://aitoolcraft.com",
        "https://www.aitoolcraft.com",
        *_extra,
    ]


settings = Settings()
