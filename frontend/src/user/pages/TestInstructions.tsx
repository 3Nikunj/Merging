import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const TestInstructions = () => {
  const [checkedItems, setCheckedItems] = useState([false, false, false, false]);
  const navigate = useNavigate();

  const handleCheck = (index: number) => {
    const newChecked = [...checkedItems];
    newChecked[index] = !newChecked[index];
    setCheckedItems(newChecked);
  };

  const allChecked = checkedItems.every(Boolean);

  const handleStartTest = () => {
    if (allChecked) {
      navigate('/active-test');
    } else {
      alert('Please acknowledge all items in the checklist before starting the test.');
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-7xl mx-auto px-8 py-8 flex flex-col gap-8 items-start">
          
          {/* Step Indicator */}
          <nav className="flex justify-between items-center max-w-4xl mx-auto px-4 w-full">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-accent text-nav flex items-center justify-center font-bold text-sm shadow-sm">
                <span className="text-xl">✓</span>
              </div>
              <span className="text-sm font-bold text-accent">Subject</span>
            </div>
            <div className="flex-1 h-1 bg-accent mx-4 rounded-full"></div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-accent text-nav flex items-center justify-center font-bold text-sm shadow-sm">
                <span className="text-xl">✓</span>
              </div>
              <span className="text-sm font-bold text-accent">Topic</span>
            </div>
            <div className="flex-1 h-1 bg-accent mx-4 rounded-full"></div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-accent text-nav flex items-center justify-center font-bold text-sm shadow-sm">
                <span className="text-xl">✓</span>
              </div>
              <span className="text-sm font-bold text-accent">Subtopic</span>
            </div>
            <div className="flex-1 h-1 bg-accent mx-4 rounded-full"></div>
            <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-accent text-nav flex items-center justify-center font-bold text-sm shadow-sm ring-4 ring-accent/20">
                4
              </div>
              <span className="text-sm font-bold text-accent">Instructions</span>
            </div>
          </nav>

          <div className="flex gap-8 w-full mt-4">
            {/* Main Instruction Card */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Title Bar */}
              <div className="px-8 pt-8 pb-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Prime Numbers & Factors Practice</h2>
                <div className="w-24 h-1.5 bg-accent rounded-full mb-6"></div>
                {/* Topic Breadcrumbs Card Style */}
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200 mb-8">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Subject</p>
                    <p className="text-base font-bold text-gray-900">Quantitative Aptitude</p>
                  </div>
                  <div className="w-[1px] h-10 bg-gray-300"></div>
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Topic</p>
                    <p className="text-base font-bold text-gray-900">Number Systems</p>
                  </div>
                  <div className="w-[1px] h-10 bg-gray-300"></div>
                  <div className="flex-1 text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Subtopic</p>
                    <p className="text-base font-bold text-gray-900">Prime Numbers & Factors</p>
                  </div>
                </div>
              </div>
              
              {/* Metadata Grid */}
              <div className="grid grid-cols-4 gap-4 px-8 mb-8">
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 flex flex-col items-center justify-center hover:border-accent/30 transition-colors">
                  <span className="text-accent mb-1 text-2xl">📝</span>
                  <p className="text-xs text-gray-500">Questions</p>
                  <p className="text-lg font-bold text-gray-900">30</p>
                </div>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 flex flex-col items-center justify-center hover:border-accent/30 transition-colors">
                  <span className="text-accent mb-1 text-2xl">⏱️</span>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-lg font-bold text-gray-900">45 Mins</p>
                </div>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 flex flex-col items-center justify-center hover:border-accent/30 transition-colors">
                  <span className="text-accent mb-1 text-2xl">⭐</span>
                  <p className="text-xs text-gray-500">Total Marks</p>
                  <p className="text-lg font-bold text-gray-900">60</p>
                </div>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 flex flex-col items-center justify-center hover:border-accent/30 transition-colors">
                  <span className="text-accent mb-1 text-2xl">📊</span>
                  <p className="text-xs text-gray-500">Difficulty</p>
                  <p className="text-lg font-bold text-gray-900">Medium</p>
                </div>
              </div>

              {/* Rules & Instructions */}
              <div className="px-8 border-t border-gray-200 py-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-accent text-xl">📜</span> General Instructions
                </h3>
                <ul className="space-y-4 text-gray-600">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full mt-2.5 shrink-0"></div>
                    <p>Ensure you have a stable internet connection. The test will auto-submit if the connection is lost for more than 5 minutes.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full mt-2.5 shrink-0"></div>
                    <p><span className="font-bold text-gray-900">Negative Marking:</span> Each incorrect answer will result in a deduction of <span className="text-red-600 font-bold">0.25 marks</span>. Unattempted questions carry zero marks.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full mt-2.5 shrink-0"></div>
                    <p>Calculators, mobile phones, or any other electronic devices are strictly prohibited during the assessment.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full mt-2.5 shrink-0"></div>
                    <p>Once the timer ends, the test will be automatically submitted. You can navigate between questions using the sidebar during the test.</p>
                  </li>
                </ul>
              </div>

              {/* Pre-Test Checklist */}
              <div className="px-8 py-8 bg-gray-50 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-accent text-xl">☑️</span> Pre-Test Readiness Checklist
                </h3>
                <div className="space-y-3">
                  {[
                    "My internet connection is stable and fast.",
                    "I am in a quiet environment and will not be disturbed.",
                    "I have a rough sheet and pen ready for calculations.",
                    "I am ready to start and focus for the next 45 minutes."
                  ].map((text, index) => (
                    <label key={index} className={`flex items-center gap-4 p-4 bg-white border rounded-xl cursor-pointer transition-all group ${checkedItems[index] ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-accent/50'}`}>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-gray-300 text-nav focus:ring-nav accent-accent" 
                        checked={checkedItems[index]}
                        onChange={() => handleCheck(index)}
                      />
                      <span className={`text-base transition-colors ${checkedItems[index] ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'}`}>{text}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Side Summary Card */}
            <div className="w-[340px] sticky top-8 flex flex-col gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="text-accent text-xl">📋</span> Session Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-500">Estimated Time</span>
                    <span className="font-bold text-gray-900">45 mins</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-500">Passing Score</span>
                    <span className="font-bold text-gray-900">40%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-500">Attempts Allowed</span>
                    <span className="font-bold text-gray-900">3</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-500">Last Best Score</span>
                    <span className="text-accent font-bold">72%</span>
                  </div>
                </div>
                <div className="mt-8 p-4 bg-nav/5 rounded-xl border border-nav/10 flex gap-3">
                  <span className="text-nav text-xl">ℹ️</span>
                  <p className="text-xs text-nav/80 leading-relaxed font-medium">
                    This test is AI-proctored. Ensure your face is clearly visible if webcam is required.
                  </p>
                </div>
              </div>
              
              {/* Motivational Card */}
              <div className="relative rounded-xl overflow-hidden h-40 group cursor-pointer border border-gray-200 shadow-sm bg-nav">
                <div className="absolute inset-0 bg-gradient-to-t from-nav/90 via-nav/40 to-transparent flex items-end p-5 z-10">
                  <div>
                    <p className="text-accent font-bold">You're in the top 15%</p>
                    <p className="text-white/70 text-xs">Based on your recent Quant performance.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar (Fixed Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 bg-white h-24 border-t border-gray-200 flex items-center justify-between px-8 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Link to="/test-selection" className="px-8 py-3 rounded-xl border-2 border-nav text-nav font-bold hover:bg-nav hover:text-white transition-all flex items-center gap-2">
            <span>←</span> Back to Selection
          </Link>
          <div className="flex items-center gap-8">
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <span className="text-accent">🛡️</span> Secure AI Environment Enabled
            </p>
            <button 
              onClick={handleStartTest}
              className={`px-12 py-3 font-bold rounded-xl transition-all flex items-center gap-3 shadow-lg ${allChecked ? 'bg-nav text-white hover:brightness-110 shadow-nav/20' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              <span className="text-accent">⚡</span> Start Test Now <span>▶</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestInstructions;
