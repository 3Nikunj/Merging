import { Link, Outlet, useLocation } from 'react-router-dom';

const Layout = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-nav text-white flex flex-col py-6 px-4 shrink-0">
        <div className="mb-8">
          <h2 className="text-accent text-2xl font-bold m-0">AiValytics</h2>
          <p className="text-gray-400 text-sm mt-1">AI Placement Prep</p>
        </div>
        <nav className="flex flex-col gap-2 flex-grow">
          <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPath === '/' ? 'bg-white/10 text-accent' : 'text-gray-300 hover:bg-white/5 hover:text-accent'}`}>
            <span>㗊</span> Dashboard
          </Link>
          <Link to="/practice-tests" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPath.includes('/practice-tests') ? 'bg-white/10 text-accent' : 'text-gray-300 hover:bg-white/5 hover:text-accent'}`}>
            <span>❓</span> Tests
          </Link>
          <Link to="/test-selection" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPath === '/test-selection' ? 'bg-white/10 text-accent' : 'text-gray-300 hover:bg-white/5 hover:text-accent'}`}>
            <span>📝</span> Selection
          </Link>
          <Link to="/test-instructions" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPath === '/test-instructions' ? 'bg-white/10 text-accent' : 'text-gray-300 hover:bg-white/5 hover:text-accent'}`}>
            <span>ℹ️</span> Instructions
          </Link>
          <Link to="/active-test" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPath === '/active-test' ? 'bg-white/10 text-accent' : 'text-gray-300 hover:bg-white/5 hover:text-accent'}`}>
            <span>⏱️</span> Active Test
          </Link>
          <Link to="/test-results" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPath === '/test-results' ? 'bg-white/10 text-accent' : 'text-gray-300 hover:bg-white/5 hover:text-accent'}`}>
            <span>📊</span> Results
          </Link>
        </nav>
        <button className="mt-auto bg-accent text-black py-3 rounded-lg font-semibold flex justify-center items-center gap-2">
          ⚡ Upgrade to Pro
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col overflow-y-auto">
        {/* Topbar */}
        <header className="flex justify-between items-center px-8 py-4 bg-background border-b border-gray-200 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-6">
            <div className="text-2xl font-bold text-gray-900">
              {currentPath === '/' ? 'Dashboard' : 
               currentPath === '/practice-tests' ? 'Practice Tests' :
               currentPath === '/test-selection' ? 'Test Selection' :
               currentPath === '/test-instructions' ? 'Test Instructions' :
               currentPath === '/active-test' ? 'Active Test' :
               currentPath === '/test-results' ? 'Test Results' : 'Dashboard'}
            </div>
            <div className="w-px h-6 bg-gray-300"></div>
            <div className="flex items-center bg-white px-4 py-2 rounded-full w-96 shadow-sm border border-gray-100">
              <span className="text-gray-400 text-sm">🔍</span>
              <input type="text" placeholder="Search assessments..." className="ml-2 w-full outline-none text-sm text-gray-700 bg-transparent" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-gray-500 hover:text-gray-800 text-lg">🔔</button>
            <button className="text-gray-500 hover:text-gray-800 text-lg">⚙️</button>
            <div className="flex items-center gap-3 border-l border-gray-300 pl-6">
              <div className="flex flex-col text-right">
                <span className="text-sm font-semibold text-gray-900">Alex Johnson</span>
                <span className="text-xs text-gray-500">Standard Plan</span>
              </div>
              <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Profile" className="w-10 h-10 rounded-full object-cover" />
            </div>
          </div>
        </header>

        {/* Dashboard Content - Rendered via Outlet */}
        <div className="flex-grow flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
