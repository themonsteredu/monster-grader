export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

// ═══ 2-Pass 프롬프트: 추출 → 비교 → 신뢰도 판정 ═══
const PROMPT = (answers) => `너는 쎈수학 문제집 채점 전문 AI야. 학생이 손으로 쓴 답안을 정확히 읽어내는 것이 가장 중요한 일이야.

# 정답 데이터
${answers}

# 채점 절차 (반드시 순서대로)

## 1단계: 문제 번호 매핑
- 이미지에서 인쇄된 문제 번호(0001, 0002 등)를 먼저 모두 찾아.
- 각 문제 번호 옆이나 아래에 있는 답안 영역을 식별해.

## 2단계: 손글씨 추출 (가장 중요!)
- 인쇄된 텍스트(문제, 보기, 지문)는 절대 학생 답으로 읽지 마.
- 학생이 연필/펜/볼펜으로 직접 쓴 흔적만 추출해.
- 손글씨 특징: 인쇄체보다 불규칙, 약간 기울어짐, 필기 흔적, 지우개 자국 가능
- 답안 위치 우선순위:
  (1) ( ) 괄호 안에 쓴 답
  (2) 객관식 번호에 동그라미/체크 표시
  (3) (가)(나)(다)(라) 빈칸에 쓴 답
  (4) 서술형 풀이 영역
  (5) 문제 옆 여백에 쓴 답
- 답을 못 찾겠으면 null로 표시해. 추측하지 마.

## 3단계: 정답 비교 (유연하게)
- 동일한 의미면 정답 처리:
  · "유" = "유한소수", "무" = "무한소수", "순" = "순환소수"
  · ② = 2번 = 2, ①③ = 1번3번 = ①, ③
  · 0.5 = 1/2 = 2분의1
  · ○ = O = 맞다 = 참, × = X = 틀리다 = 거짓
  · 분수 표기: 4/11 = 11분의4
- 하위 문제 (가)(나)(다)(라): 모든 하위 답이 맞아야 정답

## 4단계: 신뢰도 평가
각 문제에 대해 confidence를 매겨:
- "high": 손글씨가 명확히 보이고, 정답 비교도 확실
- "medium": 글씨가 약간 불확실하지만 판독 가능
- "low": 글씨가 흐리거나 모호해서 확신이 없음

# 출력 형식 (순수 JSON만, 마크다운 없이)
{
  "results": [
    {
      "num": "0001",
      "extracted_answer": "이미지에서 읽어낸 학생 답 (없으면 null)",
      "reasoning": "인쇄 텍스트와 손글씨를 어떻게 구분했고, 왜 이 답이라고 판단했는지",
      "is_correct": true,
      "confidence": "high"
    }
  ]
}`;

// ═══ 재검증 프롬프트 (low confidence 문제만) ═══
const RECHECK_PROMPT = (items) => `아래 문제들의 손글씨 답안을 다시 한번 아주 꼼꼼하게 확인해줘.
이전에 신뢰도가 낮다고 판단된 문제들이야. 이번에는 더 신중하게 봐줘.

주의사항:
- 인쇄된 텍스트는 절대 학생 답으로 읽지 마
- 손글씨만 추출해
- 이전 판단에 편향되지 말고 처음부터 다시 봐

# 재검증 대상
${items.map(i => `${i.num}번 정답: ${i.correct} / 이전 추출: ${i.extracted_answer}`).join('\n')}

# 출력 형식 (순수 JSON만)
{
  "results": [
    {
      "num": "0001",
      "extracted_answer": "다시 읽어낸 학생 답 (없으면 null)",
      "reasoning": "재확인 과정 설명",
      "is_correct": true,
      "confidence": "high"
    }
  ]
}`;

// ═══ Gemini API 호출 헬퍼 ═══
async function callGemini(apiKey, parts, temperature = 0) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=' + apiKey;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature,
        maxOutputTokens: 16384,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 8192 }
      }
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'Gemini API 오류');

  const candidate = data.candidates?.[0];
  if (!candidate?.content?.parts) {
    const reason = candidate?.finishReason || 'unknown';
    throw new Error(`Gemini 응답 없음 (finishReason: ${reason})`);
  }

  // Thinking mode: thought 파트는 { thought: true, text: "..." } 형태
  // 실제 응답 파트는 { text: "..." } (thought 속성 없음)
  const contentParts = candidate.content.parts;
  const textPart = contentParts.find(p => p.text !== undefined && !p.thought);
  if (!textPart) {
    // thinking 파트만 있을 수 있음 - fallback으로 마지막 text 파트 사용
    const lastText = [...contentParts].reverse().find(p => p.text !== undefined);
    if (!lastText) throw new Error('Gemini 응답에서 텍스트를 찾을 수 없습니다');
    return JSON.parse(lastText.text);
  }
  return JSON.parse(textPart.text);
}

// ═══ 답안 정규화 (서버사이드 비교용) ═══
function normalizeAnswer(s) {
  if (!s || s === 'null') return '';
  return String(s)
    .trim()
    .replace(/\s+/g, '')
    // 원 숫자 → 일반 숫자
    .replace(/①/g, '1').replace(/②/g, '2').replace(/③/g, '3')
    .replace(/④/g, '4').replace(/⑤/g, '5')
    // ○× 통일
    .replace(/O|o|맞다|참/g, '○')
    .replace(/X|x|틀리다|거짓/g, '×')
    // 축약형 통일
    .replace(/유한소수/g, '유').replace(/무한소수/g, '무').replace(/순환소수/g, '순')
    // 번 제거
    .replace(/번/g, '')
    .toLowerCase();
}

// ═══ 서버사이드 정답 검증 (AI 결과 보정) ═══
function verifyAnswer(studentRaw, correctRaw) {
  const student = normalizeAnswer(studentRaw);
  const correct = normalizeAnswer(correctRaw);
  if (!student) return null; // 답 없음 → AI 판단 유지
  if (student === correct) return true;
  // 쉼표 구분 답안 (순서 무관 비교)
  const sParts = student.split(',').map(s => s.trim()).sort();
  const cParts = correct.split(',').map(s => s.trim()).sort();
  if (sParts.length === cParts.length && sParts.every((v, i) => v === cParts[i])) return true;
  return null; // 확실하지 않으면 AI 판단 유지
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다' });

  const { images, answers } = req.body;
  const imageList = images || (req.body.imageBase64 ? [req.body.imageBase64] : []);
  if (!imageList.length || !answers) return res.status(400).json({ error: '이미지와 정답이 필요합니다' });

  try {
    // 정답 맵 구축
    const answerLines = answers.split('\n').filter(l => l.trim());
    const answerMap = {};
    for (const line of answerLines) {
      const match = line.match(/^(\d+)번:\s*(.+)$/);
      if (match) answerMap[match[1]] = match[2].trim();
    }

    // ═══ 1차 채점 ═══
    const imageParts = imageList.map(img => ({
      inlineData: { mimeType: 'image/jpeg', data: img }
    }));
    const parts1 = [...imageParts, { text: PROMPT(answers) }];
    const parsed = await callGemini(apiKey, parts1);

    // 결과 변환 + 서버사이드 검증
    let results = parsed.results.map(r => {
      const correct = answerMap[r.num] || '';
      const serverVerify = verifyAnswer(r.extracted_answer, correct);
      return {
        num: r.num,
        correct,
        student: r.extracted_answer || null,
        ok: serverVerify !== null ? serverVerify : (r.is_correct === true),
        confidence: r.confidence || 'medium',
        reasoning: r.reasoning || '',
      };
    });

    // ═══ 2차 재검증 (low confidence 문제만) ═══
    const lowConfidence = results.filter(r => r.confidence === 'low');
    if (lowConfidence.length > 0 && lowConfidence.length <= 20) {
      const recheckItems = lowConfidence.map(r => ({
        num: r.num,
        correct: r.correct,
        extracted_answer: r.student,
      }));
      const parts2 = [...imageParts, { text: RECHECK_PROMPT(recheckItems) }];
      try {
        const recheck = await callGemini(apiKey, parts2, 0.1);
        // 재검증 결과 병합
        const recheckMap = {};
        for (const r of recheck.results) {
          recheckMap[r.num] = r;
        }
        results = results.map(r => {
          if (r.confidence !== 'low' || !recheckMap[r.num]) return r;
          const rc = recheckMap[r.num];
          const serverVerify = verifyAnswer(rc.extracted_answer, r.correct);
          return {
            ...r,
            student: rc.extracted_answer || r.student,
            ok: serverVerify !== null ? serverVerify : (rc.is_correct === true),
            confidence: rc.confidence === 'low' ? 'low' : 'medium',
            reasoning: rc.reasoning || r.reasoning,
            rechecked: true,
          };
        });
      } catch (e) {
        // 재검증 실패해도 1차 결과는 유지
        console.error('Recheck failed:', e.message);
      }
    }

    // student null → 표시용 텍스트
    const finalResults = results.map(r => ({
      ...r,
      student: r.student === null ? '미작성' : r.student,
    }));

    return res.status(200).json({ results: finalResults });
  } catch (err) {
    return res.status(500).json({ error: err.message || '알 수 없는 오류' });
  }
}
