# AiValytics Practice Test Backend

Python + FastAPI backend for the React practice test portal.

## Stack

- Python
- FastAPI
- Pydantic
- Supabase Python client
- Uvicorn
- Docker

Create backend/.env with the Supabase credentials:
APP_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

Run Docker from the project root:
docker compose up --build

Open:
Frontend: http://localhost:5173
Backend:  http://localhost:8000
Docs:     http://localhost:8000/docs
Health check: http://localhost:8000/api/health

If Supabase credentials are not set, the backend uses in-memory/mock data so frontend work can continue.

## Main Endpoints

```text
GET    /api/health
GET    /api/practice-tests
GET    /api/practice-tests/selection-data
GET    /api/subjects
GET    /api/topics?subjectId=quant
GET    /api/subtopics?topicId=number-systems
POST   /api/test-attempts
GET    /api/test-attempts/:attemptId/questions
PATCH  /api/test-attempts/:attemptId/answers/:questionId
POST   /api/test-attempts/:attemptId/submit
GET    /api/test-attempts/:attemptId/result
GET    /api/users/:userId/recommendations
GET    /api/users/:userId/weak-areas
```

## Example Attempt Payload

```json
{
  "userId": "demo-user",
  "testId": "prime-factors",
  "subjectId": "quant",
  "topicId": "number-systems",
  "subtopicId": "prime-factors"
}
```
