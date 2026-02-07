"""
WebKurier Core API Server
Main FastAPI application entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
import logging

from engine.llm.api import router as llm_router
from engine.llm.router import llm_router as llm_instance

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
    logger.info("✅ Environment variables loaded")
except ImportError:
    logger.warning("dotenv not installed, skipping .env loading")

app = FastAPI(
    title="WebKurier Core API",
    description="Multi-agent AI system with secure LLM routing",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(llm_router)

@app.on_event("startup")
async def startup_event():
    """Initialize LLM router on startup"""
    logger.info("🚀 Starting WebKurier Core API...")
    
    try:
        success = await llm_instance.initialize()
        if success:
            logger.info("✅ LLM Router initialized successfully")
        else:
            logger.error("❌ Failed to initialize LLM Router")
    except Exception as e:
        logger.error(f"❌ Error initializing LLM Router: {e}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "WebKurier Core API",
        "version": "2.0.0",
        "endpoints": [
            "/llm/chat",
            "/llm/health", 
            "/llm/models",
            "/llm/providers"
        ]
    }

@app.get("/health")
async def health():
    """Overall health check"""
    return {
        "status": "healthy",
        "service": "webkurier-core",
        "version": "2.0.0",
        "timestamp": asyncio.get_event_loop().time()
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)