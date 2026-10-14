from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    qdrant_url: str = "http://qdrant:6333"
    ollama_url: str = "http://ollama:11434"
    ollama_model: str = "llama3.2:3b"
    qdrant_collection: str = "labx_course_material"
    embedding_model: str = "all-MiniLM-L6-v2"
    internal_token: str = "change-me"
    retrieval_limit: int = 6
    retrieval_threshold: float = 0.35

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
