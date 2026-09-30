from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.models.db_models import Field
from app.schemas.schemas import FieldCreate, FieldResponse

router = APIRouter()

@router.post("/", response_model=FieldResponse)
async def create_field(field: FieldCreate, db: AsyncSession = Depends(get_db)):
    # Assuming boundary is coming in as WKT string like 'POLYGON((...))'
    # In a real app, you might parse GeoJSON
    db_field = Field(
        name=field.name,
        crop_type=field.crop_type,
        area_hectares=field.area_hectares,
        boundary=field.boundary
    )
    db.add(db_field)
    await db.commit()
    await db.refresh(db_field)
    return db_field

@router.get("/", response_model=list[FieldResponse])
async def read_fields(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Field).offset(skip).limit(limit))
    fields = result.scalars().all()
    return fields
