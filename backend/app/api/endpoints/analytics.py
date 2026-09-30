from fastapi import APIRouter

router = APIRouter()

@router.get("/{field_id}")
async def get_analytics(field_id: int):
    return {"message": f"Historical analytics for field {field_id}"}
