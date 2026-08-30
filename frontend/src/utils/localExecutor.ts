export interface TestCase {
  inputDesc: string;
  args: any[];
  expected: any;
  jsCall: (sol: any) => any;
  pyCall: string;
}

let pyodideInstance: any = null;
let loadingPyodidePromise: Promise<any> | null = null;

export async function loadPyodideCached() {
  if (pyodideInstance) return pyodideInstance;
  if (loadingPyodidePromise) return loadingPyodidePromise;

  loadingPyodidePromise = (async () => {
    if (!(window as any).loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Pyodide compiler script"));
        document.head.appendChild(script);
      });
    }
    pyodideInstance = await (window as any).loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/"
    });
    return pyodideInstance;
  })();

  return loadingPyodidePromise;
}

export const LOCAL_TEST_CASES: Record<string, TestCase[]> = {
  "001": [
    {
      inputDesc: "nums = [2,7,11,15], target = 9",
      args: [[2, 7, 11, 15], 9],
      expected: [0, 1],
      jsCall: (sol) => sol.twoSum([2, 7, 11, 15], 9),
      pyCall: "Solution().twoSum([2,7,11,15], 9)"
    },
    {
      inputDesc: "nums = [3,2,4], target = 6",
      args: [[3, 2, 4], 6],
      expected: [1, 2],
      jsCall: (sol) => sol.twoSum([3, 2, 4], 6),
      pyCall: "Solution().twoSum([3,2,4], 6)"
    },
    {
      inputDesc: "nums = [3,3], target = 6",
      args: [[3, 3], 6],
      expected: [0, 1],
      jsCall: (sol) => sol.twoSum([3, 3], 6),
      pyCall: "Solution().twoSum([3,3], 6)"
    }
  ],
  "002": [
    {
      inputDesc: "l1 = [2,4,3], l2 = [5,6,4]",
      args: [[2,4,3], [5,6,4]],
      expected: [7, 0, 8],
      jsCall: (sol) => {
        class ListNode {
          val: number;
          next: ListNode | null = null;
          constructor(val: number) { this.val = val; }
        }
        const toList = (arr: number[]) => {
          let dummy = new ListNode(0);
          let curr = dummy;
          for (let v of arr) {
            curr.next = new ListNode(v);
            curr = curr.next;
          }
          return dummy.next;
        };
        const fromList = (node: any) => {
          let res: number[] = [];
          while (node) {
            res.push(node.val);
            node = node.next;
          }
          return res;
        };
        const result = sol.addTwoNumbers(toList([2,4,3]), toList([5,6,4]));
        return fromList(result);
      },
      pyCall: `
def to_list(arr):
    dummy = ListNode(0)
    curr = dummy
    for v in arr:
        curr.next = ListNode(v)
        curr = curr.next
    return dummy.next

def from_list(node):
    res = []
    while node:
        res.append(node.val)
        node = node.next
    return res

from_list(Solution().addTwoNumbers(to_list([2,4,3]), to_list([5,6,4])))
`
    }
  ],
  "003": [
    {
      inputDesc: "s = 'abcabcbb'",
      args: ['abcabcbb'],
      expected: 3,
      jsCall: (sol) => sol.lengthOfLongestSubstring('abcabcbb'),
      pyCall: "Solution().lengthOfLongestSubstring('abcabcbb')"
    }
  ],
  "004": [
    {
      inputDesc: "nums1 = [1,3], nums2 = [2]",
      args: [[1, 3], [2]],
      expected: 2.0,
      jsCall: (sol) => sol.findMedianSortedArrays([1, 3], [2]),
      pyCall: "Solution().findMedianSortedArrays([1, 3], [2])"
    }
  ],
  "005": [
    {
      inputDesc: "s = 'babad'",
      args: ['babad'],
      expected: "bab",
      jsCall: (sol) => {
        const res = sol.longestPalindrome('babad');
        return (res === "bab" || res === "aba") ? "bab" : res;
      },
      pyCall: `
res = Solution().longestPalindrome('babad')
"bab" if res in ["bab", "aba"] else res
`
    }
  ],
  "006": [
    {
      inputDesc: "s = 'PAYPALISHIRING', numRows = 3",
      args: ['PAYPALISHIRING', 3],
      expected: "PAHNAPLSIIGYIR",
      jsCall: (sol) => sol.convert('PAYPALISHIRING', 3),
      pyCall: "Solution().convert('PAYPALISHIRING', 3)"
    }
  ],
  "007": [
    {
      inputDesc: "x = 123",
      args: [123],
      expected: 321,
      jsCall: (sol) => sol.reverse(123),
      pyCall: "Solution().reverse(123)"
    }
  ],
  "008": [
    {
      inputDesc: "s = '42'",
      args: ['42'],
      expected: 42,
      jsCall: (sol) => sol.myAtoi('42'),
      pyCall: "Solution().myAtoi('42')"
    }
  ],
  "009": [
    {
      inputDesc: "x = 121",
      args: [121],
      expected: true,
      jsCall: (sol) => sol.isPalindrome(121),
      pyCall: "Solution().isPalindrome(121)"
    }
  ]
};

export async function executeJavaScriptLocal(code: string, problemId: string) {
  const testCases = LOCAL_TEST_CASES[problemId];
  if (!testCases) {
    throw new Error("No client test cases configured for this problem");
  }

  let stdout = "";
  let stderr = "";
  
  const originalLog = console.log;
  console.log = (...args: any[]) => {
    stdout += args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(" ") + "\n";
  };

  let testsPassed = 0;
  try {
    const wrappedCode = `
      ${code}
      new Solution();
    `;
    const solutionInstance = (0, eval)(wrappedCode);

    for (const tc of testCases) {
      const got = tc.jsCall(solutionInstance);
      if (JSON.stringify(got) === JSON.stringify(tc.expected)) {
        testsPassed++;
      } else {
        stderr += `Wrong Answer for input: ${tc.inputDesc}. Expected: ${JSON.stringify(tc.expected)}, Got: ${JSON.stringify(got)}\n`;
      }
    }
  } catch (err: any) {
    stderr += err.message || String(err);
  } finally {
    console.log = originalLog;
  }

  return {
    status: stderr.includes("Wrong Answer") ? "WRONG_ANSWER" : (stderr ? "RUNTIME_ERROR" : "ACCEPTED"),
    stdout,
    stderr,
    testsPassed,
    totalTests: testCases.length
  } as any;
}

export async function executePythonLocal(code: string, problemId: string) {
  const testCases = LOCAL_TEST_CASES[problemId];
  if (!testCases) {
    throw new Error("No client test cases configured for this problem");
  }

  let stdout = "";
  let stderr = "";

  let testsPassed = 0;
  try {
    const pyodide = await loadPyodideCached();
    pyodide.setStdout({ batched: (text: string) => { stdout += text + "\n"; } });
    pyodide.setStderr({ batched: (text: string) => { stderr += text + "\n"; } });

    const listNodeDef = `
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
`;
    
    const prepCode = `${listNodeDef}\n${code}`;
    await pyodide.runPythonAsync(prepCode);

    for (const tc of testCases) {
      const res = await pyodide.runPythonAsync(tc.pyCall);
      let got = res;
      if (res && typeof res.toJs === 'function') {
        got = res.toJs();
      }

      if (JSON.stringify(got) === JSON.stringify(tc.expected)) {
        testsPassed++;
      } else {
        stderr += `Wrong Answer for input: ${tc.inputDesc}. Expected: ${JSON.stringify(tc.expected)}, Got: ${JSON.stringify(got)}\n`;
      }
    }
  } catch (err: any) {
    stderr += err.message || String(err);
  }

  return {
    status: stderr.includes("Wrong Answer") ? "WRONG_ANSWER" : (stderr ? "RUNTIME_ERROR" : "ACCEPTED"),
    stdout,
    stderr,
    testsPassed,
    totalTests: testCases.length
  } as any;
}
