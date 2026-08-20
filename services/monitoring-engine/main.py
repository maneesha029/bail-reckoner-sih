from fastapi import FastAPI
from routes import router
from database import engine
from models import Base

app = FastAPI(title="Monitoring Engine")
Base.metadata.create_all(bind=engine)
app.include_router(router)