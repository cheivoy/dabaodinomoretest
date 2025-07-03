const { useState } = React;
const DamageCalculator = () => {
    const [inputs, setInputs] = useState({
        skill_multiplier: "1518",
        D: "5000",
        E: "800",
        b_c: "900",
        d_c: "1.8",
        R: "500",
        h: "700",
        b_d: "2000",
        b_s: "700",
        b_e: "0",
        flow_percent: "0",
        damage_increase: "0",
        skill_damage_increase: "0",
        d_s: "2000",
        d_f: "2000",
        d_d: "5000",
        d_e: "0",
        b_b: "600",
        hp: "80000",
        b_c_defense: "550",
        d_c_defense: "0",
        flow_resist_percent: "0",
        damage_reduction: "0",
        skill_damage_reduction: "0",
        lambda_1: "358",
        lambda_2: "0.359",
        lambda_3: "2860",
        lambda_4: "531",
        W: "1",
        gold_i: "0"
    });

    const [inputErrors, setInputErrors] = useState({});
    const [previousResult, setPreviousResult] = useState(null);
    const [previousInputs, setPreviousInputs] = useState(null);

    // 新增可見性狀態，控制曲線顯示
    const [visibility, setVisibility] = useState({
        ds: true, // 氣盾
        dd: true, // 防禦
        df: true, // 流派抵禦
        de: true, // 元素抗性
        bb: true  // 格擋
    });

    const [showAttacker, setShowAttacker] = useState(true);
    const [showDefender, setShowDefender] = useState(true);
    const [showOriginal, setShowOriginal] = useState(true);
    const [showReduced, setShowReduced] = useState(true);
    const [isTableExpanded, setIsTableExpanded] = React.useState(true);

    const goldOptions = [
        { value: "0", label: "無金周天" },
        { value: "0.03", label: "金周天1級" },
        { value: "0.04", label: "金周天2級" },
        { value: "0.05", label: "金周天3級" }
    ];

    const elementWeaknessOptions = [
        { value: "1", label: "無元素弱點" },
        { value: "1.1", label: "碎夢大特" }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'gold_i' || name === 'W') {
            setInputs((prev) => ({ ...prev, [name]: value }));
            setInputErrors((prev) => ({ ...prev, [name]: '' }));
        } else {
            if (value < 0) {
                setInputErrors((prev) => ({ ...prev, [name]: '輸入值不能為負數' }));
                return;
            }
            if (value > 1000000) {
                setInputErrors((prev) => ({ ...prev, [name]: '輸入值過大，最大為1000000' }));
                return;
            }
            setInputs((prev) => ({ ...prev, [name]: value }));
            setInputErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    // 切換曲線可見性
    const toggleVisibility = (key) => {
        setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const toNum = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
    };

    const calculate = (inputs) => {
        const {
            skill_multiplier, D, E, b_c, d_c, R, h, b_d, b_s, b_e, flow_percent, damage_increase,
            skill_damage_increase, d_s, d_f, d_d, d_e, b_b, hp, b_c_defense, d_c_defense,
            flow_resist_percent, damage_reduction, skill_damage_reduction, lambda_1, lambda_2,
            lambda_3, lambda_4, W, gold_i
        } = inputs;

        const c = toNum(b_c) - toNum(b_c_defense);
        const p_c = (115 * c + 90) / (c + 940) / 100 + toNum(gold_i);
        const r_h = 143 * toNum(h) / (toNum(h) + 3678) / 100;
        const r_b = 143 * toNum(b_b) / (toNum(b_b) + 3678) / 100;
        const p_h = Math.min(1, 0.95 + r_h - r_b);
        const p_h_1 = 1 - p_h;
        const m_c = 1 + p_c * (toNum(d_c) - 1 - toNum(d_c_defense));
        const d_mul = m_c * p_h + 0.5 * (1 - p_h);
        const G = toNum(b_s) >= toNum(d_s)
            ? 0
            : toNum(d_s) / 3 <= toNum(b_s)
                ? 0.5 * (toNum(d_s) - toNum(b_s))
                : toNum(d_s) - 2 * toNum(b_s);
        const A = toNum(D) + (toNum(R) - toNum(d_f)) - G;
        const gamma = toNum(d_d) - toNum(b_d) > 0
            ? (toNum(d_d) - toNum(b_d)) / (toNum(d_d) - toNum(b_d) + toNum(lambda_3))
            : 0;
        const e = toNum(d_e) - toNum(b_e);
        const beta = e > 0 ? e / (e + toNum(lambda_4)) : 0;
        const c_original = toNum(b_c);
        const p_c_original = (115 * c_original + 90) / (c_original + 940) / 100 + toNum(gold_i);
        const r_h_original = r_h;
        const r_b_original = 0;
        const p_h_original = Math.min(1, 0.95 + r_h_original - r_b_original);
        const m_c_original = 1 + p_c_original * (toNum(d_c) - 1);
        const d_mul_original = m_c_original * p_h_original + 0.5 * (1 - p_h_original);
        const G_original = toNum(b_s);
        const gamma_original = 0;
        const A_original = toNum(D) + toNum(R) + G_original;
        const beta_original = 0;

        const baseDamage = (
            (toNum(skill_multiplier) / 100) * (((toNum(lambda_1) + toNum(lambda_2) * A_original) * (1 - gamma_original)) +
                toNum(W) * toNum(lambda_2) * toNum(E) * (1 - beta_original))
        ) * d_mul_original * (1 + toNum(flow_percent)) * (1 + toNum(damage_increase)) * (1 + toNum(skill_damage_increase));

        const finalDamage = (
            (toNum(skill_multiplier) / 100) * (((toNum(lambda_1) + toNum(lambda_2) * A) * (1 - gamma)) +
                toNum(W) * toNum(lambda_2) * toNum(E) * (1 - beta))
        ) * d_mul * (1 + toNum(flow_percent) - toNum(flow_resist_percent)) * (1 + toNum(damage_increase) - toNum(damage_reduction)) * (1 + toNum(skill_damage_increase) / 100 - toNum(skill_damage_reduction) / 100);

        const totalReduction = (baseDamage - finalDamage) / baseDamage || 0;
        const ehp = toNum(hp) / (1 - totalReduction) || toNum(hp);

        return {
            c: c.toFixed(2),
            p_c: (p_c * 100).toFixed(2) + "%",
            r_h: (r_h * 100).toFixed(2) + "%",
            r_b: (r_b * 100).toFixed(2) + "%",
            p_h: p_h.toFixed(4),
            m_c: m_c.toFixed(4),
            d_mul: d_mul.toFixed(4),
            G: G.toFixed(2),
            A: A.toFixed(2),
            gamma: (gamma * 100).toFixed(2) + "%",
            beta: (beta * 100).toFixed(2) + "%",
            c_original: c_original.toFixed(2),
            p_c_original: (p_c_original * 100).toFixed(2) + "%",
            r_h_original: (r_h_original * 100).toFixed(2) + "%",
            r_b_original: (r_b_original * 100).toFixed(2) + "%",
            p_h_original: p_h_original.toFixed(4),
            m_c_original: m_c_original.toFixed(4),
            d_mul_original: d_mul_original.toFixed(4),
            G_original: G_original.toFixed(2),
            A_original: A_original.toFixed(2),
            gamma_original: (gamma_original * 100).toFixed(2) + "%",
            beta_original: (beta_original * 100).toFixed(2) + "%",
            baseDamage: baseDamage.toFixed(2),
            finalDamage: finalDamage.toFixed(2),
            totalReduction: (totalReduction * 100).toFixed(2) + "%",
            ehp: ehp.toFixed(2),
            p_h_1: (p_h_1 * 100).toFixed(2) + "%"
        };
    };

    const generateChartData = (inputs) => {
        const attribute_points = Array.from({ length: 51 }, (_, i) => i * 200);
        const reductions = { ds: [], dd: [], df: [], de: [], bb: [] };
        const delta_reductions = { ds: [], dd: [], df: [], de: [], bb: [] };

        const calculateDamage = (D, R, b_s, d_s, d_f, b_d, d_d, E, b_e, d_e, b_c, d_c, h, b_b, b_c_defense, d_c_defense, flow_percent, damage_increase, flow_resist_percent, damage_reduction, lambda_1, lambda_2, lambda_3, lambda_4, W, gold_i) => {
            const c = toNum(b_c) - toNum(b_c_defense);
            const p_c = (115 * c + 90) / (c + 940) / 100 + toNum(gold_i);
            const r_h = 143 * toNum(h) / (toNum(h) + 3678) / 100;
            const r_b = 143 * toNum(b_b) / (toNum(b_b) + 3678) / 100;
            const p_h = Math.min(1, 0.95 + r_h - r_b);
            const m_c = 1 + p_c * (toNum(d_c) - 1 - toNum(d_c_defense));
            const d_mul = m_c * p_h + 0.5 * (1 - p_h);
            const G = toNum(b_s) >= toNum(d_s)
                ? 0
                : toNum(d_s) / 3 <= toNum(b_s)
                    ? 0.5 * (toNum(d_s) - toNum(b_s))
                    : toNum(d_s) - 2 * toNum(b_s);
            const A = toNum(D) + (toNum(R) - toNum(d_f)) - G;
            const gamma = toNum(d_d) - toNum(b_d) > 0
                ? (toNum(d_d) - toNum(b_d)) / (toNum(d_d) - toNum(b_d) + toNum(lambda_3))
                : 0;
            const e = toNum(d_e) - toNum(b_e);
            const beta = e > 0 ? e / (e + toNum(lambda_4)) : 0;
            return (
                (toNum(inputs.skill_multiplier) / 100) * (((toNum(lambda_1) + toNum(lambda_2) * A) * (1 - gamma)) +
                    toNum(W) * toNum(lambda_2) * toNum(E) * (1 - beta))
            ) * d_mul * (1 + toNum(flow_percent) - toNum(flow_resist_percent)) * (1 + toNum(damage_increase) - toNum(damage_reduction));
        };

        const d_original = calculateDamage(
            toNum(inputs.D), toNum(inputs.R), toNum(inputs.b_s), 0, 0, toNum(inputs.b_d), 0,
            toNum(inputs.E), toNum(inputs.b_e), 0, toNum(inputs.b_c), toNum(inputs.d_c),
            toNum(inputs.h), 0, 0, 0, toNum(inputs.flow_percent), toNum(inputs.damage_increase), 0, 0,
            toNum(inputs.lambda_1), toNum(inputs.lambda_2), toNum(inputs.lambda_3), toNum(inputs.lambda_4), toNum(inputs.W), toNum(inputs.gold_i)
        );

        const calculateReduction = (attr, value) => {
            const params = { d_s: 0, d_d: 0, d_f: 0, d_e: 0, b_b: 0 };
            params[attr] = value;
            const d_reduced = calculateDamage(
                toNum(inputs.D), toNum(inputs.R), toNum(inputs.b_s), params.d_s, params.d_f,
                toNum(inputs.b_d), params.d_d, toNum(inputs.E), toNum(inputs.b_e), params.d_e,
                toNum(inputs.b_c), toNum(inputs.d_c), toNum(inputs.h), params.b_b,
                toNum(inputs.b_c_defense), toNum(inputs.d_c_defense),
                toNum(inputs.flow_percent), toNum(inputs.damage_increase),
                toNum(inputs.flow_resist_percent), toNum(inputs.damage_reduction),
                toNum(inputs.lambda_1), toNum(inputs.lambda_2), toNum(inputs.lambda_3), toNum(inputs.lambda_4), toNum(inputs.W), toNum(inputs.gold_i)
            );
            return d_original ? 1 - d_reduced / d_original : 0;
        };

        attribute_points.forEach((point) => {
            reductions.ds.push(calculateReduction('d_s', point));
            reductions.dd.push(calculateReduction('d_d', point));
            reductions.df.push(calculateReduction('d_f', point));
            reductions.de.push(calculateReduction('d_e', point));
            reductions.bb.push(calculateReduction('b_b', point));
        });

        for (let i = 1; i < reductions.ds.length; i++) {
            delta_reductions.ds.push(reductions.ds[i] - reductions.ds[i - 1]);
            delta_reductions.dd.push(reductions.dd[i] - reductions.dd[i - 1]);
            delta_reductions.df.push(reductions.df[i] - reductions.df[i - 1]);
            delta_reductions.de.push(reductions.de[i] - reductions.de[i - 1]);
            delta_reductions.bb.push(reductions.bb[i] - reductions.bb[i - 1]);
        }

        const deltaData = attribute_points.slice(1).map((point, i) => ({
            point,
            ds: delta_reductions.ds[i],
            dd: delta_reductions.dd[i],
            df: delta_reductions.df[i],
            de: delta_reductions.de[i],
            bb: delta_reductions.bb[i]
        }));

        const reductionData = attribute_points.map((point, i) => ({
            point,
            ds: reductions.ds[i],
            dd: reductions.dd[i],
            df: reductions.df[i],
            de: reductions.de[i],
            bb: reductions.bb[i]
        }));

        return { deltaData, reductionData };
    };

    const CustomTooltip = ({ active, payload, label, isDelta }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-700 font-medium">屬性點: {label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm text-gray-600">
                            <span style={{ color: entry.stroke }}>{entry.name}</span>: {(entry.value * 100).toFixed(isDelta ? 4 : 2)}%
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const result = calculate(inputs);
    const { deltaData, reductionData } = generateChartData(inputs);

    const STORAGE_KEY = "damagePresets_defense";// 保存的方案

    const [presets, setPresets] = useState(() => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));  //對比用索引

    const [compareIndexes, setCompareIndexes] = useState({ a: null, b: null });// 對比結果

    const [compareResult, setCompareResult] = useState(null);

    // 儲存目前輸入成為新方案
    const saveCurrentPreset = () => {
        if (presets.length >= 4) return alert("最多只能保存 4 組方案！");
        const name = prompt("請輸入方案名稱：");
        if (!name) return;
        const newPresets = [...presets, { name, data: inputs }];
        setPresets(newPresets);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newPresets));
    };

    // 載入指定方案
    const loadPreset = (i) => setInputs(presets[i].data);

    // 刪除指定方案
    const deletePreset = (i) => {
        const updated = presets.filter((_, idx) => idx !== i);
        setPresets(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    // 執行兩組方案對比
    const comparePresets = () => {
        const a = presets[compareIndexes.a]?.data;
        const b = presets[compareIndexes.b]?.data;
        if (!a || !b) return;

        // 欄位差值
        const diff = {};
        Object.keys(a).forEach(key => {
            diff[key] = toNum(b[key]) - toNum(a[key]);
        });

        const resultA = calculate(a);
        const resultB = calculate(b);

        setCompareResult({
            diff,
            resultDiff: {
                baseDamage: toNum(resultB.baseDamage) - toNum(resultA.baseDamage),
                finalDamage: toNum(resultB.finalDamage) - toNum(resultA.finalDamage),
                totalReduction: toNum(resultB.totalReduction) - toNum(resultA.totalReduction)
            }
        });
    };

    return (
        <div className="p-4 container mx-auto min-h-screen">
            <div className="cherry-gradient rounded-xl p-6 mb-6 shadow-lg">
                <h1 className="text-xl md:text-2xl font-bold text-center text-white">防守屬性收益計算器</h1>
                <p className="text-center text-white text-opacity-90 text-sm mt-1">如有問題請聯繫櫻桃白蘭地@緣定今生</p>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100 mb-4">
                <div
                    className="flex justify-between items-center cursor-pointer mb-2"
                    onClick={() => setShowAttacker(!showAttacker)}
                >
                    <div className="flex items-center">
                        <div className="w-1.5 h-5 rounded-full bg-cherry-500 mr-2"></div>
                        <h2 className="font-bold text-base md:text-lg text-gray-800">攻擊方參數</h2>
                    </div>
                    <span className="text-cherry-700 text-lg">{showAttacker ? '收起' : '展開'}</span>
                </div>
                <div
                    className={`transition-all duration-500 overflow-hidden ${showAttacker ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}
                >
                    <ImageUploader setInputs={setInputs} type="attacker" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { key: "skill_multiplier", label: "技能倍率", icon: "🔥", tooltip: "如技能倍率為300%，輸入300" },
                            { key: "D", label: "攻擊", icon: "⚔️" },
                            { key: "E", label: "元素攻擊（平均）", icon: "✨" },
                            { key: "b_c", label: "會心數值", icon: "🎯" },
                            { key: "d_c", label: "會心傷害", icon: "💥", tooltip: "除以100，例如180%，輸入1.8" },
                            { key: "R", label: "流派克制", icon: "🔄" },
                            { key: "h", label: "命中", icon: "🎯" },
                            { key: "b_d", label: "破防", icon: "🛡️" },
                            { key: "b_s", label: "破盾", icon: "🔨" },
                            { key: "b_e", label: "忽視元素抗性", icon: "🌀" },
                            { key: "flow_percent", label: "流派克制%", icon: "📊", tooltip: "例如9.5%，輸入0.095。所有%皆為相加，例如10%+5%=15%=輸入0.15" },
                            { key: "damage_increase", label: "增傷%", icon: "📈", tooltip: "除以100，例如5%，輸入0.05。所有%皆為相加，例如10%+5%=15%=輸入0.15" },
                            { key: "skill_damage_increase", label: "技能增傷%", icon: "📈", tooltip: "除以100，例如5%，輸入0.05。所有%皆為相加，例如10%+5%=15%=輸入0.15" },
                            { key: "gold_i", label: "金周天", icon: "🌟", type: "select", options: goldOptions },
                            { key: "W", label: "元素弱點", icon: "🖕🏻", type: "select", options: elementWeaknessOptions }
                        ].map(({ key, label, icon, type, options, tooltip }) => (
                            <div key={key} className="flex flex-col group relative">
                                <label className="text-xs md:text-sm text-gray-600 mb-1 flex items-center">
                                    <span className="mr-1 md:mr-2">{icon}</span>{label}{tooltip && <span> </span>}
                                    {tooltip && (
                                        <>
                                            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-500 text-white text-xs cursor-pointer">?</span>
                                            <div className="tooltip-hidden absolute left-0 top-8 bg-cherry-50 text-cherry-700 text-xs p-2 rounded-lg shadow-md z-10 max-w-xs">
                                                {tooltip}
                                            </div>
                                        </>
                                    )}
                                </label>
                                {type === "select" ? (
                                    <select
                                        name={key}
                                        value={inputs[key]}
                                        onChange={handleChange}
                                        className="input-focus border border-gray-200 rounded-lg p-2 text-sm w-full"
                                        aria-label={label}
                                    >
                                        {options.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                ) : (
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
                                )}
                                {inputErrors[key] && (
                                    <p className="text-xs text-red-600 mt-1">{inputErrors[key]}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100 mb-4">
                <div
                    className="flex justify-between items-center cursor-pointer mb-2"
                    onClick={() => setShowDefender(!showDefender)}
                >
                    <div className="flex items-center">
                        <div className="w-1.5 h-5 rounded-full bg-cherry-500 mr-2"></div>
                        <h2 className="font-bold text-base md:text-lg text-gray-800">防守方參數</h2>
                    </div>
                    <span className="text-cherry-700 text-lg">{showDefender ? '收起' : '展開'}</span>
                </div>
                <div
                    className={`transition-all duration-500 overflow-hidden ${showDefender ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}
                >
                    <ImageUploader setInputs={setInputs} type="defender" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { key: "d_s", label: "氣盾", icon: "🛡️" },
                            { key: "d_f", label: "流派抵禦", icon: "🔄" },
                            { key: "d_d", label: "防禦", icon: "🏰" },
                            { key: "d_e", label: "元素抗性", icon: "🌀" },
                            { key: "b_b", label: "格擋", icon: "✋" },
                            { key: "hp", label: "氣血", icon: "❤️" },
                            { key: "b_c_defense", label: "抗會心數值", icon: "🎯" },
                            { key: "d_c_defense", label: "會心防禦%", icon: "📊", tooltip: "除以100，例如25%，輸入0.25。所有%皆為相加，例如10%+5%=15%=輸入0.15" },
                            { key: "flow_resist_percent", label: "流派抵禦%", icon: "📊", tooltip: "除以100，例如5%，輸入0.05。所有%皆為相加，例如10%+5%=15%=輸入0.15" },
                            { key: "damage_reduction", label: "傷害減免%", icon: "📉", tooltip: "除以100，例如15%，輸入0.15。所有%皆為相加，例如10%+5%=15%=輸入0.15" },
                            { key: "skill_damage_reduction", label: "技能減免%", icon: "📉", tooltip: "除以100，例如5%，輸入0.05。所有%皆為相加，例如10%+5%=15%=輸入0.15" }
                        ].map(({ key, label, icon, tooltip }) => (
                            <div key={key} className="flex flex-col group relative">
                                <label className="text-xs md:text-sm text-gray-600 mb-1 flex items-center">
                                    <span className="mr-1 md:mr-2">{icon}</span>{label}{tooltip && <span> </span>}
                                    {tooltip && (
                                        <>
                                            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-500 text-white text-xs cursor-pointer">?</span>
                                            <div className="tooltip-hidden absolute left-0 top-8 bg-cherry-50 text-cherry-700 text-xs p-2 rounded-lg shadow-md z-10 max-w-xs">
                                                {tooltip}
                                            </div>
                                        </>
                                    )}
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
            </div>

            <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100 mb-6">
                {/* 原數值屬性區塊 */}
                <div
                    className="flex justify-between items-center cursor-pointer mb-2"
                    onClick={() => setShowOriginal(!showOriginal)}
                >
                    <div className="flex items-center">
                        <div className="w-1.5 h-5 rounded-full bg-cherry-500 mr-2"></div>
                        <h2 className="font-bold text-base md:text-lg text-gray-800">原數值屬性</h2>
                    </div>
                    <span className="text-cherry-700 text-lg">{showOriginal ? '收起' : '展開'}</span>
                </div>
                <div className={`transition-all duration-500 overflow-hidden ${showOriginal ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {[
                            { label: "真實會心", value: result.c_original },
                            { label: "會心率", value: result.p_c_original },
                            { label: "命中修正", value: result.r_h_original },
                            { label: "格擋率", value: result.r_b_original },
                            { label: "命中增幅倍率", value: result.p_h_original },
                            { label: "會心傷害倍率", value: result.m_c_original },
                            { label: "傷害倍率", value: result.d_mul_original },
                            { label: "剩餘氣盾", value: result.G_original },
                            { label: "防禦傷害減免", value: result.gamma_original },
                            { label: "元素傷害減免", value: result.beta_original }
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-gray-50 p-2 md:p-3 rounded-lg">
                                <p className="text-xs text-gray-600">{label}</p>
                                <p className="text-sm font-bold text-gray-800">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 減傷後屬性區塊 */}
                <div
                    className="flex justify-between items-center cursor-pointer mb-2"
                    onClick={() => setShowReduced(!showReduced)}
                >
                    <div className="flex items-center">
                        <div className="w-1.5 h-5 rounded-full bg-cherry-500 mr-2"></div>
                        <h2 className="font-bold text-base md:text-lg text-gray-800">減傷後屬性</h2>
                    </div>
                    <span className="text-cherry-700 text-lg">{showReduced ? '收起' : '展開'}</span>
                </div>
                <div className={`transition-all duration-500 overflow-hidden ${showReduced ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: "修正會心", value: result.c },
                            { label: "會心率", value: result.p_c },
                            { label: "命中修正", value: result.r_h },
                            { label: "格擋率", value: result.p_h_1 },
                            { label: "命中增幅倍率", value: result.p_h },
                            { label: "會心傷害倍率", value: result.m_c },
                            { label: "傷害倍率", value: result.d_mul },
                            { label: "剩餘氣盾", value: result.G },
                            { label: "防禦傷害減免", value: result.gamma },
                            { label: "元素傷害減免", value: result.beta }
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-cherry-50 p-2 md:p-3 rounded-lg">
                                <p className="text-xs text-cherry-600">{label}</p>
                                <p className="text-sm font-bold text-cherry-800">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="result-card bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                        <div className="w-1.5 h-5 rounded-full bg-cherry-500 mr-2"></div>
                        <h2 className="font-bold text-base md:text-lg text-gray-800">傷害計算結果</h2>
                    </div>
                    <button
                        className="bg-cherry-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cherry-700 transition-colors"
                        onClick={saveCurrentPreset}
                    >
                        保存當前方案
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                    {[
                        { label: "原傷害", value: result.baseDamage, color: "cherry-100" },
                        { label: "減傷後傷害", value: result.finalDamage, color: "cherry-100" },
                        { label: "有效氣血 (EHP)", value: result.ehp, color: "cherry-100" },
                        { label: "總減傷率", value: result.totalReduction, color: "cherry-500", text: "white" }
                    ].map(({ label, value, color, text }) => (
                        <div key={label} className={`bg-${color} p-3 rounded-lg`}>
                            <p className={`text-xs ${text ? `text-${text}` : 'text-cherry-700'}`}>{label}</p>
                            <p className={`text-lg font-bold ${text ? `text-${text}` : 'text-cherry-800'}`}>{value}</p>
                        </div>
                    ))}
                </div>


                {/* 方案列表 */}
                <div className="mb-6">
                    <h4 className="font-semibold text-base text-gray-800 mb-3 flex items-center">
                        <span className="w-1.5 h-5 rounded-full bg-cherry-500 mr-2"></span>
                        保存的方案
                    </h4>
                    {presets.length === 0 ? (
                        <p className="text-sm text-gray-500">尚未保存任何方案</p>
                    ) : (
                        <div className="grid gap-2">
                            {presets.map((preset, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-cherry-50 rounded-lg hover:bg-cherry-100 transition-colors duration-200"
                                >
                                    <span className="font-medium text-gray-700">{preset.name}</span>
                                    <div className="flex gap-2">
                                        <button
                                            className="text-sm text-green-600 hover:text-green-800 font-medium transition-colors duration-200 flex items-center gap-1"
                                            onClick={() => loadPreset(index)}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                            載入
                                        </button>
                                        <button
                                            className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors duration-200 flex items-center gap-1"
                                            onClick={() => deletePreset(index)}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            刪除
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 方案對比 */}
                {presets.length >= 2 && (
                    <div className="mb-6">
                        <h4 className="font-semibold text-base text-gray-800 mb-3 flex items-center">
                            <span className="w-1.5 h-5 rounded-full bg-cherry-500 mr-2"></span>
                            對比兩個方案
                        </h4>
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                            <select
                                className="w-full sm:w-40 border border-gray-300 rounded-lg p-2 text-sm text-gray-700 focus:ring-2 focus:ring-cherry-500 focus:border-cherry-500 transition-colors duration-200"
                                onChange={(e) => setCompareIndexes((prev) => ({ ...prev, a: e.target.value }))}
                            >
                                <option value="">選擇方案</option>
                                {presets.map((p, i) => (
                                    <option value={i} key={"a" + i}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                className="w-full sm:w-40 border border-gray-300 rounded-lg p-2 text-sm text-gray-700 focus:ring-2 focus:ring-cherry-500 focus:border-cherry-500 transition-colors duration-200"
                                onChange={(e) => setCompareIndexes((prev) => ({ ...prev, b: e.target.value }))}
                            >
                                <option value="">選擇方案</option>
                                {presets.map((p, i) => (
                                    <option value={i} key={"b" + i}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                className="w-full sm:w-auto bg-cherry-500 hover:bg-cherry-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={comparePresets}
                                disabled={compareIndexes.a === null || compareIndexes.b === null}
                            >
                                開始對比
                            </button>
                        </div>

                        {/* 可展開/收起的對比結果表格 */}
                        {compareResult && (
                            <div className="mt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold text-base text-gray-800">方案對比（B - A）</h4>
                                    <button
                                        className="text-sm text-cherry-600 hover:text-cherry-800 font-medium flex items-center gap-1"
                                        onClick={() => setIsTableExpanded(!isTableExpanded)}
                                    >
                                        {isTableExpanded ? (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                </svg>
                                                收起
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                                展開
                                            </>
                                        )}
                                    </button>
                                </div>
                                {isTableExpanded && (
                                    <div className="overflow-x-auto scrollbar-cherry transition-all duration-300">
                                        <table className="w-full text-sm border-collapse">
                                            <thead>
                                                <tr className="bg-cherry-50">
                                                    <th className="border p-2 text-left text-cherry-700">項目</th>
                                                    <th className="border p-2 text-left text-cherry-700">
                                                        {presets[compareIndexes.a]?.name || "方案 A"}
                                                    </th>
                                                    <th className="border p-2 text-left text-cherry-700">
                                                        {presets[compareIndexes.b]?.name || "方案 B"}
                                                    </th>
                                                    <th className="border p-2 text-left text-cherry-700">差異</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[
                                                    { key: 'hp', label: '氣血 (hp)' },
                                                    { key: 'd_s', label: '氣盾 (d_s)' },
                                                    { key: 'd_d', label: '防禦 (d_d)' },
                                                    { key: 'd_f', label: '流派抵禦 (d_f)' },
                                                    { key: 'd_e', label: '元素抗性 (d_e)' },
                                                    { key: 'b_b', label: '格擋 (b_b)' },
                                                    { key: 'baseDamage', label: '原傷害' },
                                                    { key: 'finalDamage', label: '減傷後傷害' },
                                                    { key: 'ehp', label: '有效氣血 (EHP)' },
                                                    { key: 'totalReduction', label: '總減傷率' }
                                                ].map(({ key, label }) => {
                                                    const aValue = key in presets[compareIndexes.a].data ? presets[compareIndexes.a].data[key] : calculate(presets[compareIndexes.a].data)[key];
                                                    const bValue = key in presets[compareIndexes.b].data ? presets[compareIndexes.b].data[key] : calculate(presets[compareIndexes.b].data)[key];
                                                    const aNum = parseFloat(aValue.replace('%', '')) || 0;
                                                    const bNum = parseFloat(bValue.replace('%', '')) || 0;
                                                    const diff = bNum - aNum;
                                                    const isPositive = diff >= 0;
                                                    return (
                                                        <tr key={key} className="hover:bg-cherry-50">
                                                            <td className="border p-2 text-gray-700">{label}</td>
                                                            <td className="border p-2 font-medium">{aValue}</td>
                                                            <td className="border p-2 font-medium">{bValue}</td>
                                                            <td className={`border p-2 font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                                {diff >= 0 ? '+' : ''}{diff.toFixed(2)}{key === 'totalReduction' ? '%' : ''}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-4 p-3 bg-cherry-50 rounded-lg">
                    <h4 className="font-bold text-cherry-700 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                        </svg>
                        配置建議
                    </h4>
                    <p className="text-xs text-gray-700">
                        防禦和流派抵禦提升減傷率，適合高傷害場景；高氣血提升EHP，適合多次攻擊場景。若EHP差距不大，選擇攻擊高的配置。
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-6">
                <div className="result-card bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100">
                    <div className="flex items-center mb-4">
                        <div className="w-1.5 h-5 rounded-full bg-cherry-500 mr-2"></div>
                        <h2 className="font-bold text-base md:text-lg text-gray-800">每200點屬性減傷收益</h2>
                    </div>
                    <div className="flex flex-wrap gap-4 mb-4">
                        {[
                            { key: 'ds', label: '氣盾', color: '#3b82f6' },
                            { key: 'dd', label: '防禦', color: '#10b981' },
                            { key: 'df', label: '流派抵禦', color: '#8b5cf6' },
                            { key: 'de', label: '元素抗性', color: '#14b8a6' },
                            { key: 'bb', label: '格擋', color: '#f97316' }
                        ].map(({ key, label, color }) => (
                            <label key={key} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={visibility[key]}
                                    onChange={() => toggleVisibility(key)}
                                    className="mr-2"
                                />
                                <span style={{ color }}>{label}</span>
                            </label>
                        ))}
                    </div>
                    <div className="w-full h-[250px] sm:h-[300px] md:h-[350px]">
                        <Recharts.ResponsiveContainer width="100%" height="100%">
                            <Recharts.LineChart data={deltaData}>
                                <Recharts.CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <Recharts.XAxis
                                    dataKey="point"
                                    label={{ value: "屬性點", position: "insideBottom", offset: -5, fontSize: 12, fill: "#6b7280" }}
                                    tick={{ fill: "#6b7280", fontSize: 12 }}
                                />
                                <Recharts.YAxis
                                    label={{ value: "每200點收益 (%)", angle: -90, position: "insideLeft", fontSize: 12, fill: "#6b7280" }}
                                    tickFormatter={(value) => (value * 100).toFixed(4)}
                                    tick={{ fill: "#6b7280", fontSize: 12 }}
                                />
                                <Recharts.Tooltip content={<CustomTooltip isDelta={true} />} />
                                <Recharts.Legend wrapperStyle={{ fontSize: 12 }} />
                                {visibility.ds && <Recharts.Line type="monotone" dataKey="ds" name="氣盾" stroke="#3b82f6" strokeWidth={2} dot={false} />}
                                {visibility.dd && <Recharts.Line type="monotone" dataKey="dd" name="防禦" stroke="#10b981" strokeWidth={2} dot={false} />}
                                {visibility.df && <Recharts.Line type="monotone" dataKey="df" name="流派抵禦" stroke="#8b5cf6" strokeWidth={2} dot={false} />}
                                {visibility.de && <Recharts.Line type="monotone" dataKey="de" name="元素抗性" stroke="#14b8a6" strokeWidth={2} dot={false} />}
                                {visibility.bb && <Recharts.Line type="monotone" dataKey="bb" name="格擋" stroke="#f97316" strokeWidth={2} dot={false} />}
                            </Recharts.LineChart>
                        </Recharts.ResponsiveContainer>
                    </div>
                </div>

                <div className="result-card bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100">
                    <div className="flex items-center mb-4">
                        <div className="w-1.5 h-5 rounded-full bg-cherry-500 mr-2"></div>
                        <h2 className="font-bold text-base md:text-lg text-gray-800">減傷率隨屬性點增幅</h2>
                    </div>
                    <div className="flex flex-wrap gap-4 mb-4">
                        {[
                            { key: 'ds', label: '氣盾', color: '#3b82f6' },
                            { key: 'dd', label: '防禦', color: '#10b981' },
                            { key: 'df', label: '流派抵禦', color: '#8b5cf6' },
                            { key: 'de', label: '元素抗性', color: '#14b8a6' },
                            { key: 'bb', label: '格擋', color: '#f97316' }
                        ].map(({ key, label, color }) => (
                            <label key={key} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={visibility[key]}
                                    onChange={() => toggleVisibility(key)}
                                    className="mr-2"
                                />
                                <span style={{ color }}>{label}</span>
                            </label>
                        ))}
                    </div>
                    <div className="w-full h-[250px] sm:h-[300px] md:h-[350px]">
                        <Recharts.ResponsiveContainer width="100%" height="100%">
                            <Recharts.LineChart data={reductionData}>
                                <Recharts.CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <Recharts.XAxis
                                    dataKey="point"
                                    label={{ value: "屬性點", position: "insideBottom", offset: -5, fontSize: 12, fill: "#6b7280" }}
                                    tick={{ fill: "#6b7280", fontSize: 12 }}
                                />
                                <Recharts.YAxis
                                    label={{ value: "總減傷率 (%)", angle: -90, position: "insideLeft", fontSize: 12, fill: "#6b7280" }}
                                    tickFormatter={(value) => (value * 100).toFixed(2)}
                                    tick={{ fill: "#6b7280", fontSize: 12 }}
                                />
                                <Recharts.Tooltip content={<CustomTooltip isDelta={false} />} />
                                <Recharts.Legend wrapperStyle={{ fontSize: 12 }} />
                                {visibility.ds && <Recharts.Line type="monotone" dataKey="ds" name="氣盾" stroke="#3b82f6" strokeWidth={2} dot={false} />}
                                {visibility.dd && <Recharts.Line type="monotone" dataKey="dd" name="防禦" stroke="#10b981" strokeWidth={2} dot={false} />}
                                {visibility.df && <Recharts.Line type="monotone" dataKey="df" name="流派抵禦" stroke="#8b5cf6" strokeWidth={2} dot={false} />}
                                {visibility.de && <Recharts.Line type="monotone" dataKey="de" name="元素抗性" stroke="#14b8a6" strokeWidth={2} dot={false} />}
                                {visibility.bb && <Recharts.Line type="monotone" dataKey="bb" name="格擋" stroke="#f97316" strokeWidth={2} dot={false} />}
                            </Recharts.LineChart>
                        </Recharts.ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="text-center text-xs text-gray-500 mb-4">
                <p>防守屬性收益計算器 © {new Date().getFullYear()} | 數據僅供參考</p>
            </div>
        </div>
