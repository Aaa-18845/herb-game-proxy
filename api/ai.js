export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '只接受POST请求' });
    }

    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: '服务端未配置API Key' });
    }

    const apiUrl = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

    try {
        const { prompt } = req.body;
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "qwen-max",
                messages: [
                    { role: "system", content: "你是中医大师，只输出合法JSON，不要有任何额外解释。" },
                    { role: "user", content: prompt || "生成5道中医药选择题，严格JSON格式。" }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            return res.status(response.status).json({ error: `API错误: ${errText}` });
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const jsonMatch = content.match(/\{.*\}/s);
        const cleanJson = jsonMatch ? jsonMatch[0] : content;
        const parsed = JSON.parse(cleanJson);

        return res.status(200).json({ questions: parsed.questions });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}