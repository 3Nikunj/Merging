import unittest
from app.services.attempt_service import AttemptService

class TestAdaptiveTesting(unittest.TestCase):
    def setUp(self):
        self.service = AttemptService()

    def test_initial_difficulty(self):
        # Empty history starts at easy
        self.assertEqual(self.service._determine_target_difficulty([]), "easy")

    def test_promotion_rolling_window(self):
        # Easy -> Medium promotion: requires 4 out of last 5 correct
        # 4 consecutive correct answers at easy:
        history = [
            {"question_number": 1, "difficulty": "easy", "is_correct": True},
            {"question_number": 2, "difficulty": "easy", "is_correct": True},
            {"question_number": 3, "difficulty": "easy", "is_correct": True},
            {"question_number": 4, "difficulty": "easy", "is_correct": True},
        ]
        # Sum of correct in window of 4 is 4 (>=4), so promote to medium
        self.assertEqual(self.service._determine_target_difficulty(history), "medium")

        # 3 correct, 1 incorrect, 1 correct: window has 4 correct out of 5 -> promote
        history_mixed = [
            {"question_number": 1, "difficulty": "easy", "is_correct": True},
            {"question_number": 2, "difficulty": "easy", "is_correct": True},
            {"question_number": 3, "difficulty": "easy", "is_correct": True},
            {"question_number": 4, "difficulty": "easy", "is_correct": False},
            {"question_number": 5, "difficulty": "easy", "is_correct": True},
        ]
        self.assertEqual(self.service._determine_target_difficulty(history_mixed), "medium")

        # 3 correct out of 5 -> should stay easy
        history_no_promo = [
            {"question_number": 1, "difficulty": "easy", "is_correct": True},
            {"question_number": 2, "difficulty": "easy", "is_correct": True},
            {"question_number": 3, "difficulty": "easy", "is_correct": False},
            {"question_number": 4, "difficulty": "easy", "is_correct": False},
            {"question_number": 5, "difficulty": "easy", "is_correct": True},
        ]
        self.assertEqual(self.service._determine_target_difficulty(history_no_promo), "easy")

    def test_promotion_resets_window(self):
        # When promoted, the window resets.
        # 4 correct at easy -> promoted to medium.
        # First question at medium is incorrect.
        # We should still be at medium.
        history = [
            {"question_number": 1, "difficulty": "easy", "is_correct": True},
            {"question_number": 2, "difficulty": "easy", "is_correct": True},
            {"question_number": 3, "difficulty": "easy", "is_correct": True},
            {"question_number": 4, "difficulty": "easy", "is_correct": True},
            {"question_number": 5, "difficulty": "medium", "is_correct": False},
        ]
        self.assertEqual(self.service._determine_target_difficulty(history), "medium")

    def test_demotion_total_incorrect(self):
        # Demotion: 3 total incorrect answers at the current level demotes.
        # Promote to medium first, then get 3 incorrect at medium.
        history = [
            {"question_number": 1, "difficulty": "easy", "is_correct": True},
            {"question_number": 2, "difficulty": "easy", "is_correct": True},
            {"question_number": 3, "difficulty": "easy", "is_correct": True},
            {"question_number": 4, "difficulty": "easy", "is_correct": True},  # Promoted to Medium
            {"question_number": 5, "difficulty": "medium", "is_correct": False},
            {"question_number": 6, "difficulty": "medium", "is_correct": False},
            {"question_number": 7, "difficulty": "medium", "is_correct": True},
            {"question_number": 8, "difficulty": "medium", "is_correct": False},  # 3rd incorrect at medium -> demote to easy
        ]
        self.assertEqual(self.service._determine_target_difficulty(history), "easy")

    def test_fallback_difficulty(self):
        # Test that target difficulty adapts if difficulty changes in history
        history = [
            {"question_number": 1, "difficulty": "easy", "is_correct": True},
            {"question_number": 2, "difficulty": "easy", "is_correct": True},
            {"question_number": 3, "difficulty": "easy", "is_correct": True},
            {"question_number": 4, "difficulty": "easy", "is_correct": True},  # Target: medium
            {"question_number": 5, "difficulty": "easy", "is_correct": True},  # Fallback to easy occurred (e.g. no medium qs left)
        ]
        # Sum of correct in window of 5 has been reset, so they start count at easy again
        self.assertEqual(self.service._determine_target_difficulty(history), "easy")

if __name__ == '__main__':
    unittest.main()
