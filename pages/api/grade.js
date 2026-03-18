 export const config = { api: { bodyParser: { sizeLimit: ‘20mb’ } } };

// Chain of Thought 프롬프트: 추출 → 비교 → 판정
const PROMPT = (answers) => `너는 꼼꼼한 수학 선생님이야. 학생이 쎈수학 문제집에 푼 숙제를 채점해야 해.

# 정답 데이터

${answers}

# 채점 지침

1. [답안 위치 파악] ( ) 괄호 안, (가)(나) 빈칸, 보기 객관식 번호, 서술형 풀이 영역을 먼저 찾아.
1. [손글씨 인식] 인쇄된 문제 텍스트는 무시하고, 학생이 연필이나 펜으로 직접 쓴 흔적만 ‘학생 답’으로 추출해.
1. [유연한 채점] “유”=“유한소수”, 0.5=1/2, ②=2번 등 수학적으로 완전히 동일한 의미면 정답 처리해.

# 출력 형식

반드시 아래 JSON 배열 형식으로만 대답해. (마크다운 백틱 없이 순수 JSON만)
{
“results”: [
{
“num”: “0001”,
“extracted_answer”: “이미지에서 찾아낸 학생의 손글씨 답 (없으면 null)”,
“reasoning”: “정답 데이터와 추출한 학생 답을 비교하는 논리적 과정 설명”,
“is_correct”: true
}
]
}`;

export default async function handler(req, res) {
if (req.method !== ‘POST’) return res.status(405).json({ error: ‘POST only’ });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) return res.status(500).json({ error: ‘GEMINI_API_KEY가 설정되지 않았습니다’ });

const { images, answers } = req.body;
const imageList = images || (req.body.imageBase64 ? [req.body.imageBase64] : []);
if (!imageList.length || !answers) return res.status(400).json({ error: ‘이미지와 정답이 필요합니다’ });

try {
// Build parts: images + prompt
const parts = [];
for (const img of imageList) {
parts.push({ inlineData: { mimeType: ‘image/jpeg’, data: img } });
}
parts.push({ text: PROMPT(answers) });

```
// Gemini API 호출 (JSON 모드 강제)
const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=' + apiKey;

const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts }],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json'
    }
  }),
});

const data = await response.json();

// 에러 처리
if (data.error) {
  return res.status(500).json({ error: data.error.message || 'Gemini API 오류' });
}

// 깔끔한 파싱 (JSON 모드이므로 한 줄로 끝)
const contentText = data.candidates[0].content.parts[0].text;
const parsed = JSON.parse(contentText);

// 프론트엔드 형식에 맞게 변환 (extracted_answer → student, is_correct → ok)
const results = parsed.results.map(r => ({
  num: r.num,
  correct: r.correct || '',
  student: r.extracted_answer || '오답',
  ok: r.is_correct === true,
}));

// 정답 데이터에서 correct 값 매칭
const answerLines = answers.split('\n').filter(l => l.trim());
const answerMap = {};
for (const line of answerLines) {
  const match = line.match(/^(\d+)번:\s*(.+)$/);
  if (match) answerMap[match[1]] = match[2].trim();
}

const finalResults = results.map(r => ({
  ...r,
  correct: answerMap[r.num] || r.correct,
  student: r.student === null ? '오답' : r.student,
}));

return res.status(200).json({ results: finalResults });
```

} catch (err) {
return res.status(500).json({ error: err.message || ‘알 수 없는 오류’ });
}
}
     
