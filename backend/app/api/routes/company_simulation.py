from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.supabase import get_supabase_admin
from app.auth.dependency import get_current_user_id

router = APIRouter()

@router.get("/questions")
def get_company_simulation_questions(
    company_id: str,
    round_type: str,
    difficulty: str | None = None,
    current_user_id: str = Depends(get_current_user_id)
):
    client = get_supabase_admin()
    
    # Fetch questions that are published, MCQ, and mapped to the company
    # We use a join query: select questions and filter by question_companies' company_id
    query = (
        client.table("questions")
        .select("*, subjects(slug), topics(slug), question_options(*), question_companies!inner(company_id)")
        .eq("status", "published")
        .eq("question_type", "mcq")
        .eq("question_companies.company_id", company_id)
    )
    
    if difficulty:
        query = query.eq("difficulty", difficulty.lower())
        
    response = query.execute()
    all_questions = response.data or []
    
    # Filter questions by round_type based on taxonomy:
    filtered_questions = []
    for q in all_questions:
        subject_slug = q.get("subjects", {}).get("slug") if q.get("subjects") else ""
        topic_slug = q.get("topics", {}).get("slug") if q.get("topics") else ""
        
        # Normalize slugs
        subject_slug = (subject_slug or "").lower()
        topic_slug = (topic_slug or "").lower()
        
        if round_type == "pseudocode":
            # Match pseudocode topic or coding subject
            if "pseudocode" in topic_slug or "compiler" in topic_slug or "coding" in subject_slug:
                filtered_questions.append(q)
        elif round_type == "puzzle":
            # Match puzzle topic or logical subject
            if "puzzle" in topic_slug or "reasoning" in subject_slug:
                filtered_questions.append(q)
        elif round_type == "cognitive":
            # Match cognitive topic or reasoning/verbal subjects
            if "cognitive" in topic_slug or "reasoning" in subject_slug or "verbal" in subject_slug:
                filtered_questions.append(q)
        elif round_type == "aptitude":
            # Match general aptitude/quant/verbal/di
            if "quant" in subject_slug or "verbal" in subject_slug or "di" in subject_slug or "aptitude" in subject_slug or "reasoning" in subject_slug:
                filtered_questions.append(q)
        else:
            # Fallback: include all mapped questions if round_type is not recognized
            filtered_questions.append(q)
            
    return {"questions": filtered_questions}
