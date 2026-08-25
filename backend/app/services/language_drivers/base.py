from abc import ABC, abstractmethod

class BaseLanguageDriver(ABC):
    @abstractmethod
    def build_payload(
        self,
        problem_id: str,
        user_code: str,
        marker: str,
        tests: list[dict[str, str]],
    ) -> dict:
        """Build structured compilation/running payload for the sandbox."""
        pass
