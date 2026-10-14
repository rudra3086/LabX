from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    qdrant_url: str = "http://qdrant:6333"
    llm_api_url: str = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
    llm_api_key: str = ""
    llm_model: str = "gemini-2.0-flash"
    qdrant_collection: str = "labx_course_material"
    embedding_model: str = "all-MiniLM-L6-v2"
    internal_token: str = "change-me"
    retrieval_limit: int = 6
    retrieval_threshold: float = 0.35
    embedding_batch_size: int = 64
    num_threads: int = 4
    cache_ttl_seconds: int = 300
    viva_context_limit: int = 6

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

