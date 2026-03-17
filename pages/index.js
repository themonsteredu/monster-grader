import { useState, useRef, useEffect } from "react";
import Head from "next/head";

// ═══ ANSWER DB ═══
const SSEN = {
  name: "쎈수학 중2-1",
  sections: [{
    id: "01", title: "유리수와 소수",
    answers: [
      {n:"0001",a:"0.25, 유한소수"},{n:"0002",a:"0.666…, 무한소수"},{n:"0003",a:"-1.2, 유한소수"},
      {n:"0004",a:"0.58333…, 무한소수"},{n:"0005",a:"-0.363636…, 무한소수"},{n:"0006",a:"0.3125, 유한소수"},
      {n:"0007",a:"○"},{n:"0008",a:"×"},{n:"0009",a:"×"},{n:"0010",a:"×"},
      {n:"0011",a:"○"},{n:"0012",a:"×"},
      {n:"0013",a:"7, 0.7̄"},{n:"0014",a:"90, 0.9̄0̄"},{n:"0015",a:"3, 0.4̄3̄"},{n:"0016",a:"740, -0.7̄4̄0̄"},
      {n:"0017",a:"(가)5³ (나)5³ (다)1000 (라)0.125"},
      {n:"0018",a:"(가)5 (나)5 (다)5² (라)15"},
      {n:"0019",a:"(가)2² (나)2² (다)1000 (라)0.036"},
      {n:"0020",a:"순"},{n:"0021",a:"유"},{n:"0022",a:"순"},{n:"0023",a:"유"},
      {n:"0024",a:"유"},{n:"0025",a:"순"},{n:"0026",a:"순"},
      {n:"0027",a:"(가)10 (나)9 (다)8"},{n:"0028",a:"(가)100 (나)99 (다)16"},
      {n:"0029",a:"(가)1000 (나)999 (다)111"},{n:"0030",a:"(가)10 (나)90 (다)45"},
      {n:"0031",a:"(가)10 (나)990 (다)26"},
      {n:"0032",a:"4/11"},{n:"0033",a:"26/9"},{n:"0034",a:"58/165"},{n:"0035",a:"-46/45"},
      {n:"0036",a:"○"},{n:"0037",a:"○"},{n:"0038",a:"×"},{n:"0039",a:"○"},
      {n:"0040",a:"×"},{n:"0041",a:"○"},{n:"0042",a:"○"},{n:"0043",a:"×"},{n:"0044",a:"○"},
      {n:"0045",a:"×"},{n:"0046",a:"②"},{n:"0047",a:"3"},{n:"0048",a:"②, ③"},
      {n:"0049",a:"③"},{n:"0050",a:"③"},{n:"0051",a:"5"},{n:"0052",a:"⑤"},
      {n:"0053",a:"3"},{n:"0054",a:"①, ④"},{n:"0055",a:"②"},
      {n:"0056",a:"③"},{n:"0057",a:"72"},{n:"0058",a:"2"},{n:"0059",a:"④"},{n:"0060",a:"③"},
      {n:"0061",a:"181"},{n:"0062",a:"③"},{n:"0063",a:"②, ④"},{n:"0064",a:"121"},
      {n:"0065",a:"91"},{n:"0066",a:"①, ⑤"},{n:"0067",a:"(ㄴ), (ㄹ), (ㅁ)"},
      {n:"0068",a:"①"},{n:"0069",a:"1"},{n:"0070",a:"②"},{n:"0071",a:"③"},
      {n:"0072",a:"④"},{n:"0073",a:"3"},{n:"0074",a:"94"},{n:"0075",a:"143"},
      {n:"0076",a:"③"},{n:"0077",a:"④"},{n:"0078",a:"57"},{n:"0079",a:"②"},
      {n:"0080",a:"31"},{n:"0081",a:"119"},{n:"0082",a:"③"},{n:"0083",a:"③, ⑤"},
      {n:"0084",a:"②, ④"},{n:"0085",a:"⑤"},{n:"0086",a:"세영, 강욱"},
      {n:"0087",a:"②"},{n:"0088",a:"(ㄱ), (ㄴ)"},{n:"0089",a:"④"},
      {n:"0090",a:"②, ④"},{n:"0091",a:"⑤"},{n:"0092",a:"1.2̄"},
      {n:"0093",a:"④"},{n:"0094",a:"②"},{n:"0095",a:"④"},
      {n:"0096",a:"④"},{n:"0097",a:"81.8̄1̄"},{n:"0098",a:"①"},
      {n:"0099",a:"13"},{n:"0100",a:"2.291̄6̄"},{n:"0101",a:"③"},
      {n:"0102",a:"③"},{n:"0103",a:"②"},{n:"0104",a:"x=7"},{n:"0105",a:"3"},
      {n:"0106",a:"⑤"},{n:"0107",a:"9"},{n:"0108",a:"②, ④"},{n:"0109",a:"4"},
      {n:"0110",a:"④, ⑤"},{n:"0111",a:"⑤"},{n:"0112",a:"④"},{n:"0113",a:"②"},
      {n:"0114",a:"①"},{n:"0115",a:"(다)"},
      {n:"0116",a:"14"},{n:"0117",a:"9"},{n:"0118",a:"89"},
      {n:"0119",a:"④"},{n:"0120",a:"③"},{n:"0121",a:"8257/9999"},
      {n:"0122",a:"③"},{n:"0123",a:"④"},{n:"0124",a:"132"},
      {n:"0125",a:"449"},{n:"0126",a:"풀이참조"},{n:"0127",a:"1, 4, 7"},
      {n:"0128",a:"23"},{n:"0129",a:"30"},
    ]
  }]
};

// ═══ Utils ═══
function shrink(file, maxW = 1600, q = 0.85) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        const url = c.toDataURL("image/jpeg", q);
        res({ base64: url.split(",")[1], preview: url, kb: Math.round(url.length * .75 / 1024) });
      };
      img.onerror = () => rej(new Error("이미지 오류"));
      img.src = e.target.result;
    };
    r.readAsDataURL(file);
  });
}

function loadStorage(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function saveStorage(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ═══ Styles ═══
const S = {
  font: `'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif`,
  ink: "#1a1a2e", sub: "#6b7084", line: "#eaedf3", bg: "#f7f8fc", card: "#ffffff",
  accent: "#4f46e5", accentSoft: "#eef2ff",
  green: "#059669", greenSoft: "#ecfdf5",
  red: "#dc2626", redSoft: "#fef2f2",
  amber: "#d97706", amberSoft: "#fffbeb",
  radius: 14,
};

// ═══ APP ═══
export default function App() {
  const [view, setView] = useState("grade");
  const [db, setDb] = useState([]);
  const [range, setRange] = useState({ from: "", to: "" });
  const [name, setName] = useState("");
  const [imgs, setImgs] = useState([]); // [{base64, preview, kb}]
  const [grading, setGrading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("01");
  const [history, setHistory] = useState([]);
  const [historyDetail, setHistoryDetail] = useState(null);
  const fRef = useRef();

  useEffect(() => {
    const all = [];
    SSEN.sections.forEach(s => s.answers.forEach(a => all.push({ sec: s.id, n: a.n, a: a.a })));
    setDb(all);
    setHistory(loadStorage("grade-history", []));
  }, []);

  const updateHistory = (h) => { setHistory(h); saveStorage("grade-history", h); };

  const filtered = db.filter(d => {
    if (section !== "all" && d.sec !== section) return false;
    if (search) return d.n.includes(search) || d.a.includes(search);
    return true;
  });

  const gradeItems = (() => {
    if (range.from && range.to) {
      const f = parseInt(range.from), t = parseInt(range.to);
      return db.filter(d => { const n = parseInt(d.n); return n >= f && n <= t; });
    }
    return [];
  })();

  const doGrade = async () => {
    if (!imgs.length) { setError("사진을 올려주세요"); return; }
    if (!gradeItems.length) { setError("채점 범위를 입력하세요"); return; }
    setError(null); setGrading(true);
    const answers = gradeItems.map(d => `${d.n}번: ${d.a}`).join("\n");
    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: imgs.map(i => i.base64), answers }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setResults(data);
      const ok = data.results.filter(x => x.ok === true).length;
      const skip = data.results.filter(x => x.student === "미풀이").length;
      const solved = data.results.length - skip;
      const record = {
        id: Date.now().toString(), date: new Date().toISOString(),
        student: name || "이름없음", book: SSEN.name,
        range: `${range.from}~${range.to}`, total: data.results.length,
        ok, wrong: data.results.filter(x => x.ok === false && x.student !== "미풀이").length,
        skip, pct: solved > 0 ? Math.round(ok / solved * 100) : 0,
        results: data.results,
      };
      updateHistory([record, ...history].slice(0, 200));
      setView("result");
    } catch (err) {
      setError(err.message);
    }
    setGrading(false);
  };

  const score = results?.results ? (() => {
    const ok = results.results.filter(r => r.ok === true).length;
    const wrong = results.results.filter(r => r.ok === false && r.student !== "미풀이").length;
    const skip = results.results.filter(r => r.student === "미풀이").length;
    const unk = results.results.filter(r => r.ok == null).length;
    const solved = results.results.length - skip;
    return { ok, wrong, skip, unk, solved, pct: solved > 0 ? Math.round(ok / solved * 100) : 0, total: results.results.length };
  })() : null;

  const ResultDetail = ({ items, title, color, showDetail }) => {
    if (!items?.length) return null;
    return (
      <div style={{ background: S.card, borderRadius: S.radius, padding: "16px 18px", marginBottom: 10, border: `1px solid ${S.line}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 10 }}>{title} {items.length}개</div>
        {showDetail ? items.map(r => (
          <div key={r.num} style={{ display: "flex", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${S.line}`, fontSize: 13, gap: 10 }}>
            <span style={{ fontWeight: 700, minWidth: 44 }}>{r.num}</span>
            <span style={{ color: S.sub }}>정답</span><span style={{ fontWeight: 600 }}>{r.correct}</span>
            <span style={{ color: S.sub, marginLeft: "auto" }}>학생</span><span style={{ fontWeight: 600, color }}>{r.student}</span>
          </div>
        )) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {items.map(r => (
              <span key={r.num} style={{ padding: "4px 10px", borderRadius: 6, background: color === S.green ? S.greenSoft : color === S.sub ? S.bg : S.amberSoft, fontSize: 12, fontWeight: 600, color }}>{r.num}</span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>더몬스터학원 채점</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="description" content="더몬스터학원 자동 채점 시스템" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: "100dvh", background: S.bg, fontFamily: S.font, color: S.ink, WebkitFontSmoothing: "antialiased" }}>
        <style jsx global>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { height: 100%; background: ${S.bg}; -webkit-tap-highlight-color: transparent; overflow-x: hidden; }
          input { box-sizing: border-box; max-width: 100%; }
          input:focus { outline: none; border-color: ${S.accent} !important; }
          input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
          input[type=number] { -moz-appearance: textfield; }
          ::placeholder { color: #b0b5c3; }
          img { max-width: 100%; }
          @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
          .fadeUp { animation: fadeUp 0.3s ease both; }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
          button { -webkit-appearance: none; }
        `}</style>

        {/* NAV */}
        <div style={{ background: S.card, borderBottom: `1px solid ${S.line}`, position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", height: 54 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
              {/* 더몬스터 로고 */}
              <svg width="28" height="28" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
                <circle cx="50" cy="50" r="48" fill="#FF6B1A"/>
                <ellipse cx="50" cy="48" rx="26" ry="26" fill="white"/>
                <circle cx="50" cy="48" r="14" fill="#1a1a2e"/>
                <circle cx="55" cy="43" r="5" fill="white"/>
              </svg>
              <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.3px", color: S.ink }}>더몬스터</span>
            </div>
            <div style={{ display: "flex", gap: 2 }}>
              {[["grade","채점"],["history","이력"],["db","정답"]].map(([k,l]) => (
                <button key={k} onClick={() => { setView(k); setError(null); }}
                  style={{
                    padding: "6px 12px", borderRadius: 8, border: "none", fontFamily: S.font,
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    background: (view === k || (view === "result" && k === "grade") || (view === "historyDetail" && k === "history")) ? S.accentSoft : "transparent",
                    color: (view === k || (view === "result" && k === "grade") || (view === "historyDetail" && k === "history")) ? S.accent : S.sub,
                  }}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px 100px", overflow: "hidden" }}>
          {error && <div className="fadeUp" style={{ background: S.redSoft, borderRadius: 10, padding: "12px 16px", fontSize: 13, color: S.red, marginBottom: 12, fontWeight: 500, wordBreak: "break-word", overflowWrap: "anywhere" }}>{error}</div>}

          {/* GRADE */}
          {view === "grade" && (
            <div className="fadeUp">
              <div style={{ background: S.card, borderRadius: S.radius, padding: 18, marginBottom: 12, border: `1px solid ${S.line}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>채점 범위</div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input value={range.from} onChange={e => setRange(p => ({...p, from: e.target.value}))}
                    placeholder="시작" type="number"
                    style={{ flex: 1, minWidth: 0, padding: "11px 14px", border: `1.5px solid ${S.line}`, borderRadius: 10, fontSize: 14, fontFamily: S.font, fontWeight: 600 }} />
                  <span style={{ color: S.sub, flexShrink: 0 }}>~</span>
                  <input value={range.to} onChange={e => setRange(p => ({...p, to: e.target.value}))}
                    placeholder="끝" type="number"
                    style={{ flex: 1, minWidth: 0, padding: "11px 14px", border: `1.5px solid ${S.line}`, borderRadius: 10, fontSize: 14, fontFamily: S.font, fontWeight: 600 }} />
                </div>
                {gradeItems.length > 0 && <div style={{ marginTop: 10, fontSize: 13, color: S.accent, fontWeight: 600 }}>{gradeItems.length}문제</div>}
              </div>

              <div style={{ background: S.card, borderRadius: S.radius, padding: 18, marginBottom: 12, border: `1px solid ${S.line}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>숙제 사진</div>
                  {imgs.length > 0 && <div style={{ fontSize: 12, color: S.accent, fontWeight: 600 }}>{imgs.length}장</div>}
                </div>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="학생 이름"
                  style={{ width: "100%", padding: "10px 14px", border: `1.5px solid ${S.line}`, borderRadius: 10, fontSize: 13, fontFamily: S.font, marginBottom: 12 }} />
                <input ref={fRef} type="file" accept="image/*" capture="environment" multiple onChange={async e => {
                  const files = Array.from(e.target.files); if (!files.length) return; e.target.value = "";
                  try {
                    const newImgs = [];
                    for (const f of files) {
                      newImgs.push(await shrink(f));
                    }
                    setImgs(prev => [...prev, ...newImgs]);
                    setError(null);
                  } catch (err) { setError(err.message); }
                }} style={{ display: "none" }} />

                {imgs.length === 0 ? (
                  <div onClick={() => fRef.current?.click()}
                    style={{ border: `2px dashed ${S.line}`, borderRadius: 12, padding: "32px 16px", textAlign: "center", cursor: "pointer" }}>
                    <div style={{ fontSize: 28, opacity: 0.3 }}>+</div>
                    <div style={{ fontSize: 13, color: S.sub }}>사진 선택 (여러 장 가능)</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
                      {imgs.map((img, i) => (
                        <div key={i} style={{ position: "relative", flexShrink: 0 }}>
                          <img src={img.preview} style={{ width: 120, height: 160, borderRadius: 8, objectFit: "cover", border: `1px solid ${S.line}` }} />
                          <button onClick={() => setImgs(imgs.filter((_, j) => j !== i))} style={{
                            position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%",
                            border: "none", background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 12, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>×</button>
                          <div style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(0,0,0,0.5)", color: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 9 }}>{img.kb}KB</div>
                        </div>
                      ))}
                      {/* Add more button */}
                      <div onClick={() => fRef.current?.click()}
                        style={{ width: 120, height: 160, borderRadius: 8, border: `2px dashed ${S.line}`, flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexDirection: "column", gap: 4 }}>
                        <div style={{ fontSize: 24, opacity: 0.3 }}>+</div>
                        <div style={{ fontSize: 11, color: S.sub }}>추가</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={doGrade} disabled={grading || !imgs.length || !gradeItems.length}
                style={{
                  width: "100%", padding: 16, borderRadius: 12, border: "none",
                  background: (!imgs.length || !gradeItems.length || grading) ? S.line : S.accent,
                  color: (!imgs.length || !gradeItems.length || grading) ? S.sub : "#fff",
                  fontSize: 15, fontWeight: 700, fontFamily: S.font, cursor: grading ? "wait" : "pointer",
                }}>
                {grading ? "채점 중..." : `채점하기${gradeItems.length ? ` (${gradeItems.length}문제)` : ""}`}
              </button>
              {grading && <div style={{ textAlign: "center", marginTop: 16 }}><div style={{ display: "inline-flex", gap: 4 }}>{[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: S.accent, animation: `pulse 1.2s ease ${i*0.2}s infinite` }} />)}</div></div>}
            </div>
          )}

          {/* RESULT */}
          {view === "result" && score && results && (
            <div className="fadeUp">
              <div style={{ background: S.card, borderRadius: S.radius, padding: "28px 22px", marginBottom: 14, border: `1px solid ${S.line}`, textAlign: "center" }}>
                {name && <div style={{ fontSize: 13, color: S.sub, marginBottom: 8 }}>{name}</div>}
                <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: "-3px", color: score.pct >= 80 ? S.green : score.pct >= 50 ? S.amber : S.red, lineHeight: 1 }}>{score.pct}</div>
                <div style={{ fontSize: 13, color: S.sub, marginTop: 6 }}>{score.solved}문제 중 {score.ok}개 정답</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 16 }}>
                  {[[score.ok,"정답",S.green],[score.wrong,"오답",S.red],[score.skip,"미풀이",S.sub],...(score.unk>0?[[score.unk,"판독불가",S.amber]]:[])].map(([v,l,c])=>(
                    <div key={l} style={{ textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 700, color: c }}>{v}</div><div style={{ fontSize: 11, color: S.sub, marginTop: 2 }}>{l}</div></div>
                  ))}
                </div>
              </div>
              <ResultDetail items={results.results.filter(r => r.ok === false && r.student !== "미풀이")} title="오답" color={S.red} showDetail />
              <ResultDetail items={results.results.filter(r => r.ok === true)} title="정답" color={S.green} />
              <ResultDetail items={results.results.filter(r => r.student === "미풀이")} title="미풀이" color={S.sub} />
              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <button onClick={() => setView("history")} style={{ flex: 1, padding: 13, borderRadius: 10, border: `1.5px solid ${S.line}`, background: S.card, color: S.sub, fontSize: 13, fontWeight: 600, fontFamily: S.font, cursor: "pointer" }}>이력</button>
                <button onClick={() => { setImgs([]); setResults(null); setName(""); setView("grade"); }}
                  style={{ flex: 2, padding: 13, borderRadius: 10, border: "none", background: S.accent, color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: S.font, cursor: "pointer" }}>다음 학생</button>
              </div>
            </div>
          )}

          {/* HISTORY */}
          {view === "history" && (
            <div className="fadeUp">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>채점 이력</div>
                {history.length > 0 && <button onClick={() => { if(confirm("전체 삭제?")) updateHistory([]); }} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${S.line}`, background: "transparent", fontSize: 11, color: S.sub, cursor: "pointer", fontFamily: S.font }}>전체 삭제</button>}
              </div>
              {history.length === 0 ? (
                <div style={{ background: S.card, borderRadius: S.radius, padding: "40px 20px", textAlign: "center", border: `1px solid ${S.line}` }}><div style={{ fontSize: 13, color: S.sub }}>아직 채점 이력이 없어요</div></div>
              ) : (() => {
                const groups = {};
                history.forEach(h => { const d = new Date(h.date); const k = `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`; if (!groups[k]) groups[k]=[]; groups[k].push(h); });
                return Object.entries(groups).map(([date, items]) => (
                  <div key={date} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: S.sub, marginBottom: 8 }}>{date}</div>
                    <div style={{ background: S.card, borderRadius: S.radius, border: `1px solid ${S.line}`, overflow: "hidden" }}>
                      {items.map((h, i) => {
                        const t = new Date(h.date);
                        return (
                          <div key={h.id} onClick={() => { setHistoryDetail(h); setView("historyDetail"); }}
                            style={{ display: "flex", alignItems: "center", padding: "14px 18px", cursor: "pointer", borderBottom: i < items.length-1 ? `1px solid ${S.line}` : "none" }}>
                            <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, marginRight: 14, background: h.pct >= 80 ? S.greenSoft : h.pct >= 50 ? S.amberSoft : S.redSoft, color: h.pct >= 80 ? S.green : h.pct >= 50 ? S.amber : S.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800 }}>{h.pct}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{h.student}</div>
                              <div style={{ fontSize: 11, color: S.sub }}>{h.range} · {h.ok}/{h.total-h.skip}맞음</div>
                            </div>
                            <div style={{ fontSize: 12, color: S.sub }}>{String(t.getHours()).padStart(2,"0")}:{String(t.getMinutes()).padStart(2,"0")}</div>
                            <div style={{ marginLeft: 8, color: S.sub }}>›</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}

          {/* HISTORY DETAIL */}
          {view === "historyDetail" && historyDetail && (() => {
            const h = historyDetail;
            const d = new Date(h.date);
            return (
              <div className="fadeUp">
                <button onClick={() => setView("history")} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 0", marginBottom: 10, border: "none", background: "transparent", fontSize: 13, color: S.sub, cursor: "pointer", fontFamily: S.font }}>‹ 이력 목록</button>
                <div style={{ background: S.card, borderRadius: S.radius, padding: "24px 22px", marginBottom: 14, border: `1px solid ${S.line}`, textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: S.sub, marginBottom: 4 }}>{d.getFullYear()}.{String(d.getMonth()+1).padStart(2,"0")}.{String(d.getDate()).padStart(2,"0")} {String(d.getHours()).padStart(2,"0")}:{String(d.getMinutes()).padStart(2,"0")}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>{h.student}</div>
                  <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-3px", color: h.pct >= 80 ? S.green : h.pct >= 50 ? S.amber : S.red, lineHeight: 1 }}>{h.pct}</div>
                  <div style={{ fontSize: 12, color: S.sub, marginTop: 6 }}>{h.book} · {h.range}</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 14 }}>
                    {[[h.ok,"정답",S.green],[h.wrong,"오답",S.red],[h.skip,"미풀이",S.sub]].map(([v,l,c])=>(<div key={l} style={{ textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div><div style={{ fontSize: 11, color: S.sub }}>{l}</div></div>))}
                  </div>
                </div>
                <ResultDetail items={h.results.filter(r => r.ok === false && r.student !== "미풀이")} title="오답" color={S.red} showDetail />
                <ResultDetail items={h.results.filter(r => r.ok === true)} title="정답" color={S.green} />
                <ResultDetail items={h.results.filter(r => r.student === "미풀이")} title="미풀이" color={S.sub} />
                <button onClick={() => { updateHistory(history.filter(x => x.id !== h.id)); setView("history"); }}
                  style={{ width: "100%", padding: 12, borderRadius: 10, border: `1.5px solid ${S.line}`, background: "transparent", color: S.sub, fontSize: 13, fontFamily: S.font, cursor: "pointer", marginTop: 6 }}>이 기록 삭제</button>
              </div>
            );
          })()}

          {/* DB */}
          {view === "db" && (
            <div className="fadeUp">
              <div style={{ background: S.card, borderRadius: S.radius, padding: "16px 18px", marginBottom: 12, border: `1px solid ${S.line}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{SSEN.name}</div>
                  <div style={{ fontSize: 12, color: S.sub }}>{filtered.length}문제</div>
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
                  <button onClick={() => setSection("all")} style={{ padding: "5px 12px", borderRadius: 6, border: section === "all" ? `1.5px solid ${S.accent}` : `1px solid ${S.line}`, background: section === "all" ? S.accentSoft : "transparent", color: section === "all" ? S.accent : S.sub, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: S.font }}>전체</button>
                  {SSEN.sections.map(s => (
                    <button key={s.id} onClick={() => setSection(s.id)} style={{ padding: "5px 12px", borderRadius: 6, border: section === s.id ? `1.5px solid ${S.accent}` : `1px solid ${S.line}`, background: section === s.id ? S.accentSoft : "transparent", color: section === s.id ? S.accent : S.sub, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: S.font }}>{s.title}</button>
                  ))}
                </div>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="번호 또는 답 검색"
                  style={{ width: "100%", padding: "10px 14px", border: `1.5px solid ${S.line}`, borderRadius: 10, fontSize: 13, fontFamily: S.font }} />
              </div>
              <div style={{ background: S.card, borderRadius: S.radius, border: `1px solid ${S.line}`, overflow: "hidden" }}>
                <div style={{ maxHeight: 400, overflowY: "auto" }}>
                  {filtered.map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderBottom: i < filtered.length-1 ? `1px solid ${S.line}` : "none", fontSize: 13 }}>
                      <span style={{ fontWeight: 700, color: S.accent, minWidth: 44 }}>{d.n}</span>
                      <span style={{ flex: 1 }}>{d.a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
