const { useState, useEffect } = React;

const HomeMenu = ({ setActiveCalculator }) => {
  useEffect(() => {
    alert(
      '⚠️ 1 計算器非最終傷害，僅作面板屬性收益計算之用\n' +
      '⚠️ 2 僅 PVP 適用，PVE 請自己打木樁測試\n' +
      '⚠️ 3 圖片識別使用免費資源，準確度堪憂，建議手動輸入\n' +
      '⚠️ 4 有問題可聯絡 ID 櫻桃百蘭地，會擺爛式修正'
    );
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-3xl font-bold text-cherry-800 mb-8">屬性收益分析計算器</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl">
        <button
          onClick={() => setActiveCalculator('damage')}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition result-card"
        >
          防守計算器
        </button>
        <button
          onClick={() => setActiveCalculator('healing')}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition result-card"
        >
          治療強度計算
        </button>
        <button
          onClick={() => setActiveCalculator('damage_2')}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition result-card"
        >
          攻擊計算器
        </button>
        <button
          onClick={() => setActiveCalculator('inner_power')}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition result-card"
        >
          內功收益計算
        </button>
      </div>
    </div>
  );
};

const App = () => {
  const [activeCalculator, setActiveCalculator] = useState(null);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <Sidebar setActiveCalculator={setActiveCalculator} />
        <div className="flex-1 md:ml-64">
          {!activeCalculator ? (
            <HomeMenu setActiveCalculator={setActiveCalculator} />
          ) : activeCalculator === 'damage' ? (
            <DamageCalculator />
          ) : activeCalculator === 'healing' ? (
            <HealingCalculator />
          ) : activeCalculator === 'damage_2' ? (
            <DamageCalculator2 />
          ) : (
            <InnerPowerCalculator />
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);