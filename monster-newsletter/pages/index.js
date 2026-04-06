import { useState, useRef } from "react";
import Head from "next/head";

// ═══ Styles (monster-grader 디자인 시스템) ═══
const S = {
  font: `'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif`,
  ink: "#1a1a2e", sub: "#6b7084", line: "#eaedf3", bg: "#f7f8fc", card: "#ffffff",
  accent: "#4f46e5", accentSoft: "#eef2ff",
  green: "#059669", greenSoft: "#ecfdf5",
  red: "#dc2626", redSoft: "#fef2f2",
  amber: "#d97706", amberSoft: "#fffbeb",
  radius: 14,
};

// ═══ 기본 섹션 템플릿 ═══
const DEFAULT_SECTIONS = [
  { id: "intro", title: "인사말", placeholder: "이번 달 학원 소식을 전합니다...", content: "" },
  { id: "schedule", title: "주요 일정", placeholder: "• 4/15 중간고사 대비반 개강\n• 4/20 학부모 상담 주간\n• 4/30 모의고사", content: "" },
  { id: "achievement", title: "우리 학생 성과", placeholder: "• 김OO 수학 100점\n• 이OO 전교 1등", content: "" },
  { id: "notice", title: "공지사항", placeholder: "여름방학 특강 신청이 시작되었습니다...", content: "" },
  { id: "closing", title: "마무리", placeholder: "항상 더몬스터학원을 믿어주셔서 감사합니다.", content: "" },
];

// ═══ APP ═══
export default function App() {
  const [view, setView] = useState("edit"); // edit | preview | ai
  const [title, setTitle] = useState("");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
  });
  const [sections, setSections] = useState(DEFAULT_SECTIONS.map(s => ({ ...s })));
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTarget, setAiTarget] = useState("all");
  const printRef = useRef();

  // 섹션 내용 업데이트
  const updateSection = (id, content) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, content } : s));
  };

  // 섹션 추가
  const addSection = () => {
    const id = "custom_" + Date.now();
    setSections(prev => [...prev, { id, title: "새 섹션", placeholder: "내용을 입력하세요...", content: "" }]);
  };

  // 섹션 삭제
  const removeSection = (id) => {
    setSections(prev => prev.filter(s => s.id !== id));
  };

  // 섹션 제목 변경
  const updateSectionTitle = (id, newTitle) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  // 섹션 순서 이동
  const moveSection = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const arr = [...sections];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setSections(arr);
  };

  // AI 소식지 생성
  const generateWithAI = async () => {
    if (!aiPrompt.trim()) { setError("AI에게 전달할 내용을 입력해주세요"); return; }
    setError(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          month,
          title: title || `더몬스터학원 ${month} 소식지`,
          sections: sections.map(s => ({ id: s.id, title: s.title, content: s.content })),
          target: aiTarget,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.title) setTitle(data.title);
      if (data.sections) {
        setSections(prev => {
          if (aiTarget === "all") {
            return data.sections.map(ds => ({
              id: ds.id || "custom_" + Date.now() + Math.random(),
              title: ds.title,
              placeholder: "",
              content: ds.content,
            }));
          }
          return prev.map(s => {
            const match = data.sections.find(ds => ds.id === s.id);
            return match ? { ...s, content: match.content } : s;
          });
        });
      }
      setView("edit");
    } catch (err) {
      setError(err.message);
    }
    setGenerating(false);
  };

  // 인쇄 / PDF
  const handlePrint = () => {
    window.print();
  };

  // HTML 복사 (이메일용)
  const copyAsHTML = () => {
    const el = printRef.current;
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand("copy");
    sel.removeAllRanges();
    alert("복사되었습니다! 이메일에 붙여넣기 하세요.");
  };

  const filledSections = sections.filter(s => s.content.trim());
  const displayTitle = title || `더몬스터학원 ${month} 소식지`;

  return (
    <>
      <Head>
        <title>더몬스터 소식지</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="description" content="더몬스터학원 소식지 생성기" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: "100dvh", background: S.bg, fontFamily: S.font, color: S.ink, WebkitFontSmoothing: "antialiased" }}>
        <style jsx global>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { height: 100%; background: ${S.bg}; -webkit-tap-highlight-color: transparent; overflow-x: hidden; }
          input, textarea { box-sizing: border-box; max-width: 100%; }
          input:focus, textarea:focus { outline: none; border-color: ${S.accent} !important; }
          ::placeholder { color: #b0b5c3; }
          @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
          .fadeUp { animation: fadeUp 0.3s ease both; }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
          button { -webkit-appearance: none; }
          @media print {
            body { background: white !important; }
            .no-print { display: none !important; }
            .print-area { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 24px !important; }
          }
        `}</style>

        {/* NAV */}
        <div className="no-print" style={{ background: S.card, borderBottom: `1px solid ${S.line}`, position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", height: 54 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
              <svg width="28" height="28" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
                <circle cx="50" cy="50" r="48" fill="#FF6B1A"/>
                <ellipse cx="50" cy="48" rx="26" ry="26" fill="white"/>
                <circle cx="50" cy="48" r="14" fill="#1a1a2e"/>
                <circle cx="55" cy="43" r="5" fill="white"/>
              </svg>
              <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.3px", color: S.ink }}>더몬스터 소식지</span>
            </div>
            <div style={{ display: "flex", gap: 2 }}>
              {[["edit","편집"],["ai","AI 작성"],["preview","미리보기"]].map(([k,l]) => (
                <button key={k} onClick={() => { setView(k); setError(null); }}
                  style={{
                    padding: "6px 12px", borderRadius: 8, border: "none", fontFamily: S.font,
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    background: view === k ? S.accentSoft : "transparent",
                    color: view === k ? S.accent : S.sub,
                  }}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px 100px" }}>
          {error && <div className="no-print fadeUp" style={{ background: S.redSoft, borderRadius: 10, padding: "12px 16px", fontSize: 13, color: S.red, marginBottom: 12, fontWeight: 500, wordBreak: "break-word" }}>{error}</div>}

          {/* ═══ EDIT VIEW ═══ */}
          {view === "edit" && (
            <div className="fadeUp">
              {/* 기본 정보 */}
              <div style={{ background: S.card, borderRadius: S.radius, padding: 18, marginBottom: 12, border: `1px solid ${S.line}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>기본 정보</div>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <input value={month} onChange={e => setMonth(e.target.value)} placeholder="2026년 4월"
                    style={{ width: 120, padding: "11px 14px", border: `1.5px solid ${S.line}`, borderRadius: 10, fontSize: 14, fontFamily: S.font, fontWeight: 600 }} />
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder={`더몬스터학원 ${month} 소식지`}
                    style={{ flex: 1, minWidth: 0, padding: "11px 14px", border: `1.5px solid ${S.line}`, borderRadius: 10, fontSize: 14, fontFamily: S.font, fontWeight: 600 }} />
                </div>
              </div>

              {/* 섹션 편집 */}
              {sections.map((s, idx) => (
                <div key={s.id} style={{ background: S.card, borderRadius: S.radius, padding: 18, marginBottom: 12, border: `1px solid ${S.line}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <input value={s.title} onChange={e => updateSectionTitle(s.id, e.target.value)}
                      style={{ flex: 1, minWidth: 0, padding: "6px 10px", border: `1.5px solid ${S.line}`, borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: S.font }} />
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => moveSection(idx, -1)} disabled={idx === 0}
                        style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${S.line}`, background: "transparent", fontSize: 12, cursor: "pointer", color: idx === 0 ? S.line : S.sub, display: "flex", alignItems: "center", justifyContent: "center" }}>↑</button>
                      <button onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1}
                        style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${S.line}`, background: "transparent", fontSize: 12, cursor: "pointer", color: idx === sections.length - 1 ? S.line : S.sub, display: "flex", alignItems: "center", justifyContent: "center" }}>↓</button>
                      <button onClick={() => removeSection(s.id)}
                        style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${S.line}`, background: "transparent", fontSize: 12, cursor: "pointer", color: S.red, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                    </div>
                  </div>
                  <textarea value={s.content} onChange={e => updateSection(s.id, e.target.value)}
                    placeholder={s.placeholder} rows={4}
                    style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${S.line}`, borderRadius: 10, fontSize: 13, fontFamily: S.font, lineHeight: 1.6, resize: "vertical" }} />
                </div>
              ))}

              {/* 섹션 추가 */}
              <button onClick={addSection}
                style={{ width: "100%", padding: 14, borderRadius: 12, border: `2px dashed ${S.line}`, background: "transparent", color: S.sub, fontSize: 13, fontWeight: 600, fontFamily: S.font, cursor: "pointer", marginBottom: 12 }}>
                + 섹션 추가
              </button>

              {/* 미리보기 버튼 */}
              <button onClick={() => setView("preview")}
                disabled={filledSections.length === 0}
                style={{
                  width: "100%", padding: 16, borderRadius: 12, border: "none",
                  background: filledSections.length === 0 ? S.line : S.accent,
                  color: filledSections.length === 0 ? S.sub : "#fff",
                  fontSize: 15, fontWeight: 700, fontFamily: S.font, cursor: "pointer",
                }}>
                미리보기 ({filledSections.length}개 섹션)
              </button>
            </div>
          )}

          {/* ═══ AI VIEW ═══ */}
          {view === "ai" && (
            <div className="fadeUp">
              <div style={{ background: S.card, borderRadius: S.radius, padding: 18, marginBottom: 12, border: `1px solid ${S.line}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>AI 소식지 작성</div>
                <div style={{ fontSize: 12, color: S.sub, marginBottom: 14, lineHeight: 1.5 }}>
                  키워드나 간단한 설명을 입력하면 AI가 소식지 내용을 작성해줍니다.
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: S.sub, marginBottom: 6 }}>작성 범위</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={() => setAiTarget("all")}
                      style={{ padding: "6px 14px", borderRadius: 8, border: aiTarget === "all" ? `1.5px solid ${S.accent}` : `1px solid ${S.line}`, background: aiTarget === "all" ? S.accentSoft : "transparent", color: aiTarget === "all" ? S.accent : S.sub, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: S.font }}>
                      전체 새로 작성
                    </button>
                    {sections.map(s => (
                      <button key={s.id} onClick={() => setAiTarget(s.id)}
                        style={{ padding: "6px 14px", borderRadius: 8, border: aiTarget === s.id ? `1.5px solid ${S.accent}` : `1px solid ${S.line}`, background: aiTarget === s.id ? S.accentSoft : "transparent", color: aiTarget === s.id ? S.accent : S.sub, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: S.font }}>
                        {s.title}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                  placeholder={"예시:\n• 4월 중간고사 대비 특강 안내, 수학경시대회 수상 소식\n• 여름방학 캠프 모집, 학부모 간담회 일정\n• 지난달 모의고사 성적 우수자 발표"}
                  rows={6}
                  style={{ width: "100%", padding: "14px", border: `1.5px solid ${S.line}`, borderRadius: 10, fontSize: 13, fontFamily: S.font, lineHeight: 1.6, resize: "vertical", marginBottom: 12 }} />

                <button onClick={generateWithAI} disabled={generating || !aiPrompt.trim()}
                  style={{
                    width: "100%", padding: 16, borderRadius: 12, border: "none",
                    background: (!aiPrompt.trim() || generating) ? S.line : S.accent,
                    color: (!aiPrompt.trim() || generating) ? S.sub : "#fff",
                    fontSize: 15, fontWeight: 700, fontFamily: S.font, cursor: generating ? "wait" : "pointer",
                  }}>
                  {generating ? "AI 작성 중..." : "AI로 작성하기"}
                </button>
                {generating && <div style={{ textAlign: "center", marginTop: 16 }}><div style={{ display: "inline-flex", gap: 4 }}>{[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: S.accent, animation: `pulse 1.2s ease ${i*0.2}s infinite` }} />)}</div></div>}
              </div>
            </div>
          )}

          {/* ═══ PREVIEW VIEW ═══ */}
          {view === "preview" && (
            <div className="fadeUp">
              {/* 액션 버튼 */}
              <div className="no-print" style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <button onClick={() => setView("edit")}
                  style={{ padding: "10px 18px", borderRadius: 10, border: `1.5px solid ${S.line}`, background: "transparent", color: S.sub, fontSize: 13, fontWeight: 600, fontFamily: S.font, cursor: "pointer" }}>
                  ← 편집
                </button>
                <button onClick={copyAsHTML}
                  style={{ flex: 1, padding: "10px 18px", borderRadius: 10, border: "none", background: S.green, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: S.font, cursor: "pointer" }}>
                  복사 (이메일용)
                </button>
                <button onClick={handlePrint}
                  style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: S.accent, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: S.font, cursor: "pointer" }}>
                  인쇄 / PDF
                </button>
              </div>

              {/* 소식지 본문 */}
              <div ref={printRef} className="print-area" style={{ background: S.card, borderRadius: S.radius, border: `1px solid ${S.line}`, overflow: "hidden" }}>
                {/* 헤더 */}
                <div style={{ background: "linear-gradient(135deg, #FF6B1A 0%, #FF8C42 100%)", padding: "36px 28px", textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                    <svg width="48" height="48" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="48" fill="rgba(255,255,255,0.2)"/>
                      <ellipse cx="50" cy="48" rx="26" ry="26" fill="white"/>
                      <circle cx="50" cy="48" r="14" fill="#1a1a2e"/>
                      <circle cx="55" cy="43" r="5" fill="white"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 500, marginBottom: 6 }}>{month}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1.3 }}>{displayTitle}</div>
                </div>

                {/* 섹션들 */}
                <div style={{ padding: "24px 28px 32px" }}>
                  {filledSections.map((s, idx) => (
                    <div key={s.id} style={{ marginBottom: idx < filledSections.length - 1 ? 28 : 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 4, height: 20, borderRadius: 2, background: "#FF6B1A" }} />
                        <div style={{ fontSize: 16, fontWeight: 800, color: S.ink }}>{s.title}</div>
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.8, color: "#374151", whiteSpace: "pre-wrap", paddingLeft: 14 }}>
                        {s.content}
                      </div>
                      {idx < filledSections.length - 1 && (
                        <div style={{ borderBottom: `1px solid ${S.line}`, marginTop: 24 }} />
                      )}
                    </div>
                  ))}
                </div>

                {/* 푸터 */}
                <div style={{ background: "#f9fafb", padding: "20px 28px", borderTop: `1px solid ${S.line}`, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: S.sub, lineHeight: 1.6 }}>
                    더몬스터학원 | 학원 소식지
                    <br />
                    본 소식지는 더몬스터학원에서 발행합니다.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
