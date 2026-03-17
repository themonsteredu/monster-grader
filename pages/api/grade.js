export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

const PROMPT = (answers) => `너는 수학 학원 선생님이야. 학생이 쎈수학 문제집에 숙제를 풀어왔어.
사진을 꼼꼼히 보고 각 문제를 채점해줘.

# 정답
${answers}

# 답 쓰는 방식

1. ( ) 괄호 안에 연필로 답을 씀 → 연필 글씨가 답
   → 괄호 안이 비어있으면 = 오답처리
2. (가)(나)(다)(라) 빈칸에 답을 씀 → 빈칸이 비면 오답처리
3. 보기에 동그라미/V체크 → 체크한 번호가 답
4. 서술형 풀이 → 풀이 내용 읽기

# 채점법

각 문제마다:
1. 학생 연필/볼펜 글씨가 있는지 확인 (인쇄 텍스트는 무시!)
2. 글씨 없으면 → 오답
3. 글씨 있으면 → 읽고 정답 비교

비교: "유"="유한소수", "무"="무한소수", "순"="순환소수", 0.5=1/2, ②=2번

# 주의!
- 빈 ( )를 ○로 읽지 마!
- 인쇄 텍스트를 학생 답으로 착각하지 마!
- 확신 없으면 오답처리!

# 응답 (JSON만!)
{"results":[{"num":"0001","correct":"정답","student":"학생답","ok":true}]}`;

async function callGPT(apiKey, images, prompt) {
  const content = [];
  for (const img of images) {
    content.push({ 
      type: 'image_url', 
      image_url: { url: 'data:image/jpeg;base64,' + img, detail: 'high' } 
    });
  }
  content.push({ type: 'text', text: prompt });

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({
      model: 'gpt-4o', max_tokens: 4096, temperature: 0,
      messages: [{ role: 'user', content }]
    }),
  });
  const d = await r.json();
  if (!r.ok || d.error) throw new Error(d.error?.message || 'API 오류');
  return d.choices?.[0]?.message?.content || '';
}

function parseJSON(txt) {
  const c = txt.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(c); } catch {}
  const m = c.match(/\{[\s\S]*\}/);
  if (m) {
    let s = m[0].replace(/,\s*$/, '');
    const ob = (s.match(/\{/g)||[]).length - (s.match(/\}/g)||[]).length;
    const oa = (s.match(/\[/g)||[]).length - (s.match(/\]/g)||[]).length;
    for (let i=0;i<oa;i++) s+=']';
    for (let i=0;i<ob;i++) s+='}';
    return JSON.parse(s);
  }
  throw new Error('파싱 실패');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY가 설정되지 않았습니다' });

  const { images, answers } = req.body;
  const imageList = images || (req.body.imageBase64 ? [req.body.imageBase64] : []);
  if (!imageList.length || !answers) return res.status(400).json({ error: '이미지와 정답이 필요합니다' });

  try {
    const txt = await callGPT(apiKey, imageList, PROMPT(answers));
    const parsed = parseJSON(txt);
    return res.status(200).json({ results: parsed.results || [] });
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('Incorrect API key')) return res.status(401).json({ error: 'API 키가 올바르지 않습니다.' });
    if (msg.includes('insufficient_quota')) return res.status(402).json({ error: 'OpenAI 크레딧이 부족합니다.' });
    return res.status(500).json({ error: msg });
  }
}
