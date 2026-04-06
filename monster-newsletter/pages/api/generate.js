export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };

const SYSTEM_PROMPT = `너는 학원 소식지 작성 전문가야. 더몬스터학원의 월간 소식지를 작성해.

# 작성 지침
1. 학부모에게 보내는 따뜻하고 전문적인 톤으로 작성
2. 각 섹션은 간결하면서도 필요한 정보를 충실히 담아야 해
3. 불릿 포인트(•)를 활용해서 가독성 높게 작성
4. 날짜, 시간 등 구체적인 정보가 있으면 명확하게 표기
5. 과장하지 말고 신뢰감 있는 문체로 작성

# 출력 형식
반드시 아래 JSON 형식으로만 대답해. (마크다운 백틱 없이 순수 JSON만)
{
  "title": "소식지 제목",
  "sections": [
    { "id": "섹션ID", "title": "섹션 제목", "content": "섹션 내용" }
  ]
}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다' });

  const { prompt, month, title, sections, target } = req.body;
  if (!prompt) return res.status(400).json({ error: '프롬프트가 필요합니다' });

  try {
    let userMessage = "";

    if (target === "all") {
      userMessage = `${month} 더몬스터학원 소식지를 작성해줘.

키워드/내용: ${prompt}

다음 섹션들을 포함해서 작성해줘:
${sections.map(s => `- ${s.title} (id: ${s.id})`).join("\n")}

기존 내용이 있는 섹션은 참고해서 더 좋게 다듬어줘:
${sections.filter(s => s.content).map(s => `[${s.title}] ${s.content}`).join("\n")}`;
    } else {
      const targetSection = sections.find(s => s.id === target);
      userMessage = `${month} 더몬스터학원 소식지의 "${targetSection?.title || target}" 섹션만 작성해줘.

키워드/내용: ${prompt}

소식지 제목: ${title}
기존 내용: ${targetSection?.content || "(없음)"}

해당 섹션의 id는 "${target}"이야. 이 섹션만 포함해서 응답해줘.`;
    }

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: userMessage }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json'
        }
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message || 'Gemini API 오류' });
    }

    const contentText = data.candidates[0].content.parts[0].text;
    const parsed = JSON.parse(contentText);

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message || '알 수 없는 오류' });
  }
}
