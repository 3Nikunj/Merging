"""Isolated execution client and coding-submission persistence."""

from __future__ import annotations

import json
import secrets
from typing import Literal, TypedDict

import httpx
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.core.config import get_settings
from app.core.supabase import get_supabase_client

PROBLEM_TESTS: dict[str, list[dict[str, str]]] = {
    "001": [
        {"call": "Solution().twoSum([2,7,11,15], 9)", "expected": "[0, 1]", "input_desc": "nums = [2,7,11,15], target = 9"},
        {"call": "Solution().twoSum([3,2,4], 6)", "expected": "[1, 2]", "input_desc": "nums = [3,2,4], target = 6"},
        {"call": "Solution().twoSum([3,3], 6)", "expected": "[0, 1]", "input_desc": "nums = [3,3], target = 6"},
    ],
    "002": [
        {"call": "Solution().addTwoNumbers(to_list([2,4,3]), to_list([5,6,4]))", "expected": "[7, 0, 8]", "input_desc": "l1 = [2,4,3], l2 = [5,6,4]"},
    ],
    "003": [
        {"call": "Solution().lengthOfLongestSubstring('abcabcbb')", "expected": "3", "input_desc": "s = 'abcabcbb'"},
    ],
    "004": [
        {"call": "Solution().findMedianSortedArrays([1,3], [2])", "expected": "2.0", "input_desc": "nums1 = [1,3], nums2 = [2]"},
    ],
    "005": [
        {"call": "Solution().longestPalindrome('babad')", "expected": "bab", "input_desc": "s = 'babad'"},
    ],
    "006": [
        {"call": "Solution().convert('PAYPALISHIRING', 3)", "expected": "PAHNAPLSIIGYIR", "input_desc": "s = 'PAYPALISHIRING', numRows = 3"},
    ],
    "007": [
        {"call": "Solution().reverse(123)", "expected": "321", "input_desc": "x = 123"},
    ],
    "008": [
        {"call": "Solution().myAtoi('42')", "expected": "42", "input_desc": "s = '42'"},
    ],
    "009": [
        {"call": "Solution().isPalindrome(121)", "expected": "True", "input_desc": "x = 121"},
    ],
}

ExecutionStatus = Literal[
    "ACCEPTED",
    "WRONG_ANSWER",
    "RUNTIME_ERROR",
    "COMPILE_ERROR",
    "TIMEOUT",
    "NO_TESTS",
]


class ExecutionResult(TypedDict):
    status: ExecutionStatus
    stdout: str
    stderr: str
    testsPassed: int
    totalTests: int


class SandboxResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    exit_code: int | None = Field(alias="exitCode")
    stdout: str
    stderr: str
    timed_out: bool = Field(alias="timedOut")


def _error_result(
    status: ExecutionStatus,
    message: str,
    total_tests: int,
) -> ExecutionResult:
    return {
        "status": status,
        "stdout": "",
        "stderr": message,
        "testsPassed": 0,
        "totalTests": total_tests,
    }


def _build_structured_payload(
    problem_id: str,
    user_code: str,
    language: str,
    marker: str,
) -> dict:
    tests = PROBLEM_TESTS.get(problem_id, [])

    if language == "python3" or language == "python":
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
                "solution.py": "",  # Python parses files, so keep it empty or write user_code to it
                "driver.py": "\n".join(driver)
            },
            "run_cmd": "python3 driver.py"
        }

    elif language == "javascript":
        driver = [
            "class ListNode {",
            "    constructor(val, next) {",
            "        this.val = (val===undefined ? 0 : val);",
            "        this.next = (next===undefined ? null : next);",
            "    }",
            "}",
            "function to_list(arr) {",
            "    let head = null;",
            "    for (let i = arr.length - 1; i >= 0; i--) {",
            "        head = new ListNode(arr[i], head);",
            "    }",
            "    return head;",
            "}",
            "function from_list(node) {",
            "    const arr = [];",
            "    while (node) {",
            "        arr.push(node.val);",
            "        node = node.next;",
            "    }",
            "    return arr;",
            "}",
            "",
            user_code,
            "",
            "let passed = 0;",
            "let total = 0;",
            "function norm(value) {",
            "    if (value instanceof ListNode) {",
            "        value = from_list(value);",
            "    }",
            "    return String(JSON.stringify(value)).replace(/\\s+/g, '').toLowerCase();",
            "}",
            "function format_val(value) {",
            "    if (value instanceof ListNode) {",
            "        return JSON.stringify(from_list(value));",
            "    }",
            "    return JSON.stringify(value);",
            "}",
            "",
        ]
        for i, test in enumerate(tests, 1):
            call_str = test["call"].replace("Solution()", "new Solution()")
            expected_str = test["expected"]
            input_desc = test["input_desc"]
            driver.extend([
                "try {",
                "    total++;",
                f"    console.log('Test {i}:');",
                f"    console.log('Input: {input_desc}');",
                f"    const expected_val = {json.dumps(expected_str)};",
                "    console.log('Expected: ' + expected_val);",
                f"    const res = {call_str};",
                "    console.log('Actual: ' + format_val(res));",
                "    if (norm(res) === norm(expected_val) || (norm(res) === '\"aba\"' && norm(expected_val) === '\"bab\"') || (norm(res) === 'aba' && norm(expected_val) === 'bab')) {",
                "        passed++;",
                "        console.log('Verdict: PASS');",
                "    } else {",
                "        console.log('Verdict: FAIL');",
                "    }",
                "} catch (e) {",
                "    console.log('Verdict: ERROR');",
                "    console.log('Error: ' + e.message);",
                "}",
                "console.log('');"
            ])
        driver.append(f"console.log('{marker}' + JSON.stringify({{testsPassed: passed, totalTests: total}}));")
        return {
            "files": {
                "solution.js": "\n".join(driver)
            },
            "run_cmd": "node solution.js"
        }

    elif language == "java":
        driver = [
            "import java.util.*;",
            "",
            "class ListNode {",
            "    int val;",
            "    ListNode next;",
            "    ListNode() {}",
            "    ListNode(int val) { this.val = val; }",
            "    ListNode(int val, ListNode next) { this.val = val; this.next = next; }",
            "}",
            "",
            user_code,
            "",
            "public class Driver {",
            "    public static ListNode toList(int[] arr) {",
            "        ListNode head = null;",
            "        for (int i = arr.length - 1; i >= 0; i--) {",
            "            head = new ListNode(arr[i], head);",
            "        }",
            "        return head;",
            "    }",
            "",
            "    public static String format(ListNode node) {",
            "        List<Integer> arr = new ArrayList<>();",
            "        while (node != null) {",
            "            arr.add(node.val);",
            "            node = node.next;",
            "        }",
            "        return arr.toString();",
            "    }",
            "",
            "    public static void main(String[] args) {",
            "        Solution solver = new Solution();",
            "        int passed = 0;",
            "        int total = 0;",
        ]

        if problem_id == "001":
            driver.extend([
                "        // Test 1",
                "        try {",
                "            total++;",
                "            System.out.println(\"Test 1:\");",
                "            System.out.println(\"Input: nums = [2,7,11,15], target = 9\");",
                "            System.out.println(\"Expected: [0, 1]\");",
                "            int[] res = solver.twoSum(new int[]{2,7,11,15}, 9);",
                "            System.out.println(\"Actual: \" + Arrays.toString(res));",
                "            if (res != null && res.length == 2 && ((res[0] == 0 && res[1] == 1) || (res[0] == 1 && res[1] == 0))) {",
                "                passed++;",
                "                System.out.println(\"Verdict: PASS\");",
                "            } else {",
                "                System.out.println(\"Verdict: FAIL\");",
                "            }",
                "        } catch (Exception e) {",
                "            System.out.println(\"Verdict: ERROR\");",
                "        }",
                "        System.out.println();",
                "        // Test 2",
                "        try {",
                "            total++;",
                "            System.out.println(\"Test 2:\");",
                "            System.out.println(\"Input: nums = [3,2,4], target = 6\");",
                "            System.out.println(\"Expected: [1, 2]\");",
                "            int[] res = solver.twoSum(new int[]{3,2,4}, 6);",
                "            System.out.println(\"Actual: \" + Arrays.toString(res));",
                "            if (res != null && res.length == 2 && ((res[0] == 1 && res[1] == 2) || (res[0] == 2 && res[1] == 1))) {",
                "                passed++;",
                "                System.out.println(\"Verdict: PASS\");",
                "            } else {",
                "                System.out.println(\"Verdict: FAIL\");",
                "            }",
                "        } catch (Exception e) {",
                "            System.out.println(\"Verdict: ERROR\");",
                "        }",
                "        System.out.println();",
                "        // Test 3",
                "        try {",
                "            total++;",
                "            System.out.println(\"Test 3:\");",
                "            System.out.println(\"Input: nums = [3,3], target = 6\");",
                "            System.out.println(\"Expected: [0, 1]\");",
                "            int[] res = solver.twoSum(new int[]{3,3}, 6);",
                "            System.out.println(\"Actual: \" + Arrays.toString(res));",
                "            if (res != null && res.length == 2 && ((res[0] == 0 && res[1] == 1) || (res[0] == 1 && res[1] == 0))) {",
                "                passed++;",
                "                System.out.println(\"Verdict: PASS\");",
                "            } else {",
                "                System.out.println(\"Verdict: FAIL\");",
                "            }",
                "        } catch (Exception e) {",
                "            System.out.println(\"Verdict: ERROR\");",
                "        }",
                "        System.out.println();",
            ])
        elif problem_id == "002":
            driver.extend([
                "        try {",
                "            total++;",
                "            System.out.println(\"Test 1:\");",
                "            System.out.println(\"Input: l1 = [2,4,3], l2 = [5,6,4]\");",
                "            System.out.println(\"Expected: [7, 0, 8]\");",
                "            ListNode res = solver.addTwoNumbers(toList(new int[]{2,4,3}), toList(new int[]{5,6,4}));",
                "            String actual = format(res);",
                "            System.out.println(\"Actual: \" + actual);",
                "            if (\"[7, 0, 8]\".replace(\" \", \"\").equals(actual.replace(\" \", \"\"))) {",
                "                passed++;",
                "                System.out.println(\"Verdict: PASS\");",
                "            } else {",
                "                System.out.println(\"Verdict: FAIL\");",
                "            }",
                "        } catch (Exception e) {",
                "            System.out.println(\"Verdict: ERROR\");",
                "        }",
            ])
        elif problem_id == "003":
            driver.extend([
                "        try {",
                "            total++;",
                "            System.out.println(\"Test 1:\");",
                "            System.out.println(\"Input: s = \\\"abcabcbb\\\"\");",
                "            System.out.println(\"Expected: 3\");",
                "            int res = solver.lengthOfLongestSubstring(\"abcabcbb\");",
                "            System.out.println(\"Actual: \" + res);",
                "            if (res == 3) {",
                "                passed++;",
                "                System.out.println(\"Verdict: PASS\");",
                "            } else {",
                "                System.out.println(\"Verdict: FAIL\");",
                "            }",
                "        } catch (Exception e) {",
                "            System.out.println(\"Verdict: ERROR\");",
                "        }",
            ])
        elif problem_id == "004":
            driver.extend([
                "        try {",
                "            total++;",
                "            System.out.println(\"Test 1:\");",
                "            System.out.println(\"Input: nums1 = [1,3], nums2 = [2]\");",
                "            System.out.println(\"Expected: 2.0\");",
                "            double res = solver.findMedianSortedArrays(new int[]{1,3}, new int[]{2});",
                "            System.out.println(\"Actual: \" + res);",
                "            if (Math.abs(res - 2.0) < 1e-6) {",
                "                passed++;",
                "                System.out.println(\"Verdict: PASS\");",
                "            } else {",
                "                System.out.println(\"Verdict: FAIL\");",
                "            }",
                "        } catch (Exception e) {",
                "            System.out.println(\"Verdict: ERROR\");",
                "        }",
            ])
        elif problem_id == "005":
            driver.extend([
                "        try {",
                "            total++;",
                "            System.out.println(\"Test 1:\");",
                "            System.out.println(\"Input: s = \\\"babad\\\"\");",
                "            System.out.println(\"Expected: bab\");",
                "            String res = solver.longestPalindrome(\"babad\");",
                "            System.out.println(\"Actual: \" + res);",
                "            if (\"bab\".equals(res) || \"aba\".equals(res)) {",
                "                passed++;",
                "                System.out.println(\"Verdict: PASS\");",
                "            } else {",
                "                System.out.println(\"Verdict: FAIL\");",
                "            }",
                "        } catch (Exception e) {",
                "            System.out.println(\"Verdict: ERROR\");",
                "        }",
            ])
        elif problem_id == "006":
            driver.extend([
                "        try {",
                "            total++;",
                "            System.out.println(\"Test 1:\");",
                "            System.out.println(\"Input: s = \\\"PAYPALISHIRING\\\", numRows = 3\");",
                "            System.out.println(\"Expected: PAHNAPLSIIGYIR\");",
                "            String res = solver.convert(\"PAYPALISHIRING\", 3);",
                "            System.out.println(\"Actual: \" + res);",
                "            if (\"PAHNAPLSIIGYIR\".equals(res)) {",
                "                passed++;",
                "                System.out.println(\"Verdict: PASS\");",
                "            } else {",
                "                System.out.println(\"Verdict: FAIL\");",
                "            }",
                "        } catch (Exception e) {",
                "            System.out.println(\"Verdict: ERROR\");",
                "        }",
            ])
        elif problem_id == "007":
            driver.extend([
                "        try {",
                "            total++;",
                "            System.out.println(\"Test 1:\");",
                "            System.out.println(\"Input: x = 123\");",
                "            System.out.println(\"Expected: 321\");",
                "            int res = solver.reverse(123);",
                "            System.out.println(\"Actual: \" + res);",
                "            if (res == 321) {",
                "                passed++;",
                "                System.out.println(\"Verdict: PASS\");",
                "            } else {",
                "                System.out.println(\"Verdict: FAIL\");",
                "            }",
                "        } catch (Exception e) {",
                "            System.out.println(\"Verdict: ERROR\");",
                "        }",
            ])
        elif problem_id == "008":
            driver.extend([
                "        try {",
                "            total++;",
                "            System.out.println(\"Test 1:\");",
                "            System.out.println(\"Input: s = \\\"42\\\"\");",
                "            System.out.println(\"Expected: 42\");",
                "            int res = solver.myAtoi(\"42\");",
                "            System.out.println(\"Actual: \" + res);",
                "            if (res == 42) {",
                "                passed++;",
                "                System.out.println(\"Verdict: PASS\");",
                "            } else {",
                "                System.out.println(\"Verdict: FAIL\");",
                "            }",
                "        } catch (Exception e) {",
                "            System.out.println(\"Verdict: ERROR\");",
                "        }",
            ])
        elif problem_id == "009":
            driver.extend([
                "        try {",
                "            total++;",
                "            System.out.println(\"Test 1:\");",
                "            System.out.println(\"Input: x = 121\");",
                "            System.out.println(\"Expected: true\");",
                "            boolean res = solver.isPalindrome(121);",
                "            System.out.println(\"Actual: \" + res);",
                "            if (res) {",
                "                passed++;",
                "                System.out.println(\"Verdict: PASS\");",
                "            } else {",
                "                System.out.println(\"Verdict: FAIL\");",
                "            }",
                "        } catch (Exception e) {",
                "            System.out.println(\"Verdict: ERROR\");",
                "        }",
            ])
        driver.extend([
            f"        System.out.println(\"{marker}\" + \"{{\\\"testsPassed\\\":\" + passed + \",\\\"totalTests\\\":\" + total + \"}}\");",
            "    }",
            "}"
        ])
        return {
            "files": {
                "Driver.java": "\n".join(driver)
            },
            "compile_cmd": "javac Driver.java",
            "run_cmd": "java Driver"
        }

    elif language == "cpp":
        driver = [
            "#include <iostream>",
            "#include <vector>",
            "#include <string>",
            "#include <algorithm>",
            "#include <cmath>",
            "",
            "struct ListNode {",
            "    int val;",
            "    ListNode *next;",
            "    ListNode() : val(0), next(nullptr) {}",
            "    ListNode(int x) : val(x), next(nullptr) {}",
            "    ListNode(int x, ListNode *next) : val(x), next(next) {}",
            "};",
            "",
            "ListNode* toList(const std::vector<int>& arr) {",
            "    ListNode* head = nullptr;",
            "    for (int i = (int)arr.size() - 1; i >= 0; i--) {",
            "        head = new ListNode(arr[i], head);",
            "    }",
            "    return head;",
            "}",
            "",
            "std::string format(ListNode* node) {",
            "    std::string res = \"[\";",
            "    while (node != nullptr) {",
            "        res += std::to_string(node->val);",
            "        if (node->next != nullptr) res += \", \";",
            "        node = node->next;",
            "    }",
            "    res += \"]\";",
            "    return res;",
            "}",
            "",
            user_code,
            "",
            "int main() {",
            "    Solution solver;",
            "    int passed = 0;",
            "    int total = 0;",
        ]
        
        if problem_id == "001":
            driver.extend([
                "    // Test 1",
                "    try {",
                "        total++;",
                "        std::cout << \"Test 1:\\n\";",
                "        std::cout << \"Input: nums = [2,7,11,15], target = 9\\n\";",
                "        std::cout << \"Expected: [0, 1]\\n\";",
                "        std::vector<int> nums = {2,7,11,15};",
                "        std::vector<int> res = solver.twoSum(nums, 9);",
                "        std::cout << \"Actual: [\";",
                "        for (size_t i = 0; i < res.size(); i++) {",
                "            std::cout << res[i] << (i + 1 < res.size() ? \", \" : \"\");",
                "        }",
                "        std::cout << \"]\\n\";",
                "        if (res.size() == 2 && ((res[0] == 0 && res[1] == 1) || (res[0] == 1 && res[1] == 0))) {",
                "            passed++;",
                "            std::cout << \"Verdict: PASS\\n\";",
                "        } else {",
                "            std::cout << \"Verdict: FAIL\\n\";",
                "        }",
                "    } catch (...) {",
                "        std::cout << \"Verdict: ERROR\\n\";",
                "    }",
                "    std::cout << \"\\n\";",
                "    // Test 2",
                "    try {",
                "        total++;",
                "        std::cout << \"Test 2:\\n\";",
                "        std::cout << \"Input: nums = [3,2,4], target = 6\\n\";",
                "        std::cout << \"Expected: [1, 2]\\n\";",
                "        std::vector<int> nums = {3,2,4};",
                "        std::vector<int> res = solver.twoSum(nums, 6);",
                "        std::cout << \"Actual: [\";",
                "        for (size_t i = 0; i < res.size(); i++) {",
                "            std::cout << res[i] << (i + 1 < res.size() ? \", \" : \"\");",
                "        }",
                "        std::cout << \"]\\n\";",
                "        if (res.size() == 2 && ((res[0] == 1 && res[1] == 2) || (res[0] == 2 && res[1] == 1))) {",
                "            passed++;",
                "            std::cout << \"Verdict: PASS\\n\";",
                "        } else {",
                "            std::cout << \"Verdict: FAIL\\n\";",
                "        }",
                "    } catch (...) {",
                "        std::cout << \"Verdict: ERROR\\n\";",
                "    }",
                "    std::cout << \"\\n\";",
                "    // Test 3",
                "    try {",
                "        total++;",
                "        std::cout << \"Test 3:\\n\";",
                "        std::cout << \"Input: nums = [3,3], target = 6\\n\";",
                "        std::cout << \"Expected: [0, 1]\\n\";",
                "        std::vector<int> nums = {3,3};",
                "        std::vector<int> res = solver.twoSum(nums, 6);",
                "        std::cout << \"Actual: [\";",
                "        for (size_t i = 0; i < res.size(); i++) {",
                "            std::cout << res[i] << (i + 1 < res.size() ? \", \" : \"\");",
                "        }",
                "        std::cout << \"]\\n\";",
                "        if (res.size() == 2 && ((res[0] == 0 && res[1] == 1) || (res[0] == 1 && res[1] == 0))) {",
                "            passed++;",
                "            std::cout << \"Verdict: PASS\\n\";",
                "        } else {",
                "            std::cout << \"Verdict: FAIL\\n\";",
                "        }",
                "    } catch (...) {",
                "        std::cout << \"Verdict: ERROR\\n\";",
                "    }",
                "    std::cout << \"\\n\";",
            ])
        elif problem_id == "002":
            driver.extend([
                "    try {",
                "        total++;",
                "        std::cout << \"Test 1:\\n\";",
                "        std::cout << \"Input: l1 = [2,4,3], l2 = [5,6,4]\\n\";",
                "        std::cout << \"Expected: [7, 0, 8]\\n\";",
                "        ListNode* res = solver.addTwoNumbers(toList({2,4,3}), toList({5,6,4}));",
                "        std::string actual = format(res);",
                "        std::cout << \"Actual: \" << actual << \"\\n\";",
                "        if (actual == \"[7, 0, 8]\") {",
                "            passed++;",
                "            std::cout << \"Verdict: PASS\\n\";",
                "        } else {",
                "            std::cout << \"Verdict: FAIL\\n\";",
                "        }",
                "    } catch (...) {",
                "        std::cout << \"Verdict: ERROR\\n\";",
                "    }",
            ])
        elif problem_id == "003":
            driver.extend([
                "    try {",
                "        total++;",
                "        std::cout << \"Test 1:\\n\";",
                "        std::cout << \"Input: s = \\\"abcabcbb\\\"\\n\";",
                "        std::cout << \"Expected: 3\\n\";",
                "        int res = solver.lengthOfLongestSubstring(\"abcabcbb\");",
                "        std::cout << \"Actual: \" << res << \"\\n\";",
                "        if (res == 3) {",
                "            passed++;",
                "            std::cout << \"Verdict: PASS\\n\";",
                "        } else {",
                "            std::cout << \"Verdict: FAIL\\n\";",
                "        }",
                "    } catch (...) {",
                "        std::cout << \"Verdict: ERROR\\n\";",
                "    }",
            ])
        elif problem_id == "004":
            driver.extend([
                "    try {",
                "        total++;",
                "        std::cout << \"Test 1:\\n\";",
                "        std::cout << \"Input: nums1 = [1,3], nums2 = [2]\\n\";",
                "        std::cout << \"Expected: 2.0\\n\";",
                "        std::vector<int> n1 = {1,3};",
                "        std::vector<int> n2 = {2};",
                "        double res = solver.findMedianSortedArrays(n1, n2);",
                "        std::cout << \"Actual: \" << res << \"\\n\";",
                "        if (std::abs(res - 2.0) < 1e-6) {",
                "            passed++;",
                "            std::cout << \"Verdict: PASS\\n\";",
                "        } else {",
                "            std::cout << \"Verdict: FAIL\\n\";",
                "        }",
                "    } catch (...) {",
                "        std::cout << \"Verdict: ERROR\\n\";",
                "    }",
            ])
        elif problem_id == "005":
            driver.extend([
                "    try {",
                "        total++;",
                "        std::cout << \"Test 1:\\n\";",
                "        std::cout << \"Input: s = \\\"babad\\\"\\n\";",
                "        std::cout << \"Expected: bab\\n\";",
                "        std::string res = solver.longestPalindrome(\"babad\");",
                "        std::cout << \"Actual: \" << res << \"\\n\";",
                "        if (res == \"bab\" || res == \"aba\") {",
                "            passed++;",
                "            std::cout << \"Verdict: PASS\\n\";",
                "        } else {",
                "            std::cout << \"Verdict: FAIL\\n\";",
                "        }",
                "    } catch (...) {",
                "        std::cout << \"Verdict: ERROR\\n\";",
                "    }",
            ])
        elif problem_id == "006":
            driver.extend([
                "    try {",
                "        total++;",
                "        std::cout << \"Test 1:\\n\";",
                "        std::cout << \"Input: s = \\\"PAYPALISHIRING\\\", numRows = 3\\n\";",
                "        std::cout << \"Expected: PAHNAPLSIIGYIR\\n\";",
                "        std::string res = solver.convert(\"PAYPALISHIRING\", 3);",
                "        std::cout << \"Actual: \" << res << \"\\n\";",
                "        if (res == \"PAHNAPLSIIGYIR\") {",
                "            passed++;",
                "            std::cout << \"Verdict: PASS\\n\";",
                "        } else {",
                "            std::cout << \"Verdict: FAIL\\n\";",
                "        }",
                "    } catch (...) {",
                "        std::cout << \"Verdict: ERROR\\n\";",
                "    }",
            ])
        elif problem_id == "007":
            driver.extend([
                "    try {",
                "        total++;",
                "        std::cout << \"Test 1:\\n\";",
                "        std::cout << \"Input: x = 123\\n\";",
                "        std::cout << \"Expected: 321\\n\";",
                "        int res = solver.reverse(123);",
                "        std::cout << \"Actual: \" << res << \"\\n\";",
                "        if (res == 321) {",
                "            passed++;",
                "            std::cout << \"Verdict: PASS\\n\";",
                "        } else {",
                "            std::cout << \"Verdict: FAIL\\n\";",
                "        }",
                "    } catch (...) {",
                "        std::cout << \"Verdict: ERROR\\n\";",
                "    }",
            ])
        elif problem_id == "008":
            driver.extend([
                "    try {",
                "        total++;",
                "        std::cout << \"Test 1:\\n\";",
                "        std::cout << \"Input: s = \\\"42\\\"\\n\";",
                "        std::cout << \"Expected: 42\\n\";",
                "        int res = solver.myAtoi(\"42\");",
                "        std::cout << \"Actual: \" << res << \"\\n\";",
                "        if (res == 42) {",
                "            passed++;",
                "            std::cout << \"Verdict: PASS\\n\";",
                "        } else {",
                "            std::cout << \"Verdict: FAIL\\n\";",
                "        }",
                "    } catch (...) {",
                "        std::cout << \"Verdict: ERROR\\n\";",
                "    }",
            ])
        elif problem_id == "009":
            driver.extend([
                "    try {",
                "        total++;",
                "        std::cout << \"Test 1:\\n\";",
                "        std::cout << \"Input: x = 121\\n\";",
                "        std::cout << \"Expected: true\\n\";",
                "        bool res = solver.isPalindrome(121);",
                "        std::cout << \"Actual: \" << (res ? \"true\" : \"false\") << \"\\n\";",
                "        if (res) {",
                "            passed++;",
                "            std::cout << \"Verdict: PASS\\n\";",
                "        } else {",
                "            std::cout << \"Verdict: FAIL\\n\";",
                "        }",
                "    } catch (...) {",
                "        std::cout << \"Verdict: ERROR\\n\";",
                "    }",
            ])
        driver.extend([
            f"    std::cout << \"{marker}\" << \"{{\\\"testsPassed\\\":\" << passed << \",\\\"totalTests\\\":\" << total << \"}}\\n\";",
            "    return 0;",
            "}"
        ])
        return {
            "files": {
                "solution.cpp": "\n".join(driver)
            },
            "compile_cmd": "g++ -O3 solution.cpp -o solution",
            "run_cmd": "./solution"
        }

    elif language == "c":
        driver = [
            "#include <stdio.h>",
            "#include <stdlib.h>",
            "#include <string.h>",
            "#include <stdbool.h>",
            "#include <math.h>",
            "",
            "struct ListNode {",
            "    int val;",
            "    struct ListNode *next;",
            "};",
            "",
            "struct ListNode* toList(int* arr, int size) {",
            "    struct ListNode* head = NULL;",
            "    for (int i = size - 1; i >= 0; i--) {",
            "        struct ListNode* node = (struct ListNode*)malloc(sizeof(struct ListNode));",
            "        node->val = arr[i];",
            "        node->next = head;",
            "        head = node;",
            "    }",
            "    return head;",
            "}",
            "",
            "void printList(struct ListNode* node) {",
            "    printf(\"[\");",
            "    while (node != NULL) {",
            "        printf(\"%d\", node->val);",
            "        if (node->next != NULL) printf(\", \");",
            "        node = node->next;",
            "    }",
            "    printf(\"]\");",
            "}",
            "",
            "int formatList(struct ListNode* node, char* buf) {",
            "    int offset = sprintf(buf, \"[\");",
            "    while (node != NULL) {",
            "        offset += sprintf(buf + offset, \"%d\", node->val);",
            "        if (node->next != NULL) offset += sprintf(buf + offset, \", \");",
            "        node = node->next;",
            "    }",
            "    offset += sprintf(buf + offset, \"]\");",
            "    return offset;",
            "}",
            "",
            user_code,
            "",
            "int main() {",
            "    int passed = 0;",
            "    int total = 0;",
        ]

        if problem_id == "001":
            driver.extend([
                "    // Test 1",
                "    {",
                "        total++;",
                "        printf(\"Test 1:\\n\");",
                "        printf(\"Input: nums = [2,7,11,15], target = 9\\n\");",
                "        printf(\"Expected: [0, 1]\\n\");",
                "        int returnSize = 0;",
                "        int nums[] = {2, 7, 11, 15};",
                "        int* res = twoSum(nums, 4, 9, &returnSize);",
                "        printf(\"Actual: [\");",
                "        for (int i = 0; i < returnSize; i++) {",
                "            printf(\"%d\", res[i]);",
                "            if (i + 1 < returnSize) printf(\", \");",
                "        }",
                "        printf(\"]\\n\");",
                "        if (res != NULL && returnSize == 2 && ((res[0] == 0 && res[1] == 1) || (res[0] == 1 && res[1] == 0))) {",
                "            passed++;",
                "            printf(\"Verdict: PASS\\n\");",
                "        } else {",
                "            printf(\"Verdict: FAIL\\n\");",
                "        }",
                "        if (res != NULL) free(res);",
                "    }",
                "    printf(\"\\n\");",
                "    // Test 2",
                "    {",
                "        total++;",
                "        printf(\"Test 2:\\n\");",
                "        printf(\"Input: nums = [3,2,4], target = 6\\n\");",
                "        printf(\"Expected: [1, 2]\\n\");",
                "        int returnSize = 0;",
                "        int nums[] = {3, 2, 4};",
                "        int* res = twoSum(nums, 3, 6, &returnSize);",
                "        printf(\"Actual: [\");",
                "        for (int i = 0; i < returnSize; i++) {",
                "            printf(\"%d\", res[i]);",
                "            if (i + 1 < returnSize) printf(\", \");",
                "        }",
                "        printf(\"]\\n\");",
                "        if (res != NULL && returnSize == 2 && ((res[0] == 1 && res[1] == 2) || (res[0] == 2 && res[1] == 1))) {",
                "            passed++;",
                "            printf(\"Verdict: PASS\\n\");",
                "        } else {",
                "            printf(\"Verdict: FAIL\\n\");",
                "        }",
                "        if (res != NULL) free(res);",
                "    }",
                "    printf(\"\\n\");",
                "    // Test 3",
                "    {",
                "        total++;",
                "        printf(\"Test 3:\\n\");",
                "        printf(\"Input: nums = [3,3], target = 6\\n\");",
                "        printf(\"Expected: [0, 1]\\n\");",
                "        int returnSize = 0;",
                "        int nums[] = {3, 3};",
                "        int* res = twoSum(nums, 2, 6, &returnSize);",
                "        printf(\"Actual: [\");",
                "        for (int i = 0; i < returnSize; i++) {",
                "            printf(\"%d\", res[i]);",
                "            if (i + 1 < returnSize) printf(\", \");",
                "        }",
                "        printf(\"]\\n\");",
                "        if (res != NULL && returnSize == 2 && ((res[0] == 0 && res[1] == 1) || (res[0] == 1 && res[1] == 0))) {",
                "            passed++;",
                "            printf(\"Verdict: PASS\\n\");",
                "        } else {",
                "            printf(\"Verdict: FAIL\\n\");",
                "        }",
                "        if (res != NULL) free(res);",
                "    }",
                "    printf(\"\\n\");",
            ])
        elif problem_id == "002":
            driver.extend([
                "    {",
                "        total++;",
                "        printf(\"Test 1:\\n\");",
                "        printf(\"Input: l1 = [2,4,3], l2 = [5,6,4]\\n\");",
                "        printf(\"Expected: [7, 0, 8]\\n\");",
                "        struct ListNode* l1 = toList((int[]){2,4,3}, 3);",
                "        struct ListNode* l2 = toList((int[]){5,6,4}, 3);",
                "        struct ListNode* res = addTwoNumbers(l1, l2);",
                "        char actual[128];",
                "        formatList(res, actual);",
                "        printf(\"Actual: %s\\n\", actual);",
                "        if (res && res->val == 7 && res->next && res->next->val == 0 && res->next->next && res->next->next->val == 8 && !res->next->next->next) {",
                "            passed++;",
                "            printf(\"Verdict: PASS\\n\");",
                "        } else {",
                "            printf(\"Verdict: FAIL\\n\");",
                "        }",
                "    }",
            ])
        elif problem_id == "003":
            driver.extend([
                "    {",
                "        total++;",
                "        printf(\"Test 1:\\n\");",
                "        printf(\"Input: s = \\\"abcabcbb\\\"\\n\");",
                "        printf(\"Expected: 3\\n\");",
                "        int res = lengthOfLongestSubstring(\"abcabcbb\");",
                "        printf(\"Actual: %d\\n\", res);",
                "        if (res == 3) {",
                "            passed++;",
                "            printf(\"Verdict: PASS\\n\");",
                "        } else {",
                "            printf(\"Verdict: FAIL\\n\");",
                "        }",
                "    }",
            ])
        elif problem_id == "004":
            driver.extend([
                "    {",
                "        total++;",
                "        printf(\"Test 1:\\n\");",
                "        printf(\"Input: nums1 = [1,3], nums2 = [2]\\n\");",
                "        printf(\"Expected: 2.0\\n\");",
                "        double res = findMedianSortedArrays((int[]){1,3}, 2, (int[]){2}, 1);",
                "        printf(\"Actual: %.1f\\n\", res);",
                "        if (fabs(res - 2.0) < 1e-6) {",
                "            passed++;",
                "            printf(\"Verdict: PASS\\n\");",
                "        } else {",
                "            printf(\"Verdict: FAIL\\n\");",
                "        }",
                "    }",
            ])
        elif problem_id == "005":
            driver.extend([
                "    {",
                "        total++;",
                "        printf(\"Test 1:\\n\");",
                "        printf(\"Input: s = \\\"babad\\\"\\n\");",
                "        printf(\"Expected: bab\\n\");",
                "        char* res = longestPalindrome(\"babad\");",
                "        printf(\"Actual: %s\\n\", res ? res : \"(null)\");",
                "        if (res && (strcmp(res, \"bab\") == 0 || strcmp(res, \"aba\") == 0)) {",
                "            passed++;",
                "            printf(\"Verdict: PASS\\n\");",
                "        } else {",
                "            printf(\"Verdict: FAIL\\n\");",
                "        }",
                "    }",
            ])
        elif problem_id == "006":
            driver.extend([
                "    {",
                "        total++;",
                "        printf(\"Test 1:\\n\");",
                "        printf(\"Input: s = \\\"PAYPALISHIRING\\\", numRows = 3\\n\");",
                "        printf(\"Expected: PAHNAPLSIIGYIR\\n\");",
                "        char* res = convert(\"PAYPALISHIRING\", 3);",
                "        printf(\"Actual: %s\\n\", res ? res : \"(null)\");",
                "        if (res && strcmp(res, \"PAHNAPLSIIGYIR\") == 0) {",
                "            passed++;",
                "            printf(\"Verdict: PASS\\n\");",
                "        } else {",
                "            printf(\"Verdict: FAIL\\n\");",
                "        }",
                "    }",
            ])
        elif problem_id == "007":
            driver.extend([
                "    {",
                "        total++;",
                "        printf(\"Test 1:\\n\");",
                "        printf(\"Input: x = 123\\n\");",
                "        printf(\"Expected: 321\\n\");",
                "        int res = reverse(123);",
                "        printf(\"Actual: %d\\n\", res);",
                "        if (res == 321) {",
                "            passed++;",
                "            printf(\"Verdict: PASS\\n\");",
                "        } else {",
                "            printf(\"Verdict: FAIL\\n\");",
                "        }",
                "    }",
            ])
        elif problem_id == "008":
            driver.extend([
                "    {",
                "        total++;",
                "        printf(\"Test 1:\\n\");",
                "        printf(\"Input: s = \\\"42\\\"\\n\");",
                "        printf(\"Expected: 42\\n\");",
                "        int res = myAtoi(\"42\");",
                "        printf(\"Actual: %d\\n\", res);",
                "        if (res == 42) {",
                "            passed++;",
                "            printf(\"Verdict: PASS\\n\");",
                "        } else {",
                "            printf(\"Verdict: FAIL\\n\");",
                "        }",
                "    }",
            ])
        elif problem_id == "009":
            driver.extend([
                "    {",
                "        total++;",
                "        printf(\"Test 1:\\n\");",
                "        printf(\"Input: x = 121\\n\");",
                "        printf(\"Expected: true\\n\");",
                "        bool res = isPalindrome(121);",
                "        printf(\"Actual: %s\\n\", res ? \"true\" : \"false\");",
                "        if (res) {",
                "            passed++;",
                "            printf(\"Verdict: PASS\\n\");",
                "        } else {",
                "            printf(\"Verdict: FAIL\\n\");",
                "        }",
                "    }",
            ])
        driver.extend([
            f"    printf(\"{marker}{{\\\"testsPassed\\\":%d,\\\"totalTests\\\":%d}}\\n\", passed, total);",
            "    return 0;",
            "}"
        ])
        return {
            "files": {
                "solution.c": "\n".join(driver)
            },
            "compile_cmd": "gcc -O3 solution.c -o solution",
            "run_cmd": "./solution"
        }

    else:
        raise ValueError(f"Unsupported language: {language}")


def _execute_in_sandbox(script: str) -> SandboxResponse:
    settings = get_settings()
    token = settings.sandbox_executor_token
    if not settings.sandbox_executor_url or not token:
        raise RuntimeError("Sandbox executor is not configured")

    timeout = settings.sandbox_timeout_seconds
    with httpx.Client(timeout=timeout + 5.0) as client:
        response = client.post(
            f"{settings.sandbox_executor_url.rstrip('/')}/execute",
            headers={"X-Sandbox-Token": token.get_secret_value()},
            json={"script": script, "timeoutSeconds": timeout},
        )
        response.raise_for_status()
        return SandboxResponse.model_validate(response.json())


def run_code(problem_id: str, user_code: str, language: str = "python3") -> ExecutionResult:
    """Execute code only through the isolated sandbox service."""
    tests = PROBLEM_TESTS.get(problem_id, [])
    total_tests = len(tests)

    marker = f"__AIVALYTICS_RESULT_{secrets.token_hex(16)}__"
    payload = _build_structured_payload(problem_id, user_code, language, marker)
    script = json.dumps(payload)

    try:
        sandbox = _execute_in_sandbox(script)
    except (httpx.HTTPError, RuntimeError, ValidationError):
        return _error_result(
            "RUNTIME_ERROR",
            "Secure execution service is unavailable.",
            total_tests,
        )

    if sandbox.timed_out:
        return _error_result(
            "TIMEOUT",
            "Execution timed out.",
            total_tests,
        )

    if sandbox.exit_code == 125:
        return _error_result(
            "RUNTIME_ERROR",
            "Secure execution service is unavailable.",
            total_tests,
        )

    stdout_lines = sandbox.stdout.splitlines()
    visible_stdout = "\n".join(
        line for line in stdout_lines if not line.startswith(marker)
    ).strip()

    if not tests:
        # If there are no test cases, we verify compilation and syntax
        if sandbox.exit_code != 0:
            status: ExecutionStatus = "RUNTIME_ERROR"
            if (
                "SyntaxError" in sandbox.stderr
                or "Compilation Error" in sandbox.stderr
                or "error:" in sandbox.stderr.lower()
                or "java:" in sandbox.stderr.lower()
            ):
                status = "COMPILE_ERROR"
            return {
                "status": status,
                "stdout": visible_stdout,
                "stderr": sandbox.stderr,
                "testsPassed": 0,
                "totalTests": 0,
            }
        else:
            return {
                "status": "ACCEPTED",
                "stdout": visible_stdout or "Compilation and syntax verification succeeded.",
                "stderr": sandbox.stderr,
                "testsPassed": 0,
                "totalTests": 0,
            }

    result_line = next(
        (line for line in reversed(stdout_lines) if line.startswith(marker)),
        None,
    )

    if sandbox.exit_code != 0 or not result_line:
        status: ExecutionStatus = "RUNTIME_ERROR"
        if (
            "SyntaxError" in sandbox.stderr
            or "Compilation Error" in sandbox.stderr
            or "error:" in sandbox.stderr.lower()
            or "java:" in sandbox.stderr.lower()
        ):
            status = "COMPILE_ERROR"
        return {
            "status": status,
            "stdout": visible_stdout,
            "stderr": sandbox.stderr,
            "testsPassed": 0,
            "totalTests": total_tests,
        }

    try:
        judge_result = json.loads(result_line[len(marker) :])
        tests_passed = int(judge_result["testsPassed"])
    except (KeyError, TypeError, ValueError, json.JSONDecodeError):
        return _error_result(
            "RUNTIME_ERROR",
            "Sandbox returned an invalid result.",
            total_tests,
        )

    status = "ACCEPTED" if tests_passed == total_tests else "WRONG_ANSWER"
    return {
        "status": status,
        "stdout": visible_stdout,
        "stderr": sandbox.stderr,
        "testsPassed": tests_passed,
        "totalTests": total_tests,
    }


def submit_code(problem_id: str, user_code: str, user_id: str, language: str = "python3") -> dict:
    """Execute a submission securely, then persist its bounded result."""
    result = run_code(problem_id=problem_id, user_code=user_code, language=language)
    db_status = result["status"].lower()
    if db_status not in {
        "accepted",
        "wrong_answer",
        "runtime_error",
        "compile_error",
        "timeout",
    }:
        db_status = "runtime_error"

    submission_id: str | None = None
    client = get_supabase_client()
    if client:
        try:
            row = {
                "user_id": user_id,
                "problem_id": problem_id,
                "language": language,
                "code": user_code,
                "status": db_status,
                "tests_passed": result["testsPassed"],
                "total_tests": result["totalTests"],
                "stdout": result["stdout"][:4000],
                "stderr": result["stderr"][:4000],
            }
            saved = client.table("coding_submissions").insert(row).execute()
            if saved.data:
                submission_id = saved.data[0]["id"]
        except Exception:
            pass

    return {**result, "submissionId": submission_id}
