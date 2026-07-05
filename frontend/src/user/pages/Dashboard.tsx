
const Dashboard = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      {/* Metrics */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-card p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-light text-xl">📈</div>
            <span className="text-sm font-semibold text-green">+12% vs last week</span>
          </div>
          <div className="text-xs font-bold text-gray-500 tracking-wider mb-1">OVERALL SCORE</div>
          <div className="text-4xl font-extrabold text-gray-900">842 <span className="text-lg text-gray-400 font-medium">/ 1000</span></div>
        </div>
        <div className="bg-card p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-light text-xl">☑️</div>
          </div>
          <div className="text-xs font-bold text-gray-500 tracking-wider mb-1">TESTS COMPLETED</div>
          <div className="text-4xl font-extrabold text-gray-900">24</div>
        </div>
        <div className="bg-card p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-yellow-light text-xl">👥</div>
          </div>
          <div className="text-xs font-bold text-gray-500 tracking-wider mb-1">PERCENTILE</div>
          <div className="text-4xl font-extrabold text-gray-900">92.4%</div>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-[2fr_1fr] gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          
          <div className="bg-card rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Assigned Tests</h3>
              <a href="#" className="text-orange text-sm font-semibold hover:underline">View All</a>
            </div>
            
            <div className="flex items-center p-4 bg-gray-50 rounded-lg mb-4">
              <div className="text-2xl mr-4">📄</div>
              <div className="flex-grow">
                <h4 className="font-semibold text-gray-900 mb-1">Data Structures & Algorithms Advanced</h4>
                <p className="text-xs text-gray-500">Due in 2 days • 90 mins</p>
              </div>
              <button className="bg-accent text-black px-4 py-2 rounded-md font-semibold text-sm">Start Test</button>
            </div>
            
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mr-4">🧠</div>
              <div className="flex-grow">
                <h4 className="font-semibold text-gray-900 mb-1">Quantitative Aptitude: Mock II</h4>
                <p className="text-xs text-gray-500">Due in 5 days • 60 mins</p>
              </div>
              <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-md font-semibold text-sm">Resume</button>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">Recent Results</h3>
            </div>
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex-grow mr-8">
                <h4 className="font-semibold text-gray-900 text-sm mb-2">System Design Foundation</h4>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-accent h-full" style={{width: '88%'}}></div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="bg-blue-light text-blue font-semibold text-sm px-3 py-1 rounded">88/100</span>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-gray-500 font-bold tracking-wider">RANK</span>
                  <span className="text-sm font-bold text-gray-900">12 / 450</span>
                </div>
                <span className="text-gray-400 font-bold">{'>'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-grow mr-8">
                <h4 className="font-semibold text-gray-900 text-sm mb-2">Python Scripting Basics</h4>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-accent h-full" style={{width: '72%'}}></div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="bg-blue-light text-blue font-semibold text-sm px-3 py-1 rounded">72/100</span>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-gray-500 font-bold tracking-wider">RANK</span>
                  <span className="text-sm font-bold text-gray-900">102 / 1200</span>
                </div>
                <span className="text-gray-400 font-bold">{'>'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-card rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-2">AI Pick: SQL Mastery</h3>
              <p className="text-sm text-gray-500 mb-6">Based on your recent weak performance in relational databases.</p>
              <button className="bg-nav text-white px-5 py-2.5 rounded-lg font-semibold text-sm">Practice Now →</button>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 z-0"></div>
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Flash Revision</h3>
                <p className="text-sm text-gray-500 mb-6">Quick 10-minute session on Operating System concepts.</p>
                <button className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-semibold text-sm">Start Quiz ⏱️</button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          
          <div className="bg-card rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Focus Areas</h3>
            <div className="h-48 flex items-center justify-center mb-4 relative">
              {/* CSS polygon for Spider Chart mock */}
              <div className="w-32 h-32 bg-[#fdf5e6] absolute" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 90% 80%, 10% 80%, 0% 25%)' }}></div>
              <span className="absolute top-2 text-[10px] text-gray-400 font-bold">DSA</span>
              <span className="absolute right-4 text-[10px] text-gray-400 font-bold">SYSTEM</span>
              <span className="absolute bottom-4 right-10 text-[10px] text-gray-400 font-bold">MATH</span>
              <span className="absolute bottom-4 left-10 text-[10px] text-gray-400 font-bold">DBMS</span>
              <span className="absolute left-4 text-[10px] text-gray-400 font-bold">OS</span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center text-gray-700"><span className="w-2 h-2 rounded-full bg-red mr-2"></span> Graph Algorithms</div>
                <span className="font-semibold text-gray-900">Needs Prep</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center text-gray-700"><span className="w-2 h-2 rounded-full bg-accent mr-2"></span> Normalization</div>
                <span className="font-semibold text-gray-900">Moderate</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center text-gray-700"><span className="w-2 h-2 rounded-full bg-green mr-2"></span> Recursion</div>
                <span className="font-semibold text-gray-900">Strong</span>
              </div>
            </div>
          </div>

          <div className="bg-nav rounded-xl p-6 shadow-sm text-white">
            <h3 className="text-lg font-bold mb-6">Upcoming Contests</h3>
            <div className="flex mb-6 relative">
              <div className="w-2 h-2 rounded-full bg-accent mt-1.5 mr-4 z-10 shrink-0"></div>
              <div className="absolute left-[3px] top-3 bottom-[-24px] w-[2px] bg-white/20"></div>
              <div>
                <span className="text-xs font-bold text-accent tracking-wider">OCT 24, 18:00</span>
                <h4 className="font-semibold text-sm mt-1 mb-1">CodeRush: Global Weekly</h4>
                <p className="text-xs text-gray-400 mb-2">Top 10 win premium perks</p>
                <a href="#" className="text-xs font-semibold text-white hover:underline">Register Now ↗</a>
              </div>
            </div>
            <div className="flex relative">
              <div className="w-2 h-2 rounded-full bg-accent mt-1.5 mr-4 z-10 shrink-0"></div>
              <div>
                <span className="text-xs font-bold text-gray-400 tracking-wider">OCT 28, 10:00</span>
                <h4 className="font-semibold text-sm mt-1 mb-1">Fintech Simulation Challenge</h4>
                <p className="text-xs text-gray-400 mb-2">Focused on HFT algorithms</p>
                <span className="text-xs font-semibold text-gray-400">Interested +</span>
              </div>
            </div>
          </div>

          <div className="bg-accent rounded-xl p-6 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Resume Review</h3>
              <p className="text-sm text-gray-900 mb-6 max-w-[80%]">Get your resume reviewed by our AI for top tech firms.</p>
              <button className="bg-nav text-white px-5 py-2.5 rounded-lg font-semibold text-sm">Upload PDF</button>
            </div>
            <div className="absolute right-[-20px] bottom-[-20px] text-8xl opacity-10 pointer-events-none">📄</div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
