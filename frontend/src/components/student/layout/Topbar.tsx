function Topbar() {
  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-[72px] items-center justify-between border-b border-practice-line bg-white px-4 shadow-sm lg:left-[280px] lg:px-6">
      <div className="relative w-full max-w-[25rem]">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-practice-subdued">
          /
        </span>
        <input
          className="w-full rounded-full border border-practice-line bg-practice-muted py-2.5 pl-10 pr-4 text-sm text-practice-text outline-none transition placeholder:text-practice-subdued/70 focus:border-practice-ink focus:ring-2 focus:ring-practice-ink/10"
          placeholder="Search tests, topics, or companies..."
          type="search"
        />
      </div>

      <div className="ml-4 flex items-center gap-2 sm:gap-4">
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-practice-subdued transition hover:bg-practice-muted hover:text-practice-ink"
          aria-label="Notifications"
        >
          <span className="text-lg font-bold">!</span>
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-practice-error" />
        </button>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full text-practice-subdued transition hover:bg-practice-muted hover:text-practice-ink"
          aria-label="Settings"
        >
          <span className="text-lg font-bold">S</span>
        </button>
        <div className="mx-1 hidden h-8 w-px bg-practice-line sm:block" />
        <div className="hidden items-center gap-3 sm:flex">
          <div className="text-right">
            <p className="text-sm font-extrabold leading-tight text-practice-ink">
              Alex Carter
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-practice-subdued">
              Gold Member
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-practice-line bg-practice-muted text-sm font-extrabold text-practice-ink">
            AC
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
