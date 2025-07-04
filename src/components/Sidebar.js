const { useState } = React;

const Sidebar = ({ setActiveCalculator }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 text-cherry-800 p-2 rounded-full bg-cherry-100 hover:bg-cherry-200"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="展開側邊欄"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </button>
      <div
        className={`fixed top-0 left-0 h-full bg-cherry-50 w-64 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-40 shadow-lg`}
      >
        <div className="p-4">
          <h2 className="text-lg font-bold text-cherry-800">計算器</h2>
          <nav className="mt-4 space-y-2">
            <button
              onClick={() => { setActiveCalculator('damage'); setIsOpen(false); }}
              className="block w-full text-left py-2 px-4 text-cherry-700 hover:bg-cherry-100 rounded-lg transition-colors"
            >
              防守計算器
            </button>
            <button
              onClick={() => { setActiveCalculator('healing'); setIsOpen(false); }}
              className="block w-full text-left py-2 px-4 text-cherry-700 hover:bg-cherry-100 rounded-lg transition-colors"
            >
              治療強度計算
            </button>
            <button
              onClick={() => { setActiveCalculator('damage_2'); setIsOpen(false); }}
              className="block w-full text-left py-2 px-4 text-cherry-700 hover:bg-cherry-100 rounded-lg transition-colors"
            >
              攻擊計算器
            </button>
            <button
              onClick={() => { setActiveCalculator('inner_power'); setIsOpen(false); }}
              className="block w-full text-left py-2 px-4 text-cherry-700 hover:bg-cherry-100 rounded-lg transition-colors"
            >
              內功收益計算
            </button>
          </nav>
        </div>
      </div>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};
