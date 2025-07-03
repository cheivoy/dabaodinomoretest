const { useState } = React;
const HealingCalculator = () => {
    const [inputs, setInputs] = useState({
        armor_break: "0",
        hit: "0",
        elemental_attack: "0",
        boss_restraint: "0",
        faction_restraint: "0",
        resistance_ignore: "0",
        healing_power_equip: "0"
    });
    const [inputErrors, setInputErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (value < 0) {
            setInputErrors((prev) => ({ ...prev, [name]: '輸入值不能為負數' }));
            return;
        }
        if (value > 1000000) {
            setInputErrors((prev) => ({ ...prev, [name]: '輸入值過大，最大為100000' }));
            return;
        }
        setInputs((prev) => ({ ...prev, [name]: value }));
        setInputErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const calculateHealing = () => {
        const {
            armor_break, hit, elemental_attack, boss_restraint, faction_restraint, resistance_ignore, healing_power_equip
        } = inputs;

        const toNum = (val) => parseFloat(val) || 0;

        const attributeConversion = (
            (toNum(armor_break) * 3 / 1000) +
            (toNum(hit) * 9 / 1000) +
            (toNum(elemental_attack) * 7 / 1000) +
            (toNum(boss_restraint) * 3 / 1000) +
            (toNum(faction_restraint) * 3 / 1000) +
            (toNum(resistance_ignore) * 9 / 1000)
        );

        const healingPower = Math.floor(attributeConversion) * 100 + toNum(healing_power_equip) + 503;

        return {
            attributeConversion: attributeConversion.toFixed(2),
            healingPower: healingPower.toFixed(0)
        };
    };

    const result = calculateHealing();

    return (
        <div className="p-4 container mx-auto min-h-screen">
            <div className="cherry-gradient rounded-xl p-6 mb-6 shadow-lg">
                <h1 className="text-xl md:text-2xl font-bold text-center text-white">治療強度計算器</h1>
                <p className="text-center text-white text-opacity-90 text-sm mt-1">如有問題請聯繫櫻桃白蘭地@緣定今生</p>
            </div>

            <ImageUploader setInputs={setInputs} type="healing" />

            <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100 mb-6">
                <div className="flex items-center mb-4">
                    <div className="w-1.5 h-5 rounded-full bg-cherry-500 mr-2"></div>
                    <h2 className="font-bold text-base md:text-lg text-gray-800">治療參數</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                        { key: "armor_break", label: "破防", icon: "🛡️" },
                        { key: "hit", label: "命中", icon: "🎯" },
                        { key: "elemental_attack", label: "元素攻擊", icon: "✨" },
                        { key: "boss_restraint", label: "首領克制", icon: "👑" },
                        { key: "faction_restraint", label: "流派克制", icon: "🔄" },
                        { key: "resistance_ignore", label: "抗性忽視", icon: "🌀" },
                        { key: "healing_power_equip", label: "治療強度（裝備）", icon: "💉" }
                    ].map(({ key, label, icon }) => (
                        <div key={key} className="flex flex-col">
                            <label className="text-xs md:text-sm text-gray-600 mb-1 flex items-center">
                                <span className="mr-1 md:mr-2">{icon}</span>{label}
                            </label>
                            <input
                                type="number"
                                name={key}
                                value={inputs[key]}
                                onChange={handleChange}
                                min="0"
                                max="1000000"
                                className={`input-focus border ${inputErrors[key] ? 'border-red-500' : 'border-gray-200'} rounded-lg p-2 text-sm w-full`}
                                aria-label={label}
                            />
                            {inputErrors[key] && (
                                <p className="text-xs text-red-600 mt-1">{inputErrors[key]}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="result-card bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100">
                <div className="flex items-center mb-4">
                    <div className="w-1.5 h-5 rounded-full bg-cherry-500 mr-2"></div>
                    <h2 className="font-bold text-base md:text-lg text-gray-800">計算結果</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-cherry-50 p-3 rounded-lg">
                        <p className="text-xs text-cherry-700">屬性轉換值</p>
                        <p className="text-lg md:text-xl font-bold text-cherry-800">{result.attributeConversion}</p>
                    </div>
                    <div className="bg-cherry-500 p-3 rounded-lg">
                        <p className="text-xs text-white">總治療強度</p>
                        <p className="text-lg md:text-xl font-bold text-white">{result.healingPower}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};