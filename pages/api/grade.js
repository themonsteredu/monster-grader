export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

const PROMPT = (answers) => `# 쎈수학 숙제 채점

정답표:
${answers}

# 규칙

## 1. 필기 vs 인쇄 구분 (최우선!)

이 사진은 쎈수학 문제집입니다.

인쇄물 (학생 답 아님!!):
- 문제번호, 문제 본문, 보기, 공식, 수식
- (가), (나), (다) 라벨, ①②③④⑤ 보기 번호와 내용
- ( ) 괄호, "유한소수", "무한소수" 등 인쇄 텍스트
- 깔끔하고 균일한 폰트 = 전부 인쇄물

학생 필기 (이것만 답으로 인정):
- 연필/볼펜 손글씨 (흐릿하거나 삐뚤함)
- 보기 번호 위 동그라미/V체크
- 괄호 안 직접 쓴 글씨
- 직접 쓴 ○ 또는 × 기호

⚠️ 인쇄된 보기가 있어도 학생 필기 없으면 "미풀이"!

## 2. 판정
기본값 = "미풀이". 확실한 필기만 답으로 인정.

## 3. 채점
같은 값 = 정답 (0.5=1/2, ②=2번). 복수답 순서 무관.

## 응답 (JSON만!)
{"results":[{"num":"0001","correct":"정답","student":"학생답","ok":true}]}`;

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
        model: 'gpt-5',
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
    if (data.error) return res.status(500).json({ error: data.error.message });

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
