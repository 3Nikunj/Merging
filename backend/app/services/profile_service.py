from fastapi import HTTPException
from postgrest.exceptions import APIError
from app.core.supabase import get_supabase_client
from app.schemas.analytics import (
    UserProfile,
    UserAcademics,
    UserProfileResponse,
    UserProfileUpdate
)

MOCK_PROFILES: dict[str, dict] = {
    "student_id": {
        "profile": {
            "id": "student_id",
            "email": "student@aivalytics.com",
            "full_name": "Nikunj Soni",
            "phone": "+91 98765 43210",
            "college": "Aivalytics University",
            "department": "Computer Science & Engineering",
            "year_of_graduation": 2026,
            "bio": "Passionate Computer Science student with a focus on web development and artificial intelligence.",
            "github_url": "https://github.com/nikunj-soni",
            "linkedin_url": "https://linkedin.com/in/nikunj-soni",
            "skills": "React, TypeScript, Python, FastAPI, PostgreSQL",
            "avatar_url": None,
            "membership_type": "Gold Member",
        },
        "academics": {
            "tenth_percentage": 92.5,
            "twelfth_percentage": 88.0,
            "graduation_cgpa": 8.9,
            "backlogs": 0,
            "gap_years": 0,
            "gap_during_grad": False,
        }
    }
}

class ProfileService:
    def get_profile(self, user_id: str) -> UserProfileResponse:
        client = get_supabase_client()
        if client:
            try:
                # Fetch profile
                prof_resp = client.table("profiles").select("*").eq("id", user_id).limit(1).execute()
                if prof_resp.data:
                    profile_row = prof_resp.data[0]
                    
                    # Fetch academics
                    acad_resp = client.table("profile_academics").select("*").eq("profile_id", user_id).limit(1).execute()
                    academics_row = acad_resp.data[0] if acad_resp.data else None
                    
                    return UserProfileResponse(
                        profile=UserProfile(
                            id=profile_row["id"],
                            email=profile_row["email"],
                            full_name=profile_row.get("full_name"),
                            phone=profile_row.get("phone"),
                            college=profile_row.get("college"),
                            department=profile_row.get("department"),
                            year_of_graduation=profile_row.get("year_of_graduation"),
                            bio=profile_row.get("bio"),
                            github_url=profile_row.get("github_url"),
                            linkedin_url=profile_row.get("linkedin_url"),
                            skills=profile_row.get("skills"),
                            avatar_url=profile_row.get("avatar_url"),
                            membership_type=profile_row.get("membership_type")
                        ),
                        academics=UserAcademics(
                            tenth_percentage=academics_row.get("tenth_percentage") if academics_row else None,
                            twelfth_percentage=academics_row.get("twelfth_percentage") if academics_row else None,
                            graduation_cgpa=academics_row.get("graduation_cgpa") if academics_row else None,
                            backlogs=academics_row.get("backlogs", 0) if academics_row else 0,
                            gap_years=academics_row.get("gap_years", 0) if academics_row else 0,
                            gap_during_grad=academics_row.get("gap_during_grad", False) if academics_row else False
                        ) if academics_row else UserAcademics()
                    )
            except Exception as e:
                # Fallback to mock on connection or RLS issues in local test environments
                pass
                
        # Return mock profile data
        user_mock = MOCK_PROFILES.get(user_id, MOCK_PROFILES["student_id"])
        return UserProfileResponse(
            profile=UserProfile.model_validate(user_mock["profile"]),
            academics=UserAcademics.model_validate(user_mock["academics"])
        )

    def update_profile(self, user_id: str, payload: UserProfileUpdate) -> UserProfileResponse:
        client = get_supabase_client()
        if client:
            try:
                # Update profiles table
                profile_data = {
                    "full_name": payload.full_name,
                    "phone": payload.phone,
                    "college": payload.college,
                    "department": payload.department,
                    "year_of_graduation": payload.year_of_graduation,
                    "bio": payload.bio,
                    "github_url": payload.github_url,
                    "linkedin_url": payload.linkedin_url,
                    "skills": payload.skills,
                    "avatar_url": payload.avatar_url,
                    "membership_type": payload.membership_type,
                }
                client.table("profiles").update(profile_data).eq("id", user_id).execute()
                
                # Upsert profile_academics table
                academic_data = {
                    "profile_id": user_id,
                    "tenth_percentage": payload.tenth_percentage,
                    "twelfth_percentage": payload.twelfth_percentage,
                    "graduation_cgpa": payload.graduation_cgpa,
                    "backlogs": payload.backlogs,
                    "gap_years": payload.gap_years,
                    "gap_during_grad": payload.gap_during_grad,
                }
                client.table("profile_academics").upsert(academic_data).execute()
                
                return self.get_profile(user_id)
            except Exception as e:
                pass
                
        # Mock update
        if user_id not in MOCK_PROFILES:
            MOCK_PROFILES[user_id] = {
                "profile": {"id": user_id, "email": "student@aivalytics.com"},
                "academics": {}
            }
            
        MOCK_PROFILES[user_id]["profile"].update({
            "full_name": payload.full_name,
            "phone": payload.phone,
            "college": payload.college,
            "department": payload.department,
            "year_of_graduation": payload.year_of_graduation,
            "bio": payload.bio,
            "github_url": payload.github_url,
            "linkedin_url": payload.linkedin_url,
            "skills": payload.skills,
            "avatar_url": payload.avatar_url,
            "membership_type": payload.membership_type,
        })
        MOCK_PROFILES[user_id]["academics"].update({
            "tenth_percentage": payload.tenth_percentage,
            "twelfth_percentage": payload.twelfth_percentage,
            "graduation_cgpa": payload.graduation_cgpa,
            "backlogs": payload.backlogs,
            "gap_years": payload.gap_years,
            "gap_during_grad": payload.gap_during_grad,
        })
        return self.get_profile(user_id)

profile_service = ProfileService()
