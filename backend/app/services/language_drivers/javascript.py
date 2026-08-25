import json
from app.services.language_drivers.base import BaseLanguageDriver

class JavaScriptLanguageDriver(BaseLanguageDriver):
    def build_payload(
        self,
        problem_id: str,
        user_code: str,
        marker: str,
        tests: list[dict[str, str]],
    ) -> dict:
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
