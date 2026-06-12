from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    database_url: str = "postgresql+psycopg://factory:factory@localhost:5432/factory_flow"
    cors_origins: str = "http://localhost:5173"


settings = Settings()
