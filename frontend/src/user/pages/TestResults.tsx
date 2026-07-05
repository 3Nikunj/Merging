import { Link } from 'react-router-dom';

const TestResults = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      {/* Hero Header */}
      <section className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <span>Practice Tests</span>
            <span>›</span>
            <span>Analytics</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Performance Analysis: Prime Numbers & Factors Practice</h1>
          <p className="text-lg text-gray-500 mt-2 max-w-2xl">Excellent effort! Your understanding of prime concepts is above average, with notable speed in factor identification.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/active-test" className="px-6 py-3 border-2 border-gray-900 text-gray-900 font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <span>↻</span> Retry Test
          </Link>
          <button className="px-6 py-3 bg-accent text-black font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
            <span>⬇</span> Download Result
          </button>
        </div>
      </section>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Score Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 flex items-center justify-center rounded-full" style={{ background: 'conic-gradient(#10b981 78%, #f3f3f4 0)' }}>
            <div className="absolute inset-2 bg-white rounded-full flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900">78%</span>
              <span className="text-sm text-gray-500">Overall</span>
            </div>
          </div>
          <p className="mt-4 text-lg font-bold text-accent">Strong Performance</p>
        </div>

        {/* Stats Column */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wider mb-4 font-bold">Question Stats</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-sm text-gray-700"><span className="w-3 h-3 rounded-full bg-green-600"></span> Correct</span>
                <span className="font-bold text-gray-900">24</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-sm text-gray-700"><span className="w-3 h-3 rounded-full bg-red-500"></span> Incorrect</span>
                <span className="font-bold text-gray-900">4</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-sm text-gray-700"><span className="w-3 h-3 rounded-full bg-gray-300"></span> Skipped</span>
                <span className="font-bold text-gray-900">2</span>
              </div>
            </div>
          </div>
        </div>

        {/* Time Taken */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col justify-center text-center">
          <span className="text-gray-900 text-4xl mb-2">⏱️</span>
          <p className="text-sm text-gray-500 mb-1 font-bold">Time Taken</p>
          <p className="text-3xl font-bold text-gray-900">38:15</p>
          <p className="text-xs text-green-600 font-medium">12% faster than average</p>
        </div>

        {/* Percentile */}
        <div className="bg-nav border border-nav rounded-xl shadow-sm p-6 flex flex-col justify-center text-center text-white">
          <span className="text-accent text-4xl mb-2">🏆</span>
          <p className="text-sm opacity-70 mb-1 font-bold">Global Percentile</p>
          <p className="text-3xl font-bold text-accent">92nd</p>
          <p className="text-xs opacity-70 font-medium">Top 8% of all candidates</p>
        </div>
      </div>

      {/* Performance Breakdown & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Breakdown */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-accent">📊</span> Topic-wise Performance
          </h3>
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Number Theory</span>
                <span className="font-bold text-gray-900">85%</span>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Factors & Multiples</span>
                <span className="font-bold text-gray-900">70%</span>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Prime Identification</span>
                <span className="font-bold text-gray-900">90%</span>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: '90%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="mt-10 pt-8 border-t border-gray-200">
            <h4 className="text-sm text-gray-500 uppercase tracking-widest mb-4 font-bold">Weak Areas</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-4 py-2 bg-accent/20 text-accent font-bold text-sm rounded-full flex items-center gap-2">
                Advanced Divisibility <span className="text-lg">📈</span>
              </span>
              <span className="px-4 py-2 bg-gray-100 text-gray-600 font-bold text-sm rounded-full">
                Co-prime Logic
              </span>
              <span className="px-4 py-2 bg-gray-100 text-gray-600 font-bold text-sm rounded-full">
                Composite Factorization
              </span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-accent">✨</span> Recommended Next
          </h3>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 group cursor-pointer hover:border-accent transition-all">
            <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4 text-accent text-2xl">
              🧮
            </div>
            <h4 className="text-lg font-bold mb-2 text-gray-900 group-hover:text-accent transition-colors">LCM & HCF Masterclass</h4>
            <p className="text-sm text-gray-500 mb-4">Master the foundations of common factors and multiples with advanced shortcuts.</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-accent uppercase">Intermediate</span>
              <span className="group-hover:translate-x-1 transition-transform text-accent font-bold">→</span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 group cursor-pointer hover:border-accent transition-all">
            <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4 text-accent text-2xl">
              ∑
            </div>
            <h4 className="text-lg font-bold mb-2 text-gray-900 group-hover:text-accent transition-colors">Modular Arithmetic</h4>
            <p className="text-sm text-gray-500 mb-4">Connect your prime number knowledge to advanced modular concepts.</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-accent uppercase">Advanced</span>
              <span className="group-hover:translate-x-1 transition-transform text-accent font-bold">→</span>
            </div>
          </div>
        </div>
      </div>

      {/* Answer Review Table */}
      <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-bold text-gray-900">Answer Review</h3>
          <div className="flex gap-4">
            <select className="border-gray-300 rounded-lg text-sm focus:ring-accent outline-none px-3 py-2">
              <option>All Questions</option>
              <option>Incorrect Only</option>
              <option>Skipped Only</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider font-bold">
              <tr>
                <th className="px-8 py-4 font-bold">Q.No</th>
                <th className="px-8 py-4 font-bold">Question Preview</th>
                <th className="px-8 py-4 font-bold">Status</th>
                <th className="px-8 py-4 font-bold">Topic</th>
                <th className="px-8 py-4 font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-8 py-5 font-bold text-gray-900">01</td>
                <td className="px-8 py-5 text-sm text-gray-700">Which of the following is the only even prime...</td>
                <td className="px-8 py-5">
                  <span className="flex items-center gap-2 text-green-600 font-bold text-sm">
                    ✅ Correct
                  </span>
                </td>
                <td className="px-8 py-5 text-sm text-gray-700">Prime Identification</td>
                <td className="px-8 py-5">
                  <a className="text-accent font-bold text-sm hover:underline cursor-pointer">View Explanation</a>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-8 py-5 font-bold text-gray-900">02</td>
                <td className="px-8 py-5 text-sm text-gray-700">Find the prime factorization of 1240...</td>
                <td className="px-8 py-5">
                  <span className="flex items-center gap-2 text-red-500 font-bold text-sm">
                    ❌ Incorrect
                  </span>
                </td>
                <td className="px-8 py-5 text-sm text-gray-700">Factors & Multiples</td>
                <td className="px-8 py-5">
                  <a className="text-accent font-bold text-sm hover:underline cursor-pointer">View Explanation</a>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-8 py-5 font-bold text-gray-900">03</td>
                <td className="px-8 py-5 text-sm text-gray-700">How many divisors does the number 48 have...</td>
                <td className="px-8 py-5">
                  <span className="flex items-center gap-2 text-green-600 font-bold text-sm">
                    ✅ Correct
                  </span>
                </td>
                <td className="px-8 py-5 text-sm text-gray-700">Number Theory</td>
                <td className="px-8 py-5">
                  <a className="text-accent font-bold text-sm hover:underline cursor-pointer">View Explanation</a>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-8 py-5 font-bold text-gray-900">04</td>
                <td className="px-8 py-5 text-sm text-gray-700">If P is a prime number greater than 3, then...</td>
                <td className="px-8 py-5">
                  <span className="flex items-center gap-2 text-gray-500 font-bold text-sm">
                    ⏭️ Skipped
                  </span>
                </td>
                <td className="px-8 py-5 text-sm text-gray-700">Advanced Primes</td>
                <td className="px-8 py-5">
                  <a className="text-accent font-bold text-sm hover:underline cursor-pointer">View Explanation</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-8 py-4 bg-gray-50 flex justify-center border-t border-gray-200">
          <button className="text-gray-900 font-bold text-sm flex items-center gap-2 hover:text-accent transition-colors">
            Show More Questions <span>↓</span>
          </button>
        </div>
      </section>
      
      <footer className="mt-12 border-t border-gray-200 pt-8 text-center pb-8">
        <div className="max-w-[600px] mx-auto">
          <h4 className="text-lg font-bold text-gray-900 mb-2 italic">"Precision is the hallmark of progress."</h4>
          <p className="text-gray-500 text-sm">AiValytics Intelligence Engine • Data accurate as of today at 14:30 GMT</p>
        </div>
      </footer>
    </div>
  );
};

export default TestResults;
