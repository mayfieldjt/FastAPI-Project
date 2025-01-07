import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Union, Optional, Tuple
import psycopg2
from psycopg2.extras import RealDictCursor

allowed_origins = [
    "https://fast-api-project-44.vercel.app/",
    "http://localhost:3000",
]

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins, 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)
DB_CONFIG = {
    "host": os.getenv("DB_HOST"),          
    "database": os.getenv("DB_NAME"),     
    "user": os.getenv("DB_USER"),         
    "password": os.getenv("DB_PASSWORD"), 
    "port": os.getenv("DB_PORT", 5432)   
}


def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
        return conn
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {e}")


class Drug(BaseModel):
    id: Optional[int]
    drug_name: str
    drug_metadata: Optional[str] = None
    normal_level_mg: Optional[str] = None
    normal_level_ug: Optional[str] = None
    toxic_level_mg: Optional[str] = None
    toxic_level_ug: Optional[str] = None
    lethal_level_mg: Optional[str] = None
    lethal_level_ug: Optional[str] = None

class DrugUpdate(BaseModel):
    drug_name: Optional[str] = None
    drug_metadata: Optional[str] = None
    normal_level_mg: Optional[str] = None
    normal_level_ug: Optional[str] = None
    toxic_level_mg: Optional[str] = None
    toxic_level_ug: Optional[str] = None
    lethal_level_mg: Optional[str] = None
    lethal_level_ug: Optional[str] = None

class EvaluateRequest(BaseModel):
    drug: str
    observed_level: float

class EvaluateResponse(BaseModel):
    drug_name: Optional[str] = None
    normal_level_mg: Optional[str] = None
    toxic_level_mg: Optional[str] = None
    lethal_level_mg: Optional[str] = None
    observed_level: Optional[float] = None
    description: Optional[str] = None

#------------------------------------------------------------------------------
# search_drugs() searches the database by name. 
#------------------------------------------------------------------------------
def search_drugs(query: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    search_sql = """
        SELECT id, drug_name, drug_metadata, normal_level_mg, 
        normal_level_ug, toxic_level_mg, toxic_level_ug, lethal_level_mg, 
        lethal_level_ug FROM drugs WHERE LOWER(drug_name) LIKE ?
    """
    search_param = f"{query.lower()}%"
    results = cursor.execute(search_sql, (search_param,)).fetchall()

    if not results:
        conn.close()
        raise HTTPException(status_code=404, 
                            detail=f"No drugs found matching '{query}'.")
    drugs = [
        {
            "id": row["id"],
            "drug_name": row["drug_name"],
            "drug_metadata": row["drug_metadata"],
            "normal_level_mg": row["normal_level_mg"],
            "normal_level_ug": row["normal_level_ug"],
            "toxic_level_mg": row["toxic_level_mg"],
            "toxic_level_ug": row["toxic_level_ug"],
            "lethal_level_mg": row["lethal_level_mg"],
            "lethal_level_ug": row["lethal_level_ug"],
        }
        for row in results
    ]

    conn.close()
    return drugs

#------------------------------------------------------------------------------
# check_observed_level() evaluates the observed blood level
#------------------------------------------------------------------------------
def check_observed_level(
    drug_list: List[Dict[str, Union[str, None]]], observed_level: float) -> str:
    def parse_ranges(range_str: Optional[str]) -> Optional[Tuple[float, float]]:
       
        if not range_str:
            return None
        
        range_str = range_str.strip()
        try:
            if '-' in range_str:  
                start, end = map(float, range_str.split('-'))
                return start, end
            elif range_str.startswith('>'):  
                return float(range_str[1:].strip()), float('inf')
            elif range_str.startswith('>='):  
                return float(range_str[2:].strip()), float('inf')
            elif range_str.startswith('<='): 
                return float('-inf'), float(range_str[2:].strip())
            else:  
                value = float(range_str)
                return value, value
        except ValueError:
            raise ValueError(f"Invalid range format: {range_str}")

    def is_in_range(
            value: float, range_bounds: Optional[Tuple[float, float]]) -> bool:
     
        if not range_bounds:
            return False
        start, end = range_bounds
        return start <= value <= end

    ranges = {
        "normal": parse_ranges(drug_list[0].get("normal_level_mg")),
        "toxic": parse_ranges(drug_list[0].get("toxic_level_mg")),
        "lethal": parse_ranges(drug_list[0].get("lethal_level_mg")),
    }

    for level, range_bounds in ranges.items():
        if is_in_range(observed_level, range_bounds):
            return f"{level.capitalize()} Blood Level"

    if ranges["normal"] and observed_level < ranges["normal"][0]:
        return "Below Normal Blood Level"
    if (ranges["normal"] and ranges["toxic"] and 
        ranges["normal"][1] < observed_level < ranges["toxic"][0]):
        return "Above Normal Blood Level"
    if (ranges["toxic"] and ranges["lethal"] and 
        ranges["toxic"][1] < observed_level < ranges["lethal"][0]):
        return "Above Toxic Blood Level"
    if ranges["lethal"] and observed_level > ranges["lethal"][1]:
        return "Above Lethal Blood Level"

    return "Not in range"
#------------------------------------------------------------------------------
# Root request
#------------------------------------------------------------------------------
@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI app for the Working Attorney"}
#------------------------------------------------------------------------------
# Search
#------------------------------------------------------------------------------
@app.get("/Search/", response_model=List[dict])
def search(drug):
    """
    Search the database by name. Use % for wildcard. 
    """
    if not drug or not drug.strip():
        return []
    
    try:  
        return search_drugs(drug)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) 
    
#------------------------------------------------------------------------------
# Evaluate 
#------------------------------------------------------------------------------
@app.post("/Evaluate/", response_model=EvaluateResponse)
def evaluate_observed_level(request: EvaluateRequest):
    """
    Evaluates the observed blood level.
    """
    if not request.drug or not request.drug.strip():
        raise HTTPException(
            status_code=400,
            detail="Drug name is required for evaluation.",
        )

    drug = request.drug
    observed_level = request.observed_level
    
    drug_list = search_drugs(drug)

    if not drug_list:
        raise ValueError("Drug not found in the database.")

    drug_name = drug_list[0].get("drug_name")
    normal_level = drug_list[0].get("normal_level_mg")
    toxic_level = drug_list[0].get("toxic_level_mg")
    lethal_level = drug_list[0].get("lethal_level_mg")

    description = check_observed_level(drug_list, observed_level)
    
    return EvaluateResponse(drug_name=drug_name, 
                            normal_level_mg=normal_level, 
                            toxic_level_mg=toxic_level, 
                            lethal_level_mg=lethal_level, 
                            observed_level=observed_level, 
                            description=description)
    
    
#------------------------------------------------------------------------------
# Update 
#------------------------------------------------------------------------------
@app.put("/Update/", response_model=DrugUpdate)
def update_drug(drug_id: int, updated_drug: DrugUpdate):
    """
    Update a drug by ID. 
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    fetch_sql = "SELECT * FROM drugs WHERE id = ?"
    existing_drug = cursor.execute(fetch_sql, (drug_id,)).fetchone()

    if not existing_drug:
        conn.close()
        raise HTTPException(status_code=404, detail=f"No drug found with ID {drug_id}.")

    columns = [
        "drug_name", "drug_metadata", "normal_level_mg", "normal_level_ug",
        "toxic_level_mg", "toxic_level_ug", "lethal_level_mg", "lethal_level_ug"
    ]

    updated_values = {
        column: (
            existing_drug[column]
            if getattr(updated_drug, column) == "string"
            else getattr(updated_drug, column)
        )
        for column in columns
    }
    
    update_sql = """
        UPDATE drugs SET drug_name = ?, drug_metadata = ?, normal_level_mg = ?, 
        normal_level_ug = ?, toxic_level_mg = ?, toxic_level_ug = ?, 
        lethal_level_mg = ?, lethal_level_ug = ? WHERE id = ?
    """
    cursor.execute(update_sql, (
        updated_values["drug_name"], updated_values["drug_metadata"],
        updated_values["normal_level_mg"], updated_values["normal_level_ug"],
        updated_values["toxic_level_mg"], updated_values["toxic_level_ug"],
        updated_values["lethal_level_mg"], updated_values["lethal_level_ug"],
        drug_id
    ))

    conn.commit()

    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=500, detail="Failed to update the drug.")

    conn.close()
    return updated_values

#------------------------------------------------------------------------------
# Add
#------------------------------------------------------------------------------
@app.post("/Add/", response_model=Drug)
def add_drug(drug: Drug):
    """
    Add a new drug to the database.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO drugs (drug_name, drug_metadata, normal_level_mg, 
        normal_level_ug, toxic_level_mg, toxic_level_ug, lethal_level_mg, 
        lethal_level_ug) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (drug.drug_name, drug.drug_metadata, drug.normal_level_mg, 
          drug.normal_level_ug, drug.toxic_level_mg, drug.toxic_level_ug, 
          drug.lethal_level_mg, drug.lethal_level_ug))

    conn.commit()
    drug.id = cursor.lastrowid
    conn.close()
    return drug

#------------------------------------------------------------------------------
# Delete
#------------------------------------------------------------------------------
@app.delete("/Delete/")
def delete_drug(drug_id: int):
    """
    Delete a drug by ID.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM drugs WHERE id = ?", (drug_id,))
    conn.commit()
    conn.close()

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Drug not found")
    return {"detail": "Drug deleted successfully"}