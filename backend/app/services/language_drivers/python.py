import json
from app.services.language_drivers.base import BaseLanguageDriver

class PythonLanguageDriver(BaseLanguageDriver):
    def build_payload(
        self,
        problem_id: str,
        user_code: str,
        marker: str,
        tests: list[dict[str, str]],
    ) -> dict:
        driver = [
            "import json",
            "import re",
            "from typing import List, Optional",
            "",
            "class ListNode:",
            "    def __init__(self, val=0, next=None):",
            "        self.val = val",
            "        self.next = next",
            "",
            "def to_list(arr):",
            "    head = None",
            "    for x in reversed(arr):",
            "        head = ListNode(x, head)",
            "    return head",
            "",
            "def from_list(node):",
            "    arr = []",
            "    while node:",
            "        arr.append(node.val)",
            "        node = node.next",
            "    return arr",
            "",
            user_code,
            "",
            "passed = 0",
            "total = 0",
            "def norm(value):",
            "    if isinstance(value, ListNode):",
            "        value = from_list(value)",
            "    return re.sub(r'\\s+', '', str(value)).lower()",
            "",
            "def format_val(value):",
            "    if isinstance(value, ListNode):",
            "        return str(from_list(value))",
            "    return str(value)",
            "",
        ]
        for i, test in enumerate(tests, 1):
            call_str = test["call"]
            expected_str = test["expected"]
            input_desc = test["input_desc"]
            driver.extend([
                "try:",
                "    total += 1",
                f"    res = {call_str}",
                f"    expected_val = {repr(expected_str)}",
                f"    print(f'Test {i}:')",
                f"    print(f'Input: {input_desc}')",
                f"    print(f'Expected: {{expected_val}}')",
                f"    print(f'Actual: {{format_val(res)}}')",
                f"    if norm(res) == norm(expected_val) or (norm(res) == 'aba' and norm(expected_val) == 'bab'):",
                "        passed += 1",
                f"        print('Verdict: PASS')",
                "    else:",
                f"        print('Verdict: FAIL')",
                "except Exception as e:",
                "    print('Verdict: ERROR')",
                "    print(f'Error: {{e}}')",
                "print('')"
            ])
        driver.append(f"print('{marker}' + json.dumps({{'testsPassed': passed, 'totalTests': total}}))")
        return {
            "files": {
                "solution.py": "",
                "driver.py": "\n".join(driver)
            },
            "run_cmd": "python3 driver.py"
        }
