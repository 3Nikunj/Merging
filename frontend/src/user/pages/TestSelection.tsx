import { useState } from 'react';
import { Link } from 'react-router-dom';

const TestSelection = () => {
  const [selectedSubject, setSelectedSubject] = useState('Quantitative Aptitude');
  const [selectedTopic, setSelectedTopic] = useState('Number Systems');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');

  return (
    <div className="flex flex-col h-full relative p-8">
      <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col pb-24">
        {/* Step Indicator */}
        <nav className="mb-8 flex justify-between items-center max-w-4xl mx-auto px-4 w-full">
          <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-accent text-nav flex items-center justify-center font-bold text-sm shadow-sm">
              <span className="text-xl">✓</span>
            </div>
            <span className="text-sm font-bold text-accent">Subject</span>
          </div>
          <div className="flex-1 h-1 bg-accent mx-4 rounded-full"></div>
          <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-accent text-nav flex items-center justify-center font-bold text-sm shadow-sm ring-4 ring-accent/20">
              2
            </div>
            <span className="text-sm font-bold text-accent">Topic</span>
          </div>
          <div className="flex-1 h-1 bg-gray-200 mx-4 rounded-full"></div>
          <div className="flex flex-col items-center gap-2 opacity-50">
            <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <span className="text-sm">Subtopic</span>
          </div>
          <div className="flex-1 h-1 bg-gray-200 mx-4 rounded-full"></div>
          <div className="flex flex-col items-center gap-2 opacity-50">
            <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-sm">
              4
            </div>
            <span className="text-sm">Instructions</span>
          </div>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow min-h-[500px]">
          {/* Column 1: Subjects */}
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900">
              <span className="text-accent">🎓</span> Select Subject
            </h2>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex flex-col gap-3 overflow-y-auto flex-1">
              {['Quantitative Aptitude', 'Data Interpretation', 'Logical Reasoning'].map((subject) => (
                <div 
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedSubject === subject ? 'bg-[#FFFDF5] border-accent shadow-[inset_4px_0_0_0_#10b981]' : 'bg-white border-transparent hover:border-gray-300'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-semibold ${selectedSubject === subject ? 'text-accent' : 'text-gray-900'}`}>{subject}</h3>
                    {subject === 'Quantitative Aptitude' && <span className="bg-red-100 text-red-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded">Weak Area</span>}
                  </div>
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-accent h-full" style={{ width: subject === 'Quantitative Aptitude' ? '75%' : subject === 'Data Interpretation' ? '40%' : '10%' }}></div>
                    </div>
                    <div className="flex justify-between text-[11px] font-medium text-gray-500">
                      <span>{subject === 'Quantitative Aptitude' ? '75%' : subject === 'Data Interpretation' ? '40%' : '10%'} Complete</span>
                      <span>Avg. {subject === 'Quantitative Aptitude' ? '64%' : subject === 'Data Interpretation' ? '82%' : '55%'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Column 2: Topics */}
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900">
              <span className="text-accent">📁</span> Select Topic
            </h2>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex flex-col gap-3 overflow-y-auto flex-1">
              {['Number Systems', 'Profit & Loss', 'Time & Work'].map((topic) => (
                <div 
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedTopic === topic ? 'bg-[#FFFDF5] border-accent shadow-[inset_4px_0_0_0_#10b981]' : 'bg-white border-transparent hover:border-gray-300'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-semibold ${selectedTopic === topic ? 'text-accent' : 'text-gray-900'}`}>{topic}</h3>
                    {topic === 'Number Systems' && <span className="bg-green-100 text-green-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded">Recommended</span>}
                  </div>
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-accent h-full" style={{ width: topic === 'Number Systems' ? '85%' : topic === 'Profit & Loss' ? '30%' : '0%' }}></div>
                    </div>
                    <div className="flex justify-between text-[11px] font-medium text-gray-500">
                      <span>{topic === 'Number Systems' ? '85%' : topic === 'Profit & Loss' ? '30%' : '0%'} Complete</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Column 3: Subtopics */}
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900">
              <span className="text-accent">📄</span> Select Subtopic
            </h2>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex flex-col gap-3 overflow-y-auto flex-1">
              {['Prime Numbers & Factors', 'Divisibility Rules', 'HCF & LCM'].map((subtopic) => (
                <div 
                  key={subtopic}
                  onClick={() => setSelectedSubtopic(subtopic)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedSubtopic === subtopic ? 'bg-[#FFFDF5] border-accent shadow-[inset_4px_0_0_0_#10b981]' : 'bg-white border-transparent hover:border-gray-300'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-semibold ${selectedSubtopic === subtopic ? 'text-accent' : 'text-gray-900'}`}>{subtopic}</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-accent h-full" style={{ width: subtopic === 'Prime Numbers & Factors' ? '90%' : subtopic === 'Divisibility Rules' ? '25%' : '15%' }}></div>
                    </div>
                    <div className="flex justify-between text-[11px] font-medium text-gray-500">
                      <span>{subtopic === 'Prime Numbers & Factors' ? '90%' : subtopic === 'Divisibility Rules' ? '25%' : '15%'} Complete</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <footer className="absolute bottom-0 left-0 right-0 h-24 bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.04)] border-t border-gray-200 px-8 flex items-center">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/practice-tests" className="px-6 py-3 font-semibold text-nav border border-gray-300 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2">
              <span>←</span> Back
            </Link>
            <div className="hidden sm:flex flex-col">
              <span className="text-sm text-gray-500">Selection Summary</span>
              <span className="text-base font-bold text-gray-900">
                {selectedSubject} &gt; {selectedTopic} {selectedSubtopic ? `> ${selectedSubtopic}` : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden lg:block text-right">
              <p className="text-sm text-gray-500">Estimated Duration</p>
              <p className="text-base font-bold text-gray-900">25 Minutes</p>
            </div>
            <Link 
              to="/test-instructions" 
              className={`px-10 py-3 font-bold rounded-lg transition-all shadow-lg flex items-center gap-2 ${selectedSubtopic ? 'bg-nav text-white hover:brightness-110' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              onClick={(e) => !selectedSubtopic && e.preventDefault()}
            >
              Continue to Instructions <span>→</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TestSelection;
