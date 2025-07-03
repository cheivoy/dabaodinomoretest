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
