
const PracticeTests = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      {/* Page Title */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Practice Tests</h2>
        <p className="text-gray-500 mt-1">Hone your skills with curated assessments from industry experts.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-8 border-b border-gray-200 mb-8">
        <button className="pb-4 px-2 font-semibold text-gray-900 border-b-2 border-accent relative">
          Subject Wise
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Content: Filters & Grid */}
        <div className="col-span-12 lg:col-span-9 space-y-8">
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-wrap gap-4 items-center shadow-sm">
            <div className="flex-1 min-w-[240px] relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-accent outline-none" placeholder="Search by title..." type="text" />
            </div>
            <select className="bg-white border border-gray-300 rounded-lg text-sm px-4 py-2 outline-none focus:ring-1 focus:ring-accent cursor-pointer">
              <option>All Subjects</option>
              <option>Computer Science</option>
              <option>Mathematics</option>
              <option>Aptitude</option>
            </select>
            <select className="bg-white border border-gray-300 rounded-lg text-sm px-4 py-2 outline-none focus:ring-1 focus:ring-accent cursor-pointer">
              <option>Difficulty</option>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
            <select className="bg-white border border-gray-300 rounded-lg text-sm px-4 py-2 outline-none focus:ring-1 focus:ring-accent cursor-pointer">
              <option>Status</option>
              <option>Not Started</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
          </div>

          {/* Test Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all group overflow-hidden flex flex-col cursor-pointer">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-gray-100 text-[11px] font-bold uppercase tracking-wider rounded-full text-gray-500">Computer Science</span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-[11px] font-bold rounded-full">Not Started</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Data Structures & Algorithms</h3>
                <div className="flex items-center gap-4 text-gray-500 text-sm mb-6">
                  <div className="flex items-center gap-1">
                    <span>📝</span>
                    <span>45 Qs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>⏱️</span>
                    <span>60 Mins</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>📊</span>
                    <span>Medium</span>
                  </div>
                </div>
              </div>
              <div className="mt-auto p-6 bg-gray-50 border-t border-gray-100">
                <button className="w-full bg-nav text-white py-3 rounded-lg font-bold hover:brightness-110 transition-all active:scale-95">Start Test</button>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all group overflow-hidden flex flex-col cursor-pointer">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-gray-100 text-[11px] font-bold uppercase tracking-wider rounded-full text-gray-500">Systems</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full">In Progress</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Operating Systems Fundamentals</h3>
                <div className="flex items-center gap-4 text-gray-500 text-sm mb-6">
                  <div className="flex items-center gap-1">
                    <span>📝</span>
                    <span>30 Qs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>⏱️</span>
                    <span>45 Mins</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>📊</span>
                    <span>Hard</span>
                  </div>
                </div>
              </div>
              <div className="mt-auto p-6 bg-gray-50 border-t border-gray-100">
                <button className="w-full bg-white border-2 border-nav text-nav py-3 rounded-lg font-bold hover:bg-nav hover:text-white transition-all active:scale-95">Resume Test</button>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all group overflow-hidden flex flex-col cursor-pointer">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-gray-100 text-[11px] font-bold uppercase tracking-wider rounded-full text-gray-500">Mathematics</span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-[11px] font-bold rounded-full">Not Started</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Probability & Statistics</h3>
                <div className="flex items-center gap-4 text-gray-500 text-sm mb-6">
                  <div className="flex items-center gap-1">
                    <span>📝</span>
                    <span>25 Qs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>⏱️</span>
                    <span>40 Mins</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>📊</span>
                    <span>Medium</span>
                  </div>
                </div>
              </div>
              <div className="mt-auto p-6 bg-gray-50 border-t border-gray-100">
                <button className="w-full bg-nav text-white py-3 rounded-lg font-bold hover:brightness-110 transition-all active:scale-95">Start Test</button>
              </div>
            </div>

            {/* Card 4 (Locked) */}
            <div className="bg-white rounded-xl border-dashed border-2 border-gray-300 opacity-70 overflow-hidden flex flex-col">
              <div className="p-6 flex flex-col items-center justify-center h-full text-center py-12">
                <span className="text-4xl text-gray-300 mb-4">🔒</span>
                <h3 className="text-xl font-bold text-gray-700 mb-2">Premium Tests</h3>
                <p className="text-sm text-gray-500 mb-6">Unlock 50+ advanced company mock tests</p>
                <button className="px-6 py-2 bg-accent text-black rounded-lg font-bold hover:brightness-105">Upgrade Now</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="col-span-12 lg:col-span-3 space-y-8">
          {/* Recommended For You */}
          <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-accent">✨</span> Recommended
            </h4>
            <div className="space-y-4">
              <div className="p-4 border border-gray-100 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all cursor-pointer">
                <p className="text-[10px] font-bold text-accent uppercase mb-1">High Impact</p>
                <p className="font-semibold text-gray-900">Trie Data Structures</p>
                <p className="text-xs text-gray-500 mt-1">Commonly asked in Google & Meta</p>
              </div>
              <div className="p-4 border border-gray-100 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all cursor-pointer">
                <p className="text-[10px] font-bold text-accent uppercase mb-1">Skill Gap</p>
                <p className="font-semibold text-gray-900">Dynamic Programming I</p>
                <p className="text-xs text-gray-500 mt-1">Improve your speed in hard Qs</p>
              </div>
            </div>
          </section>

          {/* Targeted Weak Areas */}
          <section className="bg-nav text-white p-6 rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-accent/20 rounded-full blur-2xl"></div>
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-accent">
              <span>📉</span> Weak Areas
            </h4>
            <p className="text-xs text-white/60 mb-6 italic">Based on your last 3 attempts</p>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-medium">Recursion</span>
                  <span className="text-accent font-bold">34% Accuracy</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-accent w-[34%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-medium">SQL Joins</span>
                  <span className="text-accent font-bold">48% Accuracy</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-accent w-[48%]"></div>
                </div>
              </div>
            </div>
            <button className="mt-8 w-full py-2 border-2 border-accent text-accent rounded-lg text-xs font-bold hover:bg-accent hover:text-nav transition-all">Generate Focused Test</button>
          </section>

          {/* Quote Widget */}
          <div className="p-6 rounded-xl bg-accent text-nav relative overflow-hidden group">
            <div className="relative z-10">
              <span className="text-3xl opacity-20 block mb-2">❝</span>
              <p className="italic leading-relaxed text-sm font-medium">
                "The expert in anything was once a beginner. Consistency is the only secret."
              </p>
              <p className="mt-4 text-[10px] font-extrabold uppercase opacity-80">— Mentor Daily Tip</p>
            </div>
            <span className="absolute -bottom-4 -right-4 text-6xl opacity-10 transition-transform group-hover:scale-110">💡</span>
          </div>
        </div>
      </div>
      
      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-nav text-accent rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform group z-50">
        <span className="text-2xl">💬</span>
        <span className="absolute right-16 bg-nav text-white px-3 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">AI Study Buddy</span>
      </button>
    </div>
  );
};

export default PracticeTests;
