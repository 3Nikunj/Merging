from abc import ABC, abstractmethod
from typing import Any

class BaseAttemptRepository(ABC):
    @abstractmethod
    def get_client(self) -> Any:
        """Get the underlying database client wrapper."""
        pass

    @abstractmethod
    def get_test_by_id(self, test_id: str) -> dict | None:
        """Fetch test details by ID."""
        pass

    @abstractmethod
    def check_published_questions_exist(self, subject_id: str, topic_id: str) -> bool:
        """Check if any published questions exist for a subject and topic."""
        pass

    @abstractmethod
    def create_attempt(self, user_id: str, test_id: str) -> dict:
        """Create a new test attempt."""
        pass
