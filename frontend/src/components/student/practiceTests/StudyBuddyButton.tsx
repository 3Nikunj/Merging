function StudyBuddyButton() {
  return (
    <button
      className="group fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-practice-amberDark text-white shadow-buddy transition hover:scale-105 active:scale-95"
      aria-label="Open AI Study Buddy"
    >
      <span className="text-xl font-black">AI</span>
      <span className="pointer-events-none absolute right-16 rounded bg-practice-ink px-3 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
        AI Study Buddy
      </span>
    </button>
  );
}

export default StudyBuddyButton;
