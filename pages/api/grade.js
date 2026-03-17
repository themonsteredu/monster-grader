export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

const PROMPT = (answers) => `# 쎈수학 숙제 채점

정답표:
${answers}

# 핵심 규칙

## 1. 빈 괄호 = 미풀이 (가장 중요!!)

이 교재는 답을 ( ) 괄호 안에 쓰는 형식입니다.
- 괄호 안에 학생 필기가 없으면 → 무조건 "미풀이"
- ( ) 만 있고 안이 비어있으면 → "미풀이"
- 괄호 자체가 인쇄물이므로 괄호만 보고 답이 있다고 판단하지 마세요!
- ○×문제에서 괄호가 비어있으면 → "미풀이" (절대 ○나 ×로 읽지 마세요!)

## 2. 필기 vs 인쇄

인쇄물 (답이 아님!):
- 문제번호(0001 등), 문제 본문, 수식, 보기
- ( ) 괄호 자체, (가)(나)(다) 라벨
- 깔끔한 활자체 텍스트 전부

학생 필기 (이것만 답):
- 연필/볼펜 손글씨 (삐뚤하거나 흐릿)
- 괄호 안에 직접 쓴 글씨 (유, 무, 순, ○, × 등)
- 문제 옆 빈칸에 쓴 숫자/수식
- 보기에 동그라미/V체크

## 3. 채점 방식
- 기본값 = "미풀이"
- 확실한 손글씨가 있을 때만 답으로 인정
- 같은 값 = 정답 (0.5=1/2, ②=2번, "유"="유한소수")
- 의심스러우면 → "미풀이"

## 응답 (JSON만, 다른 텍스트 절대 금지!)
{"results":[{"num":"0001","correct":"정답","student":"학생답","ok":true}]}

student: 학생 필기 그대로. 미풀이면 반드시 "미풀이". 판독불가면 "판독불가".
ok: true=정답, false=오답또는미풀이, null=판독불가`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY 환경변수가 설정되지 않았습니다' });

  const { imageBase64, answers } = req.body;
  if (!imageBase64 || !answers) return res.status(400).json({ error: '이미지와 정답이 필요합니다' });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            { type: 'text', text: PROMPT(answers) },
          ]
        }]
      }),
    });

    const data = await response.json();
    
    if (!response.ok || data.error) {
      const msg = data.error?.message || `API 오류 (${response.status})`;
      if (msg.includes('Incorrect API key')) {
        return res.status(401).json({ error: 'API 키가 올바르지 않습니다. Vercel 환경변수를 확인하세요.' });
      }
      if (msg.includes('insufficient_quota') || msg.includes('exceeded')) {
        return res.status(402).json({ error: 'OpenAI 크레딧이 부족합니다. platform.openai.com에서 충전하세요.' });
      }
      return res.status(500).json({ error: msg });
    }

    const txt = data.choices?.[0]?.message?.content || '';
    const clean = txt.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let parsed;
    try { parsed = JSON.parse(clean); } catch {
      const m = clean.match(/\{[\s\S]*"results"[\s\S]*\}/);
      if (m) {
        let s = m[0].replace(/,\s*$/, '');
        const ob = (s.match(/\{/g)||[]).length - (s.match(/\}/g)||[]).length;
        const oa = (s.match(/\[/g)||[]).length - (s.match(/\]/g)||[]).length;
        for (let i=0;i<oa;i++) s+=']';
        for (let i=0;i<ob;i++) s+='}';
        parsed = JSON.parse(s);
      } else {
        return res.status(500).json({ error: '응답 파싱 실패' });
      }
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
