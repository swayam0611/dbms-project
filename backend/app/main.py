from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine
from app.routers import (
    hospitals, doctors, patients, appointments,
    admissions, clinical, pharmacy, billing, analytics
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
## Hospital Management System REST API
Developed for DBMS Course Project adhering strictly to **3NF Relational Normalization**, 
**ACID Concurrency Controls**, **Pessimistic Row-Level Locking**, and **Connection Pooling**.

### Core Architecture Features:
- **3NF Normalized**: Decomposed addresses via Pincode master, ICD-10 Disease Master, separate Pharmacy Inventory & Billing.
- **Concurrency Protection**: Double-booking prevention via composite unique constraints & `SELECT ... FOR UPDATE` row locks.
- **Transactional Atomicity**: Bed allocation, patient admission/discharge, consultation prescriptions, and payments execute as atomic units of work.
- **Interactive Documentation**: Test and inspect all schema models and live endpoints below.
    """,
    docs_url="/docs",
    redoc_url="/redoc"
)

# ------------------------------------------------------------------------------
# CORS Middleware: Allows seamless frontend integration
# ------------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------------------
# Include Routers
# ------------------------------------------------------------------------------
app.include_router(analytics.router, prefix=settings.API_PREFIX)
app.include_router(hospitals.router, prefix=settings.API_PREFIX)
app.include_router(doctors.router, prefix=settings.API_PREFIX)
app.include_router(patients.router, prefix=settings.API_PREFIX)
app.include_router(appointments.router, prefix=settings.API_PREFIX)
app.include_router(admissions.router, prefix=settings.API_PREFIX)
app.include_router(clinical.router, prefix=settings.API_PREFIX)
app.include_router(pharmacy.router, prefix=settings.API_PREFIX)
app.include_router(billing.router, prefix=settings.API_PREFIX)

@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")

@app.get("/health")
def health_check():
    """Verify live connectivity to MySQL."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1;"))
        return {"status": "healthy", "database": "connected (MySQL 8/9 InnoDB)"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
