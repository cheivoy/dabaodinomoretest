const { useState } = React;
const ImageUploader = ({ setInputs, type }) => {
    const [uploadedImages, setUploadedImages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    const handleImageUpload = (event) => {
        const files = Array.from(event.target.files).slice(0, 5); // 限制最多5張圖片
        if (files.length > 0) {
            setUploadedImages(files);
            setError(null);
        }
    };

    const preprocessImage = (file) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const MAX_SIZE = 1280;
                let { width, height } = img;
                if (width > MAX_SIZE || height > MAX_SIZE) {
                    const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
                    width *= ratio;
                    height *= ratio;
                }
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // Grayscale and binarization
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    const binary = avg > 128 ? 255 : 0;
                    data[i] = data[i + 1] = data[i + 2] = binary;
                }
                ctx.putImageData(imageData, 0, 0);

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/png');
            };
            img.onerror = () => {
                setError('圖像加載失敗，請檢查文件格式');
                resolve(file);
            };
        });
    };

    const startRecognition = async () => {
        if (uploadedImages.length === 0) return;

        setIsProcessing(true);
        setProgress(0);
        setError(null);

        let combinedValues = {};

        for (let i = 0; i < uploadedImages.length; i++) {
            const file = uploadedImages[i];
            try {
                const processedImage = await preprocessImage(file);

                const { data: { text } } = await Tesseract.recognize(
                    processedImage,
                    'chi_tra+eng',
                    {
                        logger: m => {
                            if (m.status === 'recognizing text') {
                                setProgress(Math.round((i / uploadedImages.length + m.progress / uploadedImages.length) * 100));
                            }
                        }
                    }
                );

                const values = parseText(text, type);
                if (Object.keys(values).length === 0) {
                    setError(`圖片 ${file.name} 未能識別到有效數據，請確保圖片清晰且包含屬性文字`);
                }
                combinedValues = { ...combinedValues, ...values };

            } catch (error) {
                console.error(`處理圖片 ${file.name} 時出錯：`, error);
                setError(`處理圖片 ${file.name} 時出錯：${error.message}`);
            }
        }

        if (Object.keys(combinedValues).length > 0) {
            setInputs(prev => ({ ...prev, ...combinedValues }));
        }
        setIsProcessing(false);
        setProgress(0);
    };

    const parseText = (text, type) => {
        const values = {};
        const regex = /([\u4e00-\u9fa5]+[\u4e00-\u9fa5\s：:]*)\s*[：:]*\s*([\d.,\/%-]+(?:\s*-\s*\d+)?)/g;
        let match;

        while ((match = regex.exec(text)) !== null) {
            const label = match[1].trim().replace(/\s+/g, '');
            let value = match[2].replace(/[,]/g, '').replace('%', '');

            if (type === 'attacker') {
                if (label.includes('技能倍率')) values.skill_multiplier = value;
                if (label.includes('攻擊') && !label.includes('元素攻擊') && !label.includes('攻擊%')) {
                    const [low] = value.split('-').map(Number);
                    values.D = low.toString();
                }
                if (label.includes('元素攻擊')) values.E = value;
                if (label.includes('會心數值') || (label.includes('會心') && !label.includes('會心傷害') && !label.includes('會心防禦'))) {
                    values.b_c = value;
                }
                if (label.includes('會心傷害')) {
                    values.d_c = (parseFloat(value) / 100).toString();
                }
                if (label.includes('流派克制') && !label.includes('流派克制%')) {
                    const [baseValue] = value.split('/').map(v => v.trim());
                    values.R = baseValue;
                }
                if (label.includes('流派克制%')) {
                    const [, percentValue] = value.split('/').map(v => parseFloat(v));
                    values.flow_percent = (percentValue / 100).toString();
                }
                if (label.includes('命中')) values.h = value;
                if (label.includes('破防')) values.b_d = value;
                if (label.includes('破盾')) values.b_s = value;
                if (label.includes('忽視元素抗性')) values.b_e = value;
                if (label.includes('增傷')) {
                    values.damage_increase = (parseFloat(value) / 100).toString();
                }
                if (label.includes('技能增傷')) {
                    values.skill_damage_increase = (parseFloat(value) / 100).toString();
                }
                if (label.includes('金周天')) {
                    if (value.includes('1級') || value.includes('1')) values.gold_i = '0.03';
                    else if (value.includes('2級') || value.includes('2')) values.gold_i = '0.04';
                    else if (value.includes('3級') || value.includes('3')) values.gold_i = '0.05';
                    else values.gold_i = '0';
                }
            } else if (type === 'defender') {
                if (label.includes('氣血')) values.hp = value.split('/')[0];
                if (label.includes('防禦')) values.d_d = value;
                if (label.includes('抗會心數值') || (label.includes('會心') && !label.includes('會心傷害') && !label.includes('會心防禦'))) {
                    values.b_c_defense = value;
                }
                if (label.includes('會心防禦')) {
                    values.d_c_defense = (parseFloat(value) / 100).toString();
                }
                if (label.includes('格擋')) values.b_b = value;
                if (label.includes('元素抗性')) values.d_e = value;
                if (label.includes('傷害減免')) {
                    values.damage_reduction = (parseFloat(value) / 100).toString();
                }
                if (label.includes('流派抵禦') && !label.includes('流派抵禦%')) {
                    const [baseValue] = value.split('/').map(v => v.trim());
                    values.d_f = baseValue;
                }
                if (label.includes('流派抵禦%')) {
                    const [, percentValue] = value.split('/').map(v => parseFloat(v));
                    values.flow_resist_percent = (percentValue / 100).toString();
                }
                if (label.includes('怪物克制')) {
                    const [, second] = value.split('/').map(v => parseFloat(v));
                    values.flow_resist_percent = (second / 100).toString();
                }
                if (label.includes('氣盾')) values.d_s = value;
                if (label.includes('技能減免')) values.skill_damage_reduction = (parseFloat(value) / 100).toString();
            }

            if (label.includes('破防')) values.armor_break = value;
            if (label.includes('命中')) values.hit = value;
            if (label.includes('元素攻擊')) values.elemental_attack = value;
            if (label.includes('首領克制')) {
                const [first] = value.split('/').map(v => parseFloat(v));
                values.boss_restraint = first.toString();
            }
            if (label.includes('流派克制')) {
                const [first, second] = value.split('/').map(v => parseFloat(v));
                values.faction_restraint = Math.max(first, second).toString();
            }
            if (label.includes('抗性忽視')) values.resistance_ignore = value;
            if (label.includes('治療強度')) values.healing_power_equip = value;
        }
        return values;
    };

    return (
        <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
                {type === 'attacker' ? '上傳攻擊方截圖' : type === 'defender' ? '上傳防守方截圖' : '上傳截圖'}
            </label>
            <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                multiple
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cherry-500 file:text-white hover:file:bg-cherry-600"
            />
            {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            {uploadedImages.length > 0 && (
                <div className="mt-2 flex items-center space-x-2">
                    <p className="text-xs text-gray-500">已選 {uploadedImages.length} 張圖片</p>
                    <button
