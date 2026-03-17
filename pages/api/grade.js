export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

// STEP 1: Which problems have handwriting?
const DETECT_PROMPT = (nums) => `이 쎈수학 문제집 사진을 봐.

문제번호 목록: ${nums}

각 문제번호 근처에 학생이 연필/볼펜으로 직접 쓴 손글씨가 있는지만 확인해.

중요:
- 인쇄된 텍스트(깔끔한 폰트, 문제 본문, 보기, 수식)는 손글씨가 아님!
- 빈 괄호 ( )만 있으면 손글씨 없음!
- 연필 손글씨 = 흐릿하고 삐뚤하고 인쇄체와 다름

JSON만 응답:
{"answered":["0001","0002"]}

answered = 확실히 손글씨가 보이는 문제번호만. 확신 없으면 넣지 마.`;

// STEP 2: Grade only the answered ones
const GRADE_PROMPT = (answers) => `학생이 푼 문제만 채점해줘.

정답:
${answers}

사진에서 각 문제의 학생 손글씨를 읽고 정답과 비교해.

비교 규칙:
- "유" = "유한소수", "무" = "무한소수", "순" = "순환소수"  
- 0.5 = 1/2, ② = 2번
- 복수답 순서 무관

JSON만 응답:
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
