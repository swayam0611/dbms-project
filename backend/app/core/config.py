import os

class Settings:
    PROJECT_NAME: str = "Hospital Management System API (DBMS 3NF Project)"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # MySQL Database Configuration
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "3306")
    DB_NAME: str = os.getenv("DB_NAME", "hospital_db")
    
    @property
    def DATABASE_URL(self) -> str:
        # PyMySQL Driver connection string
        if self.DB_PASSWORD:
            return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        return f"mysql+pymysql://{self.DB_USER}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"

settings = Settings()
