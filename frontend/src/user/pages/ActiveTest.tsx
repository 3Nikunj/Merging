import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ActiveTest = () => {
  const [timeLeft, setTimeLeft] = useState(44 * 60 + 52); // 44:52
  const [selectedOption, setSelectedOption] = useState('B');
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const isLowTime = timeLeft < 300;

  const handleSubmit = () => {
    navigate('/test-results');
  };

  return (
    <div className="flex h-screen bg-[#F8F3E7] font-sans overflow-hidden">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full h-[72px] bg-nav text-white flex justify-between items-center px-6 z-50 border-b border-white/20">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-accent">AiValytics</span>
            <span className="text-sm text-white/70">Prime Numbers & Factors Practice</span>
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/5 px-6 py-2 rounded-full border border-white/10">
          <span className="text-accent text-xl">⏱️</span>
          <span className={`text-xl font-bold tracking-widest ${isLowTime ? 'text-red-500' : 'text-white'}`} style={{ textShadow: isLowTime ? 'none' : '0 0 10px rgba(245, 189, 88, 0.3)' }}>
            {timeString}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-4 mr-4 text-white/60">
            <span className="cursor-pointer hover:text-white transition-colors text-xl">❓</span>
            <span className="cursor-pointer hover:text-white transition-colors text-xl">⚙️</span>
          </div>
          <button 
            onClick={handleSubmit}
            className="bg-black text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-white hover:text-black transition-all border border-white/10"
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* Sidebar Wrapper */}
      <aside className="fixed left-0 top-[72px] bottom-0 w-[280px] bg-nav flex flex-col z-40">
        <div className="p-6 flex flex-col h-full">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full border-2 border-accent bg-gray-500 flex items-center justify-center text-white overflow-hidden">
                 <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">Placement Prep</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">Section: Technical MCQ</p>
              </div>
            </div>
            <div className="mt-6 bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm text-white/80">Progress</span>
                <span className="text-sm text-accent">12 of 30 Answered</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-accent" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>

          {/* Question Grid */}
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((q) => {
                let statusClass = 'bg-white/10 text-white/40'; // not answered
                if (q < 12) statusClass = 'bg-green-600 text-white'; // answered
                if (q === 15 || q === 22) statusClass = 'bg-accent text-black font-bold'; // marked
                if (q === 12) statusClass = 'bg-white text-black border-2 border-accent font-bold'; // current

                return (
                  <button key={q} className={`aspect-square flex items-center justify-center rounded-lg text-sm transition-all hover:scale-105 ${statusClass}`}>
                    {q}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-auto pt-6 border-t border-white/10 grid grid-cols-2 gap-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
              <span className="text-[10px] text-white/60">Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-white/10"></div>
              <span className="text-[10px] text-white/60">Not Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent"></div>
              <span className="text-[10px] text-white/60">Marked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-white"></div>
              <span className="text-[10px] text-white/60">Current</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-[280px] pt-[72px] h-screen flex flex-col w-full relative">
        <div className="flex-1 p-8 overflow-y-auto pb-24">
          <div className="max-w-[800px] mx-auto">
            {/* Breadcrumbs/Section Title */}
            <div className="mb-8">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                <span>Quantitative Aptitude</span>
                <span>›</span>
                <span>Number Systems</span>
              </div>

              <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                {/* Question Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Question 12</h2>
                    <div className="w-12 h-1 bg-accent mt-2"></div>
                  </div>
                  <div className="bg-gray-100 p-2 px-4 rounded-full flex items-center gap-2">
                    <span className="text-accent text-lg">⭐</span>
                    <span className="text-sm font-bold text-accent">4 Points</span>
                  </div>
                </div>

                {/* Question Text */}
                <div className="text-lg text-gray-800 mb-8 leading-relaxed">
                  If 'p' and 'q' are prime numbers such that <span className="italic font-serif">p &gt; q</span>, what is the value of <span className="italic font-serif">p<sup>2</sup> - q<sup>2</sup></span> if their sum is 12?
                </div>

                {/* MCQ Options */}
                <div className="space-y-4">
                  {[
                    { id: 'A', value: '24' },
                    { id: 'B', value: '48' },
                    { id: 'C', value: '36' },
                    { id: 'D', value: '72' }
                  ].map((opt) => (
                    <label key={opt.id} className="group block cursor-pointer">
                      <input 
                        className="hidden peer" 
                        name="mcq" 
                        type="radio" 
                        checked={selectedOption === opt.id}
                        onChange={() => setSelectedOption(opt.id)}
                      />
                      <div className={`flex items-center p-4 rounded-lg border transition-all ${
                        selectedOption === opt.id 
                          ? 'border-accent bg-accent/10 ring-1 ring-accent' 
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}>
                        <span className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold mr-4 transition-colors ${
                          selectedOption === opt.id
                            ? 'bg-accent border-accent text-black'
                            : 'border-gray-300 text-gray-500 group-hover:border-accent'
                        }`}>
                          {opt.id}
                        </span>
                        <span className="text-base text-gray-900">{opt.value}</span>
                        {selectedOption === opt.id && (
                          <div className="ml-auto text-accent text-xl">
                            ✅
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Auxiliary Information Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/50 p-6 rounded-xl border border-gray-200">
                <h4 className="text-sm font-bold text-gray-600 mb-2">Calculator Hint</h4>
                <p className="text-[13px] text-gray-500">Remember: A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself.</p>
              </div>
              <div className="bg-white/50 p-6 rounded-xl border border-gray-200 relative overflow-hidden group">
                <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:scale-110 transition-transform duration-700 text-6xl">
                  🧮
                </div>
                <h4 className="text-sm font-bold text-gray-600 mb-2">Quick Reference</h4>
                <ul className="text-[12px] text-gray-500 space-y-1">
                  <li>• p + q = 12</li>
                  <li>• Find p² - q²</li>
                  <li>• Hint: (p+q)(p-q)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <footer className="absolute bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-200 px-8 flex justify-between items-center z-50">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-50 transition-all font-semibold">
              <span>←</span> Previous
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-accent text-sm hover:bg-accent/10 transition-all font-semibold">
              <span>📌</span> Mark for Review
            </button>
            <div className="w-px h-6 bg-gray-300 mx-2"></div>
            <button 
              onClick={handleSubmit}
              className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-nav text-white text-sm hover:shadow-lg transition-all font-semibold"
            >
              Save & Next <span>→</span>
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default ActiveTest;
