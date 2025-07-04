const { useState } = React;

const InnerPowerCalculator = () => {
  const [inputs, setInputs] = useState({
    base_attack: "6000",        // 基礎攻擊
    equip_attack: "2000",       // 裝備攻擊
    inner_attack: "179",        // 內功詞條攻擊
    elemental_attack: "2000",   // 元素攻擊
    skill_base: "2550",        // 技能基礎
    skill_multiplier: "100",   // 技能倍率 (%)
    pofu_percent: "0.08",      // 破釜百分比
    jianxin_percent: "0.03",   // 劍心百分比
    fire_zhoutian_percent: "0.08", // 三火周天百分比
    water_zhoutian_percent: "0.05", // 水周天百分比（假設減傷）
    wood_zhoutian_percent: "0.05", // 木周天百分比（假設防禦加成）
    gold_zhoutian: "0",        // 金周天等級
    restraint: "500",          // 克制
    skill_strength: "0",       // 技能強度
    break_defense: "3000",     // 破防
    break_shield: "1000",      // 破盾
    ignore_elem_resist: "1500", // 忽視元素抗性
    crit_value: "1000",        // 會心數值
    crit_damage: "1.5",       // 會心傷害 (倍率)
    hit: "800",                // 命中
    restraint_percent: "0.08", // 克制百分比
    skill_enhance_percent: "0", // 技能增強百分比
    defense: "4000",           // 防禦
    elem_resist: "1000",       // 元素抗性
    shield: "2000",            // 氣盾
    resist: "300",             // 抵禦
    skill_resist: "0",         // 技能抵禦
    block: "600",              // 格擋
    crit_resist: "500",        // 抗會心數值
    crit_defense: "0.25",      // 會心防禦
    resist_percent: "0",       // 抵禦百分比
    skill_resist_percent: "0"  // 技能抵禦百分比
  });

  const [inputErrors, setInputErrors] = useState({});

  const goldOptions = [
    { value: "0", label: "無金周天" },
    { value: "0.03", label: "金周天1級" },
    { value: "0.04", label: "金周天2級" },
    { value: "0.05", label: "金周天3級" }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "gold_zhoutian") {
      setInputs((prev) => ({ ...prev, [name]: value }));
      setInputErrors((prev) => ({ ...prev, [name]: "" }));
    } else {
      if (value < 0) {
        setInputErrors((prev) => ({ ...prev, [name]: "輸入值不能為負數" }));
        return;
      }
      if (value > 1000000) {
        setInputErrors((prev) => ({ ...prev, [name]: "輸入值過大，最大為1000000" }));
        return;
      }
      setInputs((prev) => ({ ...prev, [name]: value }));
      setInputErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const toNum = (val) => parseFloat(val) || 0;

  const calculateInnerPower = () => {
    const {
      base_attack, equip_attack, inner_attack, elemental_attack, skill_base, skill_multiplier,
      pofu_percent, jianxin_percent, fire_zhoutian_percent, water_zhoutian_percent, wood_zhoutian_percent,
      gold_zhoutian, restraint, skill_strength, break_defense, break_shield, ignore_elem_resist,
      crit_value, crit_damage, hit, restraint_percent, skill_enhance_percent,
      defense, elem_resist, shield, resist, skill_resist, block, crit_resist, crit_defense,
      resist_percent, skill_resist_percent
    } = inputs;

    // 最終攻擊力（考慮內功加成）
    const total_attack = (toNum(base_attack) + toNum(equip_attack) + toNum(inner_attack)) *
      (1 + toNum(pofu_percent) + toNum(jianxin_percent) + toNum(fire_zhoutian_percent)) * 1.2;

    // 最終元素攻擊
    const total_elemental_attack = toNum(elemental_attack) * (1 + toNum(fire_zhoutian_percent)) * 1.2;

    // 剩餘氣盾
    const shield_remaining = toNum(break_shield) >= toNum(shield) ? 0 :
      toNum(shield) / 3 <= toNum(break_shield) ? 0.5 * (toNum(shield) - toNum(break_shield)) :
      toNum(shield) - 2 * toNum(break_shield);

    // 攻防區計算
    const attack_pool = total_attack - shield_remaining + toNum(restraint) - toNum(resist) +
      toNum(skill_strength) - toNum(skill_resist);

    // 防禦減免（考慮木周天防禦加成）
    const effective_defense = toNum(defense) * (1 + toNum(wood_zhoutian_percent));
    const def_reduction = (effective_defense - toNum(break_defense)) /
      (effective_defense - toNum(break_defense) + 10552);
    const def_penetration = 1 - (def_reduction > 0 ? def_reduction : 0);

    // 元素減免
    const elem_reduction = (toNum(elem_resist) - toNum(ignore_elem_resist)) /
      (toNum(elem_resist) - toNum(ignore_elem_resist) + 1965);
    const elem_penetration = 1 - (elem_reduction > 0 ? elem_reduction : 0);

    // 基礎傷害
    const base_damage = (toNum(skill_base) + (toNum(skill_multiplier) / 100) * attack_pool) *
      def_penetration + (toNum(skill_multiplier) / 100) * total_elemental_attack * elem_penetration;

    // 會心與格擋
    const crit_chance = (115 * (toNum(crit_value) - toNum(crit_resist)) - 1230) /
      (toNum(crit_value) - toNum(crit_resist) + 1548) / 100 + toNum(gold_zhoutian);
    const hit_rate = 143 * toNum(hit) / (toNum(hit) + 5950) / 100 + 0.95;
    const block_rate = 143 * toNum(block) / (toNum(block) + 5950) / 100;
    const effective_hit = Math.min(1, hit_rate - block_rate);
    const crit_multiplier = 1 + crit_chance * (toNum(crit_damage) - 1 - toNum(crit_defense));
    const damage_multiplier = crit_multiplier * effective_hit + 0.5 * (1 - effective_hit);

    // 百分比乘區（考慮水周天減傷）
    const percent_multiplier = (1 + toNum(restraint_percent) - toNum(resist_percent)) *
      (1 + toNum(skill_enhance_percent) - toNum(skill_resist_percent)) *
      (1 - toNum(water_zhoutian_percent));

    // 最終傷害
    const final_damage = base_damage * percent_multiplier * damage_multiplier;

    return {
      total_attack: total_attack.toFixed(2),
      total_elemental_attack: total_elemental_attack.toFixed(2),
      base_damage: base_damage.toFixed(2),
      final_damage: final_damage.toFixed(2),
      def_penetration: (def_penetration * 100).toFixed(2) + "%",
      elem_penetration: (elem_penetration * 100).toFixed(2) + "%",
      crit_chance: (crit_chance * 100).toFixed(2) + "%",
      effective_hit: (effective_hit * 100).toFixed(2) + "%"
    };
  };

  const generateChartData = () => {
    const points = Array.from({ length: 51 }, (_, i) => i * 100); // 0到5000點內功詞條
    const combinations = [
      { name: "無內功", pofu: 0, jianxin: 0, fire_zhoutian: 0 },
      { name: "僅破釜", pofu: toNum(inputs.pofu_percent), jianxin: 0, fire_zhoutian: 0 },
      { name: "破釜+劍心", pofu: toNum(inputs.pofu_percent), jianxin: toNum(inputs.jianxin_percent), fire_zhoutian: 0 },
      { name: "破釜+劍心+三火", pofu: toNum(inputs.pofu_percent), jianxin: toNum(inputs.jianxin_percent), fire_zhoutian: toNum(inputs.fire_zhoutian_percent) }
    ];

    return combinations.map(combo => ({
      name: combo.name,
      data: points.map(point => {
        const attack_with_inner = (toNum(inputs.base_attack) + toNum(inputs.equip_attack) + point) *
          (1 + combo.pofu + combo.jianxin + combo.fire_zhoutian) * 1.2;
        const elem_attack_with_inner = (toNum(inputs.elemental_attack) + point) *
          (1 + combo.fire_zhoutian) * 1.2;
        const shield_remaining = toNum(inputs.break_shield) >= toNum(inputs.shield) ? 0 :
          toNum(inputs.shield) / 3 <= toNum(inputs.break_shield) ? 0.5 * (toNum(inputs.shield) - toNum(inputs.break_shield)) :
          toNum(inputs.shield) - 2 * toNum(inputs.break_shield);
        const attack_pool = attack_with_inner - shield_remaining + toNum(inputs.restraint) - toNum(inputs.resist) +
          toNum(inputs.skill_strength) - toNum(inputs.skill_resist);
        const effective_defense = toNum(inputs.defense) * (1 + toNum(inputs.wood_zhoutian_percent));
        const def_reduction = (effective_defense - toNum(inputs.break_defense)) /
          (effective_defense - toNum(inputs.break_defense) + 10552);
        const def_penetration = 1 - (def_reduction > 0 ? def_reduction : 0);
        const elem_reduction = (toNum(inputs.elem_resist) - toNum(inputs.ignore_elem_resist)) /
          (toNum(inputs.elem_resist) - toNum(inputs.ignore_elem_resist) + 1965);
        const elem_penetration = 1 - (elem_reduction > 0 ? elem_reduction : 0);
        const base_damage = (toNum(inputs.skill_base) + (toNum(inputs.skill_multiplier) / 100) * attack_pool) *
          def_penetration + (toNum(inputs.skill_multiplier) / 100) * elem_attack_with_inner * elem_penetration;
        const crit_chance = (115 * (toNum(inputs.crit_value) - toNum(inputs.crit_resist)) - 1230) /
          (toNum(inputs.crit_value) - toNum(inputs.crit_resist) + 1548) / 100 + toNum(inputs.gold_zhoutian);
        const hit_rate = 143 * toNum(inputs.hit) / (toNum(inputs.hit) + 5950) / 100 + 0.95;
        const block_rate = 143 * toNum(inputs.block) / (toNum(inputs.block) + 5950) / 100;
        const effective_hit = Math.min(1, hit_rate - block_rate);
        const crit_multiplier = 1 + crit_chance * (toNum(inputs.crit_damage) - 1 - toNum(inputs.crit_defense));
        const damage_multiplier = crit_multiplier * effective_hit + 0.5 * (1 - effective_hit);
        const percent_multiplier = (1 + toNum(inputs.restraint_percent) - toNum(inputs.resist_percent)) *
          (1 + toNum(inputs.skill_enhance_percent) - toNum(inputs.skill_resist_percent)) *
          (1 - toNum(inputs.water_zhoutian_percent));
        const damage = base_damage * percent_multiplier * damage_multiplier;
        return { point, damage: damage.toFixed(2) };
      })
    }));
  };

  const result = calculateInnerPower();
  const chartData = generateChartData();

  return (
    <div className="p-4 container mx-auto min-h-screen">
      <div className="cherry-gradient rounded-xl p-6 mb-6 shadow-lg">
        <h1 className="text-xl md:text-2xl font-bold text-center text-white">內功收益計算器</h1>
        <p className="text-center text-white text-opacity-90 text-sm mt-1">如有問題請聯繫櫻桃白蘭地@緣定今生</p>
      </div>

      <ImageUploader setInputs={setInputs} type="attacker" />

      <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100 mb-6">
        <h2 className="font-bold text-lg text-gray-800 mb-4">攻擊方參數</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: "base_attack", label: "基礎攻擊", icon: "⚔️" },
            { key: "equip_attack", label: "裝備攻擊", icon: "🛡️" },
            { key: "inner_attack", label: "內功詞條攻擊", icon: "💪" },
            { key: "elemental_attack", label: "元素攻擊", icon: "✨" },
            { key: "skill_base", label: "技能基礎", icon: "🔧" },
            { key: "skill_multiplier", label: "技能倍率 (%)", icon: "🔥" },
            { key: "pofu_percent", label: "破釜百分比", icon: "📈" },
            { key: "jianxin_percent", label: "劍心百分比", icon: "📈" },
            { key: "fire_zhoutian_percent", label: "三火周天百分比", icon: "🔥" },
            { key: "water_zhoutian_percent", label: "水周天百分比", icon: "💧" },
            { key: "wood_zhoutian_percent", label: "木周天百分比", icon: "🌳" },
            { key: "gold_zhoutian", label: "金周天", icon: "🌟", type: "select", options: goldOptions },
            { key: "restraint", label: "克制", icon: "🔄" },
            { key: "skill_strength", label: "技能強度", icon: "💪" },
            { key: "break_defense", label: "破防", icon: "🛡️" },
            { key: "break_shield", label: "破盾", icon: "🔨" },
            { key: "ignore_elem_resist", label: "忽視元素抗性", icon: "🌀" },
            { key: "crit_value", label: "會心數值", icon: "🎯" },
            { key: "crit_damage", label: "會心傷害 (倍率)", icon: "💥" },
            { key: "hit", label: "命中", icon: "🎯" },
            { key: "restraint_percent", label: "克制百分比", icon: "📊" },
            { key: "skill_enhance_percent", label: "技能增強百分比", icon: "📈" }
          ].map(({ key, label, icon, type, options }) => (
            <div key={key} className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">{icon} {label}</label>
              {type === "select" ? (
                <select
                  name={key}
                  value={inputs[key]}
                  onChange={handleChange}
                  className="input-focus border border-gray-200 rounded-lg p-2 text-sm w-full"
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
                  className={`input-focus border ${inputErrors[key] ? 'border-red-500' : 'border-gray-200'} rounded-lg p-2 text-sm w-full`}
                />
              )}
              {inputErrors[key] && <p className="text-xs text-red-600 mt-1">{inputErrors[key]}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100 mb-6">
        <h2 className="font-bold text-lg text-gray-800 mb-4">防守方參數</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: "defense", label: "防禦", icon: "🏰" },
            { key: "elem_resist", label: "元素抗性", icon: "🌀" },
            { key: "shield", label: "氣盾", icon: "🛡️" },
            { key: "resist", label: "抵禦", icon: "🔄" },
            { key: "skill_resist", label: "技能抵禦", icon: "💪" },
            { key: "block", label: "格擋", icon: "✋" },
            { key: "crit_resist", label: "抗會心數值", icon: "🎯" },
            { key: "crit_defense", label: "會心防禦", icon: "📊" },
            { key: "resist_percent", label: "抵禦百分比", icon: "📊" },
            { key: "skill_resist_percent", label: "技能抵禦百分比", icon: "📉" }
          ].map(({ key, label, icon }) => (
            <div key={key} className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">{icon} {label}</label>
              <input
                type="number"
                name={key}
                value={inputs[key]}
                onChange={handleChange}
                className={`input-focus border ${inputErrors[key] ? 'border-red-500' : 'border-gray-200'} rounded-lg p-2 text-sm w-full`}
              />
              {inputErrors[key] && <p className="text-xs text-red-600 mt-1">{inputErrors[key]}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="result-card bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100 mb-6">
        <h2 className="font-bold text-lg text-gray-800 mb-4">計算結果</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-cherry-50 p-3 rounded-lg">
            <p className="text-xs text-cherry-700">最終攻擊力</p>
            <p className="text-lg font-bold text-cherry-800">{result.total_attack}</p>
          </div>
          <div className="bg-cherry-50 p-3 rounded-lg">
            <p className="text-xs text-cherry-700">最終元素攻擊</p>
            <p className="text-lg font-bold text-cherry-800">{result.total_elemental_attack}</p>
          </div>
          <div className="bg-cherry-50 p-3 rounded-lg">
            <p className="text-xs text-cherry-700">基礎傷害</p>
            <p className="text-lg font-bold text-cherry-800">{result.base_damage}</p>
          </div>
          <div className="bg-cherry-500 p-3 rounded-lg">
            <p className="text-xs text-white">最終傷害</p>
            <p className="text-lg font-bold text-white">{result.final_damage}</p>
          </div>
          <div className="bg-cherry-50 p-3 rounded-lg">
            <p className="text-xs text-cherry-700">防禦穿透率</p>
            <p className="text-lg font-bold text-cherry-800">{result.def_penetration}</p>
          </div>
          <div className="bg-cherry-50 p-3 rounded-lg">
            <p className="text-xs text-cherry-700">元素穿透率</p>
            <p className="text-lg font-bold text-cherry-800">{result.elem_penetration}</p>
          </div>
          <div className="bg-cherry-50 p-3 rounded-lg">
            <p className="text-xs text-cherry-700">會心率</p>
            <p className="text-lg font-bold text-cherry-800">{result.crit_chance}</p>
          </div>
          <div className="bg-cherry-50 p-3 rounded-lg">
            <p className="text-xs text-cherry-700">有效命中率</p>
            <p className="text-lg font-bold text-cherry-800">{result.effective_hit}</p>
          </div>
        </div>
      </div>

      <div className="result-card bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100">
        <h2 className="font-bold text-lg text-gray-800 mb-4">內功組合傷害收益</h2>
        <div className="w-full h-[250px] sm:h-[300px] md:h-[350px]">
          <Recharts.ResponsiveContainer width="100%" height="100%">
            <Recharts.LineChart>
              <Recharts.CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <Recharts.XAxis
                dataKey="point"
                label={{ value: "內功詞條點數", position: "insideBottom", offset: -5, fontSize: 12, fill: "#6b7280" }}
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
              <Recharts.YAxis
                label={{ value: "傷害", angle: -90, position: "insideLeft", fontSize: 12, fill: "#6b7280" }}
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
              <Recharts.Tooltip />
              <Recharts.Legend wrapperStyle={{ fontSize: 12 }} />
              {chartData.map((combo, index) => (
                <Recharts.Line
                  key={combo.name}
                  type="monotone"
                  dataKey="damage"
                  data={combo.data}
                  name={combo.name}
                  stroke={["#3b82f6", "#10b981", "#8b5cf6", "#f97316"][index]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </Recharts.LineChart>
          </Recharts.ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
