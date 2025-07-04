const { useState } = React;
const DamageCalculator2 = () => {
    const [inputs, setInputs] = useState({
        skill_multiplier: "1518",
        D: "5000", E: "800", b_c: "900", d_c: "1.8", R: "500", h: "700",
        b_d: "2000", b_s: "700", b_e: "0", flow_percent: "0", damage_increase: "0",
        skill_damage_increase: "0",
        d_s: "2000", d_f: "2000", d_d: "5000", d_e: "0", b_b: "600", hp: "80000",
        b_c_defense: "550", d_c_defense: "0", flow_resist_percent: "0", damage_reduction: "0",
        skill_damage_reduction: "0",
        lambda_1: "358", lambda_2: "0.359", lambda_3: "2860", lambda_4: "531", W: "1",
        gold_i: "0"
    });
    const [inputErrors, setInputErrors] = useState({});
    const [previousResult, setPreviousResult] = useState(null);
    const [previousInputs, setPreviousInputs] = useState(null);
    // 新增可見性狀態，控制曲線顯示
    const [visibility, setVisibility] = useState({
        b_d: true, // 破防
        b_e: true, // 忽視元素抗性
        R: true, // 克制
        h: true, // 命中
        D: true, // 攻擊
        E: true, // 元素攻擊
    });

    const [showAttacker, setShowAttacker] = useState(true);
    const [showDefender, setShowDefender] = useState(true);
    const [showOriginal, setShowOriginal] = useState(true);
    const [showCorrected, setShowCorrected] = useState(true);
    const [isTableExpanded, setIsTableExpanded] = React.useState(true);

    const goldOptions = [
        { value: "0", label: "無金周天" },
        { value: "0.03", label: "金周天1級" },
        { value: "0.04", label: "金周天2級" },
        { value: "0.05", label: "金周天3級" },
    ];

    const elementWeaknessOptions = [
        { value: "1", label: "無元素弱點" },
        { value: "1.1", label: "碎夢大特" },
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

    const saveCurrentResult = () => {
        setPreviousResult(calculate(inputs));
        setPreviousInputs({ ...inputs });
    };

    const toggleVisibility = (key) => {
        setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const toNum = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
    };

    const calculateRecommendedBreakDefense = (d_d, lambda_3) => {
        const d_d_num = toNum(d_d);
        const lambda_3_num = toNum(lambda_3);
        if (d_d_num <= 0) return 0;
        const minBreakDefense = d_d_num - (9 / 11) * lambda_3_num;
        return Math.ceil(minBreakDefense < 0 ? 0 : minBreakDefense); // 確保不為負數
    };

    const calculateRecommendedAccuracy = (b_b) => {
        const b_b_num2 = toNum(b_b);
        if (b_b_num2 <= 0) return 0;
        const r_b_val2 = b_b_num2 / (b_b_num2 + 3678);
        const target2 = r_b_val2 + 0.02447552448; // 0.035 / 1.43 
        if (target2 >= 1) return '無法達到98%命中';
        const h_required2 = (target2 * 3678) / (1 - target2);
        const result2 = Math.ceil(h_required2);
        return result2 > 0 && result2 < 1000000 ? result2 : 'ERROR';
    };

    const calculate = (inputs) => {
        const {
            skill_multiplier, D, E, b_c, d_c, R, h, b_d, b_s, b_e, flow_percent, damage_increase,
            skill_damage_increase, d_s, d_f, d_d, d_e, b_b, hp, b_c_defense, d_c_defense,
            flow_resist_percent, damage_reduction, skill_damage_reduction, lambda_1, lambda_2,
            lambda_3, lambda_4, W, gold_i, d_b
        } = inputs;

        const toNumVal = (val) => Number(val) || 0;

        const c = toNumVal(b_c) - toNumVal(b_c_defense);
        const p_c = (115 * c + 90) / (c + 940) / 100 + toNumVal(gold_i);
        const r_h = 143 * toNumVal(h) / (toNumVal(h) + 3678) / 100;
        const r_b = 143 * toNumVal(b_b) / (toNumVal(b_b) + 3678) / 100;
        const p_h = Math.min(1, 0.95 + r_h - r_b);
        const m_c = 1 + p_c * (toNumVal(d_c) - 1 - toNumVal(d_c_defense));
        const d_mul = m_c * p_h + 0.5 * (1 - p_h);

        const G = toNumVal(b_s) >= toNumVal(d_s)
            ? 0
            : toNumVal(d_s) / 3 <= toNumVal(b_s)
                ? 0.5 * (toNumVal(d_s) - toNumVal(b_s))
                : toNumVal(d_s) - 2 * toNumVal(b_s);

        const A = toNumVal(D) + (toNumVal(R) - toNumVal(d_f)) - G;

        const gamma = toNumVal(d_d) - toNumVal(b_d) > 0
            ? (toNumVal(d_d) - toNumVal(b_d)) / (toNumVal(d_d) - toNumVal(b_d) + toNumVal(lambda_3))
            : 0;
        const gamma_1 = 1 - gamma;

        const e = toNumVal(d_e) - toNumVal(b_e);
        const beta = e > 0 ? e / (e + toNumVal(lambda_4)) : 0;

        const gamma_2 = gamma > 0 ? 1 - gamma : 1;
        const beta_2 = beta > 0 ? 1 - beta : 1;

        const c_original = toNumVal(b_c);
        const p_c_original = (115 * c_original + 90) / (c_original + 940) / 100 + toNumVal(gold_i);
        const r_h_original = r_h;
        const r_b_original = 0;
        const p_h_original = Math.min(1, 0.95 + r_h_original - r_b_original);
        const m_c_original = 1 + p_c_original * (toNumVal(d_c) - 1);
        const d_mul_original = m_c_original * p_h_original + 0.5 * (1 - p_h_original);
        const G_original = toNumVal(b_s);
        const A_original = toNumVal(D) + toNumVal(R) + G_original;
        const gamma_original = 0;
        const beta_original = 0;
        const gamma_original_2 = 1 - gamma_original;
        const beta_original_2 = 1 - beta_original;

        const baseDamage = (
            (toNumVal(skill_multiplier) / 100) * (((toNumVal(lambda_1) + toNumVal(lambda_2) * A_original) * (1 - gamma_original)) +
                toNumVal(W) * toNumVal(lambda_2) * toNumVal(E) * (1 - beta_original))
        ) * d_mul_original * (1 + toNumVal(flow_percent)) * (1 + toNumVal(damage_increase)) * (1 + toNumVal(skill_damage_increase));

        const finalDamage = (
            (toNumVal(skill_multiplier) / 100) * (((toNumVal(lambda_1) + toNumVal(lambda_2) * A) * (1 - gamma)) +
                toNumVal(W) * toNumVal(lambda_2) * toNumVal(E) * (1 - beta))
        ) * d_mul * (1 + toNumVal(flow_percent) - toNumVal(flow_resist_percent)) * (1 + toNumVal(damage_increase) - toNumVal(damage_reduction)) * (1 + toNumVal(skill_damage_increase) / 100 - toNumVal(skill_damage_reduction) / 100);

        const totalReduction = (baseDamage - finalDamage) / baseDamage || 0;
        const ehp = toNumVal(hp) / (1 - totalReduction) || toNumVal(hp);

        const base_elementalDamage = (
            (toNumVal(skill_multiplier) / 100) * (toNumVal(W) * toNumVal(lambda_2) * toNumVal(E) * (1 - beta_original))
        ) * d_mul_original * (1 + toNumVal(flow_percent) - toNumVal(flow_resist_percent)) * (1 + toNumVal(damage_increase) - toNumVal(damage_reduction)) * (1 + toNumVal(skill_damage_increase) / 100 - toNumVal(skill_damage_reduction) / 100);

        const elementalDamage = (
            (toNumVal(skill_multiplier) / 100) * (toNumVal(W) * toNumVal(lambda_2) * toNumVal(E) * (1 - beta))
        ) * d_mul * (1 + toNumVal(flow_percent) - toNumVal(flow_resist_percent)) * (1 + toNumVal(damage_increase) - toNumVal(damage_reduction)) * (1 + toNumVal(skill_damage_increase) / 100 - toNumVal(skill_damage_reduction) / 100);

        const base_elementalDamagePrecentage = base_elementalDamage / baseDamage || 0;
        const elementalDamagePrecentage = elementalDamage / finalDamage || 0;

        const calculateRequiredH = (b_b) => {
            const b_b_num = toNumVal(b_b);
            if (b_b_num === 0) {
                return 0;
            }
            const r_b_val = 143 * b_b_num / (b_b_num + 3678) / 100;
            const r_h_target = 0.05 + r_b_val;
            if (r_h_target >= 1.43) { // 143/100 = 1.43是理论最大值
                return '無法滿命中';
            }
            const numerator = r_h_target * 100 * 3678;
            const denominator = 143 - r_h_target * 100;

            if (denominator <= 0) {
                return '無法滿命中';
            }

            const h_required = Math.ceil(numerator / denominator);

            return h_required > 0 && h_required < 10000 ? h_required : 'ERROR';
        };

        const full_ph = calculateRequiredH(inputs.b_b);

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
            gamma_1: (gamma_1 * 100).toFixed(2) + "%",
            beta: (beta * 100).toFixed(2) + "%",
            gamma_2: (gamma_2 * 100).toFixed(2) + "%",
            beta_2: (beta_2 * 100).toFixed(2) + "%",
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
            gamma_original_2: (gamma_original_2 * 100).toFixed(2) + "%",
            beta_original_2: (beta_original_2 * 100).toFixed(2) + "%",
            baseDamage: baseDamage.toFixed(2),
            finalDamage: finalDamage.toFixed(2),
            totalReduction: (totalReduction * 100).toFixed(2) + "%",
            ehp: ehp.toFixed(2),
            base_elementalDamage: base_elementalDamage.toFixed(2),
            elementalDamage: elementalDamage.toFixed(2),
            base_elementalDamagePrecentage: (base_elementalDamagePrecentage * 100).toFixed(2) + "%",
            elementalDamagePrecentage: (elementalDamagePrecentage * 100).toFixed(2) + "%",
            full_ph: typeof full_ph === 'number' ? full_ph.toFixed(0) : full_ph,
        };
    };


    const generateChartData = (inputs) => {
        const attribute_points = Array.from({ length: 51 }, (_, i) => i * 200); // [0, 200, ..., 10000]
        const increases = { b_d: [], b_e: [], D: [], E: [], R: [], b_s: [], h: [] };
        const delta_increases = { b_d: [], b_e: [], D: [], E: [], R: [], b_s: [], h: [] };

        const toNum = (val) => {
            const num = parseFloat(val);
            return isNaN(num) ? 0 : num;
        };

        const calculateDamage = (D, E, R, b_d, b_e, b_s, h) => {
            const c = toNum(inputs.b_c) - toNum(inputs.b_c_defense);
            const p_c = (115 * c + 90) / (c + 940) / 100 + toNum(inputs.gold_i);
            const r_h = 143 * toNum(h) / (toNum(h) + 3678) / 100;
            const r_b = 143 * toNum(inputs.b_b) / (toNum(inputs.b_b) + 3678) / 100;
            const p_h = Math.min(1, 0.95 + r_h - r_b);
            const m_c = 1 + p_c * (toNum(inputs.d_c) - 1 - toNum(inputs.b_c_defense));
            const d_mul = m_c * p_h + 0.5 * (1 - p_h);
            const G = toNum(b_s) >= toNum(inputs.d_s)
                ? 0
                : toNum(inputs.d_s) / 3 <= toNum(b_s)
                    ? 0.5 * (toNum(inputs.d_s) - toNum(b_s))
                    : toNum(inputs.d_s) - 2 * toNum(b_s);
            const A = toNum(D) + (toNum(R) - toNum(inputs.d_f)) - G;
            const gamma = toNum(inputs.d_d) - toNum(b_d) > 0
                ? (toNum(inputs.d_d) - toNum(b_d)) / (toNum(inputs.d_d) - toNum(b_d) + toNum(inputs.lambda_3))
                : 0;
            const e = toNum(inputs.d_e) - toNum(b_e);
            const beta = e > 0 ? e / (e + toNum(inputs.lambda_4)) : 0;
            return (
                (toNum(inputs.skill_multiplier) / 100) *
                (((toNum(inputs.lambda_1) + toNum(inputs.lambda_2) * A) * (1 - gamma)) +
                    toNum(inputs.W) * toNum(inputs.lambda_2) * toNum(E) * (1 - beta))
            ) * d_mul *
                (1 + toNum(inputs.flow_percent) - toNum(inputs.flow_resist_percent)) *
                (1 + toNum(inputs.damage_increase) - toNum(inputs.damage_reduction)) *
                (1 + toNum(inputs.skill_damage_increase) / 100 - toNum(inputs.skill_damage_reduction) / 100);
        };

        // ✅ 修正：計算滿命中所需的命中值
        const calculateRequiredH = (b_b) => {
            const b_b_num = toNum(b_b);
            if (b_b_num === 0) return 0;

            const r_b_val = 143 * b_b_num / (b_b_num + 3678) / 100;
            const r_h_target = 0.05 + r_b_val;

            if (r_h_target >= 1.43) return 10000; // 設定一個高值表示無法達成

            const numerator = r_h_target * 100 * 3678;
            const denominator = 143 - r_h_target * 100;

            if (denominator <= 0) return 10000;

            return Math.ceil(numerator / denominator);
        };

        // ✅ 修正：使用滿命中作為基準，而不是全部屬性為0
        const fullHitRequired = calculateRequiredH(toNum(inputs.b_b));
        const baselineH = Math.min(fullHitRequired, 10000); // 確保不會過高

        // 基準傷害：使用滿命中 + 其他屬性為0的情況
        const baseDamage = calculateDamage(
            toNum(inputs.D),
            toNum(inputs.E),
            0, // R = 0
            0, // b_d = 0
            0, // b_e = 0
            0, // b_s = 0
            baselineH // h = 滿命中所需值
        );

        const calculateIncrease = (attr, value) => {
            const params = {
                D: toNum(inputs.D),
                E: toNum(inputs.E),
                R: 0,
                b_d: 0,
                b_e: 0,
                b_s: 0,
                h: baselineH // ✅ 基準命中值
            };

            // 設定屬性值
            if (['R', 'b_d', 'b_e', 'b_s'].includes(attr)) {
                // R, b_d, b_e, b_s 使用絕對值
                params[attr] = value;
            } else if (attr === 'h') {
                // ✅ 命中使用基準值 + 增量
                params[attr] = baselineH + value;
            } else {
                // D, E 使用當前值 + 增量
                params[attr] = toNum(inputs[attr]) + value;
            }

            const newDamage = calculateDamage(
                params.D, params.E, params.R, params.b_d, params.b_e, params.b_s, params.h
            );
            const increase = baseDamage ? (newDamage - baseDamage) / baseDamage : 0;

            // ✅ 負收益顯示為0
            return Math.max(0, increase);
        };

        attribute_points.forEach((point) => {
            increases.D.push(calculateIncrease('D', point));
            increases.E.push(calculateIncrease('E', point));
            increases.R.push(calculateIncrease('R', point));
            increases.b_d.push(calculateIncrease('b_d', point));
            increases.b_e.push(calculateIncrease('b_e', point));
            increases.b_s.push(calculateIncrease('b_s', point));
            increases.h.push(calculateIncrease('h', point));
        });

        for (let i = 1; i < increases.b_s.length; i++) {
            // ✅ 邊際收益也確保不為負數
            delta_increases.D.push(Math.max(0, increases.D[i] - increases.D[i - 1]));
            delta_increases.E.push(Math.max(0, increases.E[i] - increases.E[i - 1]));
            delta_increases.R.push(Math.max(0, increases.R[i] - increases.R[i - 1]));
            delta_increases.b_d.push(Math.max(0, increases.b_d[i] - increases.b_d[i - 1]));
            delta_increases.b_e.push(Math.max(0, increases.b_e[i] - increases.b_e[i - 1]));
            delta_increases.b_s.push(Math.max(0, increases.b_s[i] - increases.b_s[i - 1]));
            delta_increases.h.push(Math.max(0, increases.h[i] - increases.h[i - 1]));
        }

        const deltaData = attribute_points.slice(1).map((point, i) => ({
            point,
            D: delta_increases.D[i],
            E: delta_increases.E[i],
            R: delta_increases.R[i],
            b_d: delta_increases.b_d[i],
            b_e: delta_increases.b_e[i],
            b_s: delta_increases.b_s[i],
            h: delta_increases.h[i],
        }));

        const increaseData = attribute_points.map((point, i) => ({
            point,
            D: increases.D[i],
            E: increases.E[i],
            R: increases.R[i],
            b_d: increases.b_d[i],
            b_e: increases.b_e[i],
            b_s: increases.b_s[i],
            h: increases.h[i]
        }));

        return {
            deltaData,
            increaseData,
            baselineInfo: {
                fullHitRequired,
                baselineH,
                baseDamage: baseDamage.toFixed(2)
            }
        };
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
    const { deltaData, increaseData } = generateChartData(inputs);

    const STORAGE_KEY = "damagePresets_attack";
    // 狀態：保存的方案
    const [presets, setPresets] = useState(() => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
    // 狀態：對比用的兩個索引
    const [compareIndexes, setCompareIndexes] = useState({ a: null, b: null });
    // 狀態：對比結果
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
                <h1 className="text-xl md:text-2xl font-bold text-center text-white">攻擊計算器</h1>
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
                        {[{ label: "真實會心", value: result.c_original },
                        { label: "會心率", value: result.p_c_original },
                        { label: "命中增幅倍率", value: result.p_h_original },
                        { label: "會心傷害倍率", value: result.m_c_original },
                        { label: "傷害倍率", value: result.d_mul_original },
                        { label: "剩餘氣盾", value: result.G_original },
                        { label: "防禦穿透率", value: result.gamma_original_2 },
                        { label: "元素穿透率", value: result.beta_original_2 },
                        { label: "元素傷害佔比", value: result.base_elementalDamagePrecentage }]
                            .map(({ label, value }) => (
                                <div key={label} className="bg-gray-50 p-2 md:p-3 rounded-lg">
                                    <p className="text-xs text-gray-600">{label}</p>
                                    <p className="text-sm font-bold text-gray-800">{value}</p>
                                </div>
                            ))}
                    </div>
                </div>

                {/* 修正後屬性區塊 */}
                <div
                    className="flex justify-between items-center cursor-pointer mb-2"
                    onClick={() => setShowCorrected(!showCorrected)}
                >
                    <div className="flex items-center">
                        <div className="w-1.5 h-5 rounded-full bg-cherry-500 mr-2"></div>
                        <h2 className="font-bold text-base md:text-lg text-gray-800">修正後屬性</h2>
                    </div>
                    <span className="text-cherry-700 text-lg">{showCorrected ? '收起' : '展開'}</span>
                </div>
                <div className={`transition-all duration-500 overflow-hidden ${showCorrected ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="grid grid-cols-2 gap-3">
                        {[{ label: "修正會心", value: result.c },
                        { label: "會心率", value: result.p_c },
                        { label: "命中增幅倍率", value: result.p_h },
                        { label: "會心傷害倍率", value: result.m_c },
                        { label: "傷害倍率", value: result.d_mul },
                        { label: "剩餘氣盾", value: result.G },
                        { label: "防禦穿透率", value: result.gamma_2 },
                        { label: "元素穿透率", value: result.beta_2 },
                        { label: "元素傷害佔比", value: result.elementalDamagePrecentage }]
                            .map(({ label, value }) => (
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
                        { label: "修正後傷害", value: result.finalDamage, color: "cherry-100" },
                        { label: "滿命中", value: result.full_ph, color: "cherry-100" },
                        { label: "傷害抵消率", value: result.totalReduction, color: "cherry-500", text: "white" },
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
                                                    { key: 'D', label: '攻擊' },
                                                    { key: 'E', label: '元素攻擊（平均）' },
                                                    { key: 'b_d', label: '破防' },
                                                    { key: 'R', label: '流派克制' },
                                                    { key: 'b_e', label: '忽視元素抗性' },
                                                    { key: 'h', label: '命中' },
                                                    { key: 'b_s', label: '破盾' },
                                                    { key: 'gamma_2', label: '防禦穿透率' },
                                                    { key: 'beta_2', label: '元素穿透率' },
                                                    { key: 'elementalDamagePrecentage', label: '元素傷害佔比' },
                                                    { key: 'baseDamage', label: '原傷害' },
                                                    { key: 'finalDamage', label: '修正後傷害' },
                                                    { key: 'totalReduction', label: '傷害修正率' }
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
                    <p>
                        建議破防：{calculateRecommendedBreakDefense(inputs.d_d, inputs.lambda_3)} 以上
                    </p>
                    <p>
                        建議命中：{calculateRecommendedAccuracy(inputs.b_b)} 以上
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-6">
                <div className="result-card bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100">
                    <div className="flex items-center mb-4">
                        <div className="w-1.5 h-5 rounded-full bg-cherry-500 mr-2"></div>
                        <h2 className="font-bold text-base md:text-lg text-gray-800">每200點屬性增傷收益-基於現有攻擊計算</h2>
                    </div>
                    {/* 新增勾選框 */}
                    <div className="flex flex-wrap gap-4 mb-4">
                        {[
                            { key: 'b_d', label: '破防', color: '#3b82f6' },
                            { key: 'b_e', label: '忽視元素抗性', color: '#10b981' },
                            { key: 'b_s', label: '破盾', color: '#8b5cf6' },
                            { key: 'R', label: '克制', color: '#14b8a6' },

                            { key: 'D', label: '攻擊', color: '#db2537' },

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
                                {/* 根據可見性動態渲染曲線 */}
                                {visibility.b_d && <Recharts.Line type="monotone" dataKey="b_d" name="破防" stroke="#3b82f6" strokeWidth={2} dot={false} />}
                                {visibility.b_e && <Recharts.Line type="monotone" dataKey="b_e" name="忽視元素抗性" stroke="#10b981" strokeWidth={2} dot={false} />}
                                {visibility.b_s && <Recharts.Line type="monotone" dataKey="b_s" name="破盾" stroke="#8b5cf6" strokeWidth={2} dot={false} />}
                                {visibility.R && <Recharts.Line type="monotone" dataKey="R" name="克制" stroke="#14b8a6" strokeWidth={2} dot={false} />}

                                {visibility.D && <Recharts.Line type="monotone" dataKey="D" name="攻擊" stroke="#db2537" strokeWidth={2} dot={false} />}

                            </Recharts.LineChart>
                        </Recharts.ResponsiveContainer>
                    </div>
                </div>

                <div className="result-card bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100">
                    <div className="flex items-center mb-4">
                        <div className="w-1.5 h-5 rounded-full bg-cherry-500 mr-2"></div>
                        <h2 className="font-bold text-base md:text-lg text-gray-800">遞增屬性收益走勢-基於現有攻擊計算</h2>
                    </div>
                    {/* 新增勾選框 */}
                    <div className="flex flex-wrap gap-4 mb-4">
                        {[
                            { key: 'b_d', label: '破防', color: '#3b82f6' },
                            { key: 'b_e', label: '忽視元素抗性', color: '#10b981' },
                            { key: 'b_s', label: '破盾', color: '#8b5cf6' },
                            { key: 'R', label: '克制', color: '#14b8a6' },

                            { key: 'D', label: '攻擊', color: '#db2537' },

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
                            <Recharts.LineChart data={increaseData}>
                                <Recharts.CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <Recharts.XAxis
                                    dataKey="point"
                                    label={{ value: "屬性點", position: "insideBottom", offset: -5, fontSize: 12, fill: "#6b7280" }}
                                    tick={{ fill: "#6b7280", fontSize: 12 }}
                                />
                                <Recharts.YAxis
                                    label={{ value: "累計收益 (%)", angle: -90, position: "insideLeft", fontSize: 12, fill: "#6b7280" }}
                                    tickFormatter={(value) => (value * 100).toFixed(2)}
                                    tick={{ fill: "#6b7280", fontSize: 12 }}
                                />
                                <Recharts.Tooltip content={<CustomTooltip isDelta={false} />} />
                                <Recharts.Legend wrapperStyle={{ fontSize: 12 }} />
                                {/* 根據可見性動態渲染曲線 */}
                                {visibility.b_d && <Recharts.Line type="monotone" dataKey="b_d" name="破防" stroke="#3b82f6" strokeWidth={2} dot={false} />}
                                {visibility.b_e && <Recharts.Line type="monotone" dataKey="b_e" name="忽視元素抗性" stroke="#10b981" strokeWidth={2} dot={false} />}
                                {visibility.b_s && <Recharts.Line type="monotone" dataKey="b_s" name="破盾" stroke="#8b5cf6" strokeWidth={2} dot={false} />}
                                {visibility.R && <Recharts.Line type="monotone" dataKey="R" name="克制" stroke="#14b8a6" strokeWidth={2} dot={false} />}

                                {visibility.D && <Recharts.Line type="monotone" dataKey="D" name="攻擊" stroke="#db2537" strokeWidth={2} dot={false} />}

                            </Recharts.LineChart>
                        </Recharts.ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="text-center text-xs text-gray-500 mb-4">
                <p>攻擊計算器 © {new Date().getFullYear()} | 數據僅供參考</p>
            </div>
        </div>

    );
};
