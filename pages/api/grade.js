export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

// STEP 1: Which problems have answers?
const DETECT_PROMPT = (nums) => `쎈수학 문제집 사진이야. 학생이 답을 썼는지 확인해줘.

문제번호: ${nums}

# 답이 있다고 판단하는 기준 (이것만 봐!)

## 주관식
- ( ) 괄호 안에 연필/볼펜 글씨가 있음 → 답 있음
- ( ) 괄호 안이 비어있음 → 답 없음
- 동그라미 안에 글씨가 있음 → 답 있음

## 객관식  
- ( ) 괄호 안에 번호가 쓰여있음 → 답 있음
- ①②③④⑤ 보기 번호에 동그라미 표시 → 답 있음
- ①②③④⑤ 보기 번호에 V체크/밑줄 → 답 있음

## 답 없음 판정
- ( ) 괄호가 비어있으면 → 답 없음!
- 풀이만 끄적이고 괄호/보기에 표시 안 했으면 → 답 없음!
- 위 기준에 해당 안 되면 → 답 없음!

JSON만:
{"answered":["0001","0002"]}`;

// STEP 2: Read answers from specific locations
const GRADE_PROMPT = (answers) => `학생이 답을 쓴 문제들이야. 답을 읽고 채점해줘.

정답:
${answers}

# 답을 읽는 위치 (여기만 봐!)

## 주관식
→ ( ) 괄호 안에 쓴 글씨를 읽어
→ 동그라미 안에 쓴 글씨를 읽어
→ 괄호/동그라미 바깥의 풀이 과정은 무시!

## 객관식
→ ( ) 괄호 안에 쓴 번호를 읽어
→ 또는 ①②③④⑤ 중 동그라미/V 표시된 번호를 읽어

# 비교
- "유" = "유한소수", "무" = "무한소수", "순" = "순환소수"
- 0.5 = 1/2, ② = 2번, 복수답 순서 무관

JSON만:
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
    // Parse answer lines to get problem numbers
    const lines = answers.split('\n').filter(l => l.trim());
    const allNums = lines.map(l => l.match(/^(\d+)번/)?.[1]).filter(Boolean);

    // STEP 1: Detect which problems have handwriting
    const detectTxt = await callGPT(apiKey, imageList, DETECT_PROMPT(allNums.join(', ')));
    const detected = parseJSON(detectTxt);
    const answeredSet = new Set(detected.answered || []);

    // STEP 2: Grade only answered problems
    const answeredLines = lines.filter(l => {
      const n = l.match(/^(\d+)번/)?.[1];
      return n && answeredSet.has(n);
    });

    let gradeResults = [];

    if (answeredLines.length > 0) {
      const gradeTxt = await callGPT(apiKey, imageList, GRADE_PROMPT(answeredLines.join('\n')));
      const graded = parseJSON(gradeTxt);
      gradeResults = graded.results || [];
    }

    // Build final results: answered ones get graded, rest = 미풀이
    const gradedMap = {};
    gradeResults.forEach(r => { gradedMap[r.num] = r; });

    const finalResults = allNums.map(num => {
      if (gradedMap[num]) return gradedMap[num];
      const line = lines.find(l => l.startsWith(num + '번'));
      const correct = line ? line.split(': ').slice(1).join(': ') : '';
      return { num, correct, student: '미풀이', ok: false };
    });

    return res.status(200).json({ results: finalResults });
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('Incorrect API key')) return res.status(401).json({ error: 'API 키가 올바르지 않습니다.' });
    if (msg.includes('insufficient_quota')) return res.status(402).json({ error: 'OpenAI 크레딧이 부족합니다.' });
    return res.status(500).json({ error: msg });
  }
}
