import { useState, useEffect, useRef } from "react";

// ── Persistence ───────────────────────────────────────────────────────────────
const STORAGE_KEY = "lucid-app-state-v1";

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// ── Tokens ────────────────────────────────────────────────────────────────────
const cl = {
  bg: "#060d08", s1: "#0c1810", s2: "#111e15",
  border: "#1a2e1f", t1: "#dceae1", t2: "#6fa882", t3: "#3d6345",
  accent: "#64f048", accentFg: "#071209",
  warn: "#f4a244", red: "#f26550", blue: "#56a8ff", purple: "#b07bf5",
};
const ff = "'DM Sans', system-ui, sans-serif";
const fs = "'Cormorant Garamond', Georgia, serif";

const card  = (e = {}) => ({ background: cl.s2, border: `1px solid ${cl.border}`, borderRadius: 16, padding: "16px 18px", ...e });
const gradCard = (e = {}) => ({ ...card(), background: "linear-gradient(145deg,#162b1a,#0e1e13)", borderColor: "#235530", ...e });

// ── Static data ───────────────────────────────────────────────────────────────
const txns = [
  { m: "Gail's Bakery",    cat: "Food & Drink",  a: -4.80,   d: "Today",  i: "☕" },
  { m: "TfL",              cat: "Transport",      a: -2.90,   d: "Today",  i: "🚇" },
  { m: "Salary – Compass", cat: "Income",         a: 1850.00, d: "18 Apr", i: "💷" },
  { m: "Tesco Express",    cat: "Groceries",      a: -23.40,  d: "17 Apr", i: "🛒" },
  { m: "Monzo Flex",       cat: "Bills",          a: -45.00,  d: "17 Apr", i: "💳" },
  { m: "Deliveroo",        cat: "Food & Drink",   a: -18.90,  d: "16 Apr", i: "🍕" },
  { m: "Spotify Premium",  cat: "Subscriptions",  a: -11.99,  d: "15 Apr", i: "🎵" },
  { m: "Sainsbury's",      cat: "Groceries",      a: -31.20,  d: "14 Apr", i: "🛒" },
];
const cats = [
  { name: "Food & Drink",  amt: 312.40, lim: 350, color: cl.accent,  icon: "🍽️" },
  { name: "Transport",     amt: 98.60,  lim: 120, color: cl.blue,    icon: "🚇" },
  { name: "Groceries",     amt: 189.50, lim: 200, color: cl.purple,  icon: "🛒" },
  { name: "Subscriptions", amt: 47.98,  lim: 50,  color: cl.warn,    icon: "📱" },
  { name: "Going out",     amt: 156.80, lim: 150, color: cl.red,     icon: "🎉" },
  { name: "Self care",     amt: 88.20,  lim: 100, color: "#34d399",  icon: "✨" },
];
const creditData = {
  score: 612,
  history: [{ m:"Nov",s:580},{m:"Dec",s:591},{m:"Jan",s:598},{m:"Feb",s:605},{m:"Mar",s:609},{m:"Apr",s:612}],
  factors: [
    { name: "Payment history",      status: "good", detail: "No missed payments in 2 years" },
    { name: "Credit history length",status: "ok",   detail: "Average account age: 3.2 years" },
    { name: "Credit utilisation",   status: "bad",  detail: "55% used — aim under 30%" },
    { name: "Electoral roll",       status: "bad",  detail: "Not registered — adds up to 50 pts" },
    { name: "Hard searches",        status: "good", detail: "None in the last 6 months" },
  ],
};
const ukBanks = [
  { id:"hsbc",      name:"HSBC",         bg:"#db0011", init:"H"  },
  { id:"lloyds",    name:"Lloyds",       bg:"#006a4e", init:"L"  },
  { id:"natwest",   name:"NatWest",      bg:"#42145f", init:"N"  },
  { id:"starling",  name:"Starling",     bg:"#6935d3", init:"S"  },
  { id:"santander", name:"Santander",    bg:"#ec0000", init:"Sa" },
  { id:"halifax",   name:"Halifax",      bg:"#005eb8", init:"Ha" },
  { id:"nationwide",name:"Nationwide",   bg:"#0f5ea2", init:"Nw" },
  { id:"virgin",    name:"Virgin Money", bg:"#e10514", init:"V"  },
];
const plans = [
  { key:"free",    name:"Free",    price:"£0",    sub:"Always free",  current:true,  color:cl.t2,    features:["Payday-cycle budgeting","Smart categorisation","Savings 4.1% AER","Ask Lucid (AI chat)"] },
  { key:"plus",    name:"Plus",    price:"£4.99", sub:"per month",    current:false, color:cl.accent, highlight:true, features:["Everything in Free","Credit score monitoring","Debt Reset tool","Open Banking (all banks)","Priority support"] },
  { key:"builder", name:"Builder", price:"£7.99", sub:"per month",    current:false, color:cl.blue,   features:["Everything in Plus","Lucid Card (credit builder)","Credit boost challenges","1-to-1 financial coaching /mo"] },
];

// ── Shared components ─────────────────────────────────────────────────────────
function SpendRing({ spent, total, size = 116 }) {
  const r = 46, circ = 2 * Math.PI * r, pct = Math.min(spent / total, 1), over = spent > total;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke={cl.border} strokeWidth="7" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={over ? cl.red : cl.accent}
        strokeWidth="7" strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 50 50)" style={{ transition: "stroke-dasharray 0.6s" }} />
      <text x="50" y="46" textAnchor="middle" fill={cl.t1} fontSize="13" fontFamily={ff} fontWeight="600">£{Math.round(spent)}</text>
      <text x="50" y="60" textAnchor="middle" fill={cl.t3} fontSize="9"  fontFamily={ff}>of £{Math.round(total)}</text>
    </svg>
  );
}

function CreditDial({ score, max = 999 }) {
  const r = 48, cx = 65, cy = 65, circ = 2 * Math.PI * r;
  const arcLen = circ * (240 / 360), fill = (score / max) * arcLen;
  const col = score < 561 ? cl.red : score < 721 ? cl.warn : score < 881 ? cl.accent : "#22c55e";
  const band = score < 561 ? "Poor" : score < 721 ? "Fair" : score < 881 ? "Good" : "Excellent";
  return (
    <svg width={130} height={120} viewBox="0 0 130 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={cl.border} strokeWidth="10"
        strokeDasharray={`${arcLen} ${circ - arcLen}`} strokeLinecap="round" transform={`rotate(150 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth="10"
        strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round" transform={`rotate(150 ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray 0.9s ease" }} />
      <text x={cx} y={cy - 4}  textAnchor="middle" fill={cl.t1} fontSize="26" fontFamily={fs} fontWeight="600">{score}</text>
      <text x={cx} y={cy + 13} textAnchor="middle" fill={cl.t3} fontSize="10" fontFamily={ff}>out of {max}</text>
      <text x={cx} y={cx + 28} textAnchor="middle" fill={col}   fontSize="12" fontFamily={ff} fontWeight="600">{band}</text>
    </svg>
  );
}

function ScoreSparkline({ data }) {
  const w = 280, h = 60, pad = 8;
  const mn = Math.min(...data.map(d => d.s)) - 10, mx = Math.max(...data.map(d => d.s)) + 10;
  const toX = i => pad + (i / (data.length - 1)) * (w - pad * 2);
  const toY = s => h - pad - ((s - mn) / (mx - mn)) * (h - pad * 2);
  const pts = data.map((d, i) => `${toX(i)},${toY(d.s)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={cl.accent} strokeWidth="2" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={toX(i)} cy={toY(d.s)} r={i === data.length - 1 ? 4 : 3}
            fill={i === data.length - 1 ? cl.accent : cl.s2} stroke={cl.accent} strokeWidth="2" />
          <text x={toX(i)} y={h} textAnchor="middle" fill={cl.t3} fontSize="9" fontFamily={ff}>{d.m}</text>
        </g>
      ))}
    </svg>
  );
}

function CatBar({ name, amt, lim, color, icon }) {
  const pct = Math.min(amt / lim, 1) * 100, over = amt > lim;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: cl.t1 }}>{icon} {name}</span>
        <span style={{ fontSize: 12 }}>
          <span style={{ color: over ? cl.red : cl.t2 }}>£{amt.toFixed(2)}</span>
          <span style={{ color: cl.t3 }}> / £{lim}</span>
        </span>
      </div>
      <div style={{ height: 5, background: cl.border, borderRadius: 6, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background: over ? cl.red : color, borderRadius: 6, transition:"width 0.5s" }} />
      </div>
    </div>
  );
}

// Colour palette for category segments when the categories come from real
// imported data (no per-category colour is assigned by the extraction step).
const catPalette = [cl.accent, cl.blue, cl.purple, cl.warn, cl.red, "#34d399", "#f97316", "#818cf8", "#eab308", "#ec4899"];

function CategoryDonut({ entries, size = 140, selected, onSelect }) {
  const total = entries.reduce((s, e) => s + e.amt, 0) || 1;
  const r = 52, cx = 60, cy = 60, circ = 2 * Math.PI * r;
  const sel = entries.find(e => e.name === selected);
  const centerBig = sel ? `£${Math.round(sel.amt)}` : `£${Math.round(total)}`;
  const centerSmall = sel ? (sel.name.length > 13 ? sel.name.slice(0, 12) + "…" : sel.name) : "total spend";
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={cl.border} strokeWidth="14" />
      {entries.map((e, i) => {
        const dash = (e.amt / total) * circ;
        const isSel = e.name === selected;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={e.color}
            strokeWidth={isSel ? 18 : 14}
            strokeOpacity={selected && !isSel ? 0.35 : 1}
            strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: "stroke-width 0.2s, stroke-opacity 0.2s", cursor: onSelect ? "pointer" : "default" }}
            onClick={onSelect ? () => onSelect(isSel ? null : e.name) : undefined} />
        );
        offset += dash;
        return el;
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fill={cl.t1} fontSize={sel ? 14 : 16} fontFamily={ff} fontWeight="600">{centerBig}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={cl.t3} fontSize="9" fontFamily={ff}>{centerSmall}</text>
    </svg>
  );
}

function CategoryLegend({ entries, selected, onSelect }) {
  const total = entries.reduce((s, e) => s + e.amt, 0) || 1;
  return (
    <div>
      {entries.map(e => {
        const isSel = e.name === selected;
        const pct = Math.round((e.amt / total) * 100);
        return (
          <div key={e.name} onClick={() => onSelect(isSel ? null : e.name)}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 8px", borderRadius:8, cursor:"pointer", background: isSel ? `${e.color}18` : "transparent" }}>
            <span style={{ width:9, height:9, borderRadius:"50%", background:e.color, flexShrink:0 }} />
            <span style={{ flex:1, fontSize:12, color: isSel ? cl.t1 : cl.t2, fontWeight: isSel ? 600 : 400 }}>{e.name}</span>
            <span style={{ fontSize:12, color:cl.t1, fontWeight:600 }}>£{e.amt.toFixed(0)}</span>
            <span style={{ fontSize:11, color:cl.t3, width:32, textAlign:"right" }}>{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

function SpendTrendChart({ data, selectedIdx, onSelect }) {
  const w = 290, drawH = 70, topPad = 18, botPad = 16, gap = 10;
  const h = drawH + topPad + botPad;
  const max = Math.max(...data.map(d => d.amt), 1);
  const barW = (w - gap * (data.length - 1)) / data.length;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const barH = Math.max((d.amt / max) * drawH, 2);
        const x = i * (barW + gap);
        const y = topPad + (drawH - barH);
        const isSel = selectedIdx === i;
        const dimmed = selectedIdx != null && !isSel;
        return (
          <g key={i} style={{ cursor: onSelect ? "pointer" : "default" }} onClick={onSelect ? () => onSelect(isSel ? null : i) : undefined}>
            <rect x={x} y={0} width={barW} height={h} fill="transparent" />
            <text x={x + barW/2} y={topPad - 6} textAnchor="middle" fill={isSel ? cl.t1 : cl.t2} fontSize="10" fontFamily={ff} fontWeight="600">£{Math.round(d.amt)}</text>
            <rect x={x} y={y} width={barW} height={barH} fill={cl.accent} rx={4} opacity={dimmed ? 0.35 : 1} style={{ transition:"height 0.5s, y 0.5s, opacity 0.2s" }} />
            <text x={x + barW/2} y={h - 2} textAnchor="middle" fill={isSel ? cl.t1 : cl.t3} fontSize="9" fontFamily={ff} fontWeight={isSel ? 700 : 400}>{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── NEW: Instant Cancel Screen
// ─────────────────────────────────────────────────────────────────────────────
function CancelScreen({ onBack }) {
  const [step, setStep] = useState(0); // 0=confirm, 1=done
  const [reason, setReason] = useState("");

  const reasons = [
    "I don't use it enough",
    "Too expensive",
    "Switching to another app",
    "Just taking a break",
    "Something wasn't working",
    "Other",
  ];

  if (step === 1) return (
    <div style={{ padding:"0 18px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"80vh", textAlign:"center" }}>
      <div style={{ fontSize:56, marginBottom:18 }}>✅</div>
      <h2 style={{ fontFamily:fs, fontSize:30, color:cl.t1, margin:"0 0 10px" }}>You're cancelled</h2>
      <p style={{ fontSize:14, color:cl.t2, margin:"0 0 6px" }}>Plan ended immediately</p>
      <p style={{ fontSize:13, color:cl.t3, lineHeight:1.6, marginBottom:24 }}>
        A confirmation email has been sent.<br />
        No further charges will be made.<br />
        Your data is preserved — you can rejoin any time.
      </p>

      {/* What happens next */}
      <div style={{ ...card({ background:"rgba(100,240,72,0.05)", borderColor:"rgba(100,240,72,0.15)", width:"100%", textAlign:"left", marginBottom:20 }) }}>
        <p style={{ fontSize:13, fontWeight:600, color:cl.t1, margin:"0 0 10px" }}>What happens now:</p>
        {[
          { icon:"✓", text:"Cancellation confirmed — right now, not next billing cycle" },
          { icon:"✓", text:"No more charges to your payment method" },
          { icon:"✓", text:"Free features (budgeting, savings, Ask Lucid) stay active" },
          { icon:"✓", text:"Your transaction history and data are preserved" },
          { icon:"✓", text:"Rejoin any time with one tap — no re-verification needed" },
        ].map(({ icon, text }, i) => (
          <div key={i} style={{ display:"flex", gap:10, marginBottom:7, alignItems:"flex-start" }}>
            <span style={{ color:cl.accent, fontSize:13, flexShrink:0, marginTop:1 }}>{icon}</span>
            <span style={{ fontSize:13, color:cl.t2, lineHeight:1.45 }}>{text}</span>
          </div>
        ))}
      </div>

      <button onClick={onBack} style={{ width:"100%", background:"none", border:`1px solid ${cl.border}`, color:cl.t2, borderRadius:14, padding:14, fontSize:14, cursor:"pointer" }}>
        Back to home
      </button>
    </div>
  );

  return (
    <div style={{ padding:"0 18px" }}>
      <div style={{ padding:"50px 0 18px", display:"flex", alignItems:"flex-start", gap:12 }}>
        <button onClick={onBack} style={{ background:"none", border:`1px solid ${cl.border}`, color:cl.t2, borderRadius:10, padding:"6px 10px", cursor:"pointer", fontSize:14, marginTop:4, flexShrink:0 }}>←</button>
        <div>
          <p style={{ fontSize:11, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 3px" }}>Account settings</p>
          <h1 style={{ fontFamily:fs, fontSize:28, fontWeight:600, color:cl.t1, margin:0 }}>Cancel plan</h1>
        </div>
      </div>

      {/* Anti-dark-pattern guarantee */}
      <div style={{ ...card({ background:"rgba(100,240,72,0.06)", borderColor:"rgba(100,240,72,0.2)", marginBottom:16 }) }}>
        <p style={{ fontSize:13, fontWeight:600, color:cl.accent, margin:"0 0 6px" }}>Our cancellation promise</p>
        {[
          "Cancels immediately — not at end of billing period",
          "No 'are you sure?' loops or guilt-trip screens",
          "Deleting the app alone does NOT cancel — this screen does",
          "One confirmation email sent within 60 seconds",
          "Free features stay active after cancellation",
        ].map((t, i) => (
          <div key={i} style={{ display:"flex", gap:8, marginBottom:5, alignItems:"flex-start" }}>
            <span style={{ color:cl.accent, fontSize:12, flexShrink:0, marginTop:1 }}>✓</span>
            <span style={{ fontSize:12, color:cl.t2, lineHeight:1.45 }}>{t}</span>
          </div>
        ))}
      </div>

      {/* Current plan */}
      <div style={{ ...card({ marginBottom:14 }) }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <p style={{ fontSize:12, color:cl.t3, margin:"0 0 2px" }}>Current plan</p>
            <p style={{ fontSize:18, fontWeight:600, color:cl.t1, margin:"0 0 2px" }}>Free</p>
            <p style={{ fontSize:12, color:cl.t3, margin:0 }}>£0/month · no active subscription</p>
          </div>
          <span style={{ fontSize:11, background:cl.s1, color:cl.t2, padding:"4px 10px", borderRadius:20, border:`1px solid ${cl.border}` }}>Active</span>
        </div>
      </div>

      {/* Optional reason */}
      <h3 style={{ fontSize:12, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 10px" }}>
        Why are you leaving? <span style={{ textTransform:"none", letterSpacing:0 }}>(optional)</span>
      </h3>
      <div style={{ ...card({ marginBottom:14 }) }}>
        {reasons.map(r => (
          <div key={r} onClick={() => setReason(r === reason ? "" : r)} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 0", borderBottom:`1px solid ${cl.border}`, cursor:"pointer" }}>
            <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${reason === r ? cl.accent : cl.t3}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {reason === r && <div style={{ width:8, height:8, borderRadius:"50%", background:cl.accent }} />}
            </div>
            <span style={{ fontSize:13, color:reason === r ? cl.t1 : cl.t2 }}>{r}</span>
          </div>
        ))}
      </div>

      {/* What stays */}
      <div style={{ ...card({ background:cl.s1, marginBottom:18 }) }}>
        <p style={{ fontSize:12, color:cl.t3, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", margin:"0 0 8px" }}>After cancellation you keep:</p>
        {["Payday-cycle budgeting","Smart spend categorisation","Savings account (4.1% AER)","Ask Lucid AI chat","All your transaction history"].map((f, i) => (
          <div key={i} style={{ display:"flex", gap:8, marginBottom:5 }}>
            <span style={{ color:cl.t2, fontSize:12 }}>✓</span>
            <span style={{ fontSize:13, color:cl.t2 }}>{f}</span>
          </div>
        ))}
        <p style={{ fontSize:11, color:cl.t3, margin:"8px 0 0", lineHeight:1.5 }}>
          Credit monitoring pauses until you resubscribe.
        </p>
      </div>

      <button onClick={() => setStep(1)} style={{ width:"100%", background:cl.red, color:"#fff", border:"none", borderRadius:14, padding:16, fontSize:15, fontWeight:600, cursor:"pointer", marginBottom:10 }}>
        Confirm cancellation
      </button>
      <button onClick={onBack} style={{ width:"100%", background:"none", border:`1px solid ${cl.border}`, color:cl.t2, borderRadius:14, padding:14, fontSize:14, cursor:"pointer", marginBottom:24 }}>
        Keep my plan
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function LucidApp() {
  const [tab, setTab]           = useState("home");
  const [meScreen, setMeScreen] = useState("overview");
  const [showCancel, setShowCancel] = useState(false);
  // Imported bank statements, oldest first. Home/Budget show the most recent
  // one (realSummary/realTxns below); Ask Lucid gets the full combined history.
  const [statements, setStatements] = useState(() => loadPersisted().statements || []);
  const [importing, setImporting]   = useState(false);
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef(null);
  const [msgs, setMsgs] = useState(() => loadPersisted().msgs || [
    { role:"ai", text:"Hey Gabe 👋 I'm Lucid — your AI finance assistant. I can see your accounts, spending, and credit score. Ask me anything." }
  ]);
  const [inp, setInp]         = useState("");
  const [typing, setTyping]   = useState(false);
  const [autoSave, setAutoSave] = useState(() => loadPersisted().autoSave ?? false);
  const [roundUp, setRoundUp]   = useState(() => loadPersisted().roundUp ?? true);
  // Chart selection — lifted up (rather than local to BudgetScreen) so it
  // survives re-renders; screens in this app are recreated on every parent
  // render, which would otherwise reset any state defined inside them.
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState(null);
  const [connectedBanks, setConnectedBanks] = useState([
    { id:"monzo",   name:"Monzo",   bg:"#ff6b35", init:"M", accounts:[{ name:"Personal", balance:247.83 }] },
    { id:"barclays",name:"Barclays",bg:"#00aeef", init:"B", accounts:[{ name:"Savings",  balance:430.00 }] },
  ]);
  const [bankStep, setBankStep]         = useState(0);
  const [connectingBank, setConnectingBank] = useState(null);

  const latestStatement = statements.length ? statements[statements.length - 1] : null;
  const realSummary = latestStatement;
  const realTxns = latestStatement ? latestStatement.transactions : null;

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap";
    document.head.appendChild(link);
  }, []);

  // Persist what's worth keeping across reloads — imported statements, chat
  // history (capped so localStorage doesn't grow unbounded), savings toggles.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        statements,
        msgs: msgs.slice(-100),
        autoSave,
        roundUp,
      }));
    } catch {
      // storage full or unavailable (e.g. private browsing) — non-fatal
    }
  }, [statements, msgs, autoSave, roundUp]);

  // ── Gemini API — routed through /api/gemini serverless proxy ────────────────
  const sendMsg = async () => {
    if (!inp.trim()) return;
    const q = inp.trim(); setInp("");
    setMsgs(m => [...m, { role:"user", text:q }]);
    setTyping(true);

    // Combined view across every imported statement, not just the latest —
    // Gemini's context window is large enough to hold the full transaction
    // history for a personal-scale account, so there's no need for a
    // separate retrieval step here.
    const allTxns = statements.flatMap(s => s.transactions);
    const combinedCatTotals = {};
    allTxns.forEach(t => {
      if (t.amount < 0) {
        const cat = t.category || "Other";
        combinedCatTotals[cat] = (combinedCatTotals[cat] || 0) + Math.abs(t.amount);
      }
    });
    const combinedIn  = allTxns.filter(t => t.amount > 0).reduce((s,t) => s+t.amount, 0);
    const combinedOut = allTxns.filter(t => t.amount < 0).reduce((s,t) => s+Math.abs(t.amount), 0);

    // Use real imported data when available, otherwise demo figures
    const dataContext = statements.length
      ? `User data (from ${statements.length} imported statement${statements.length > 1 ? "s" : ""} — REAL data):
Most recent: ${latestStatement.accountName}, period ${latestStatement.period}, closing balance £${latestStatement.closingBalance.toFixed(2)}.
Combined across all imported statements — money in: £${combinedIn.toFixed(2)}, money out: £${combinedOut.toFixed(2)}.
Spending by category (all time): ${Object.entries(combinedCatTotals).sort((a,b) => b[1]-a[1]).map(([k,v]) => `${k} £${v.toFixed(2)}`).join(", ")}.
Full transaction history (${allTxns.length} transactions): ${allTxns.map(t => `${t.date} ${t.merchant} £${t.amount}`).join("; ")}.`
      : `User data (DEMO data, not real): Name: Gabe, Balance: £247.83 (Monzo), Savings: £430 at 4.1% AER (Barclays),
Pay cycle: 18 Apr→26 Apr (9 days left), Income: £1,850/mo, Spent: £1,102, Left: £748,
Credit score: 612/999 (Fair, Experian), Credit utilisation: 55% (target <30%), Not on electoral roll, Plan: Free tier.`;

    try {
      const res = await fetch("/api/gemini", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          max_tokens:1000,
          system:`You are Lucid, a UK-based AI financial assistant. Honest, direct, never upsell.
${dataContext}
Concise under 120 words, UK English, **bold** key figures only.`,
          messages: msgs.concat([{role:"user",text:q}])
            .map(m => ({ role: m.role==="ai"?"assistant":"user", content: m.text }))
        })
      });
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        throw new Error("api-not-found");
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMsgs(m => [...m, { role:"ai", text: data.content?.[0]?.text || "Sorry, try again." }]);
      setTimeout(() => { if (askMsgsRef.current) askMsgsRef.current.scrollTop = askMsgsRef.current.scrollHeight; }, 50);
    } catch (e) {
      const msg = e.message === "api-not-found"
        ? "Can't reach the API. If you're testing on localhost, this only works on the deployed Vercel URL — not npm run dev."
        : "Connection issue — try again in a moment.";
      setMsgs(m => [...m, { role:"ai", text: msg }]);
    }
    setTyping(false);
  };

  // ── Multi-format Bank Statement Import — NDJSON, routed through /api/claude ──
  const toBase64 = (file) => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result.split(",")[1]);
    reader.onerror = () => rej(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

  const importStatement = async (file) => {
    setImporting(true);
    setImportError("");

    const ext = file.name.split(".").pop().toLowerCase();
    const isCSV  = ext === "csv" || ext === "txt";
    const isPDF  = ext === "pdf";
    const isXLSX = ext === "xlsx" || ext === "xls";
    const isDOCX = ext === "docx" || ext === "doc";

    // NDJSON format: one JSON object per line. Far more robust to truncation
    // than a single giant JSON blob — every complete line before a cut-off
    // point is still valid and usable, so nothing needs brace-repair.
    const extractionPrompt = `Extract every transaction from this bank statement.

Output NDJSON only — one JSON object per line, nothing else. No markdown, no code fences, no commentary, no blank lines.

The FIRST line must be a summary object:
{"type":"summary","accountName":"bank name","openingBalance":0.00,"closingBalance":0.00,"totalIn":0.00,"totalOut":0.00,"period":"DD MMM – DD MMM YYYY"}

Every line after that is one transaction object:
{"type":"txn","date":"DD MMM","merchant":"clean name","amount":-12.50,"category":"Food & Drink","icon":"🍽️"}

Categories: Food & Drink, Groceries, Transport, Bills, Subscriptions, Income, Going out, Self care, Transfers, Other.
Rules: debits negative, credits positive, clean merchant names (strip reference numbers), include every transaction, one JSON object per line with nothing else on that line.`;

    try {
      let content = [];

      if (isCSV) {
        const text = await file.text();
        const truncated = text.slice(0, 12000);
        content = [{ type:"text", text:`Bank statement CSV:\n\n${truncated}\n\n${extractionPrompt}` }];

      } else if (isPDF) {
        const b64 = await toBase64(file);
        content = [
          { type:"document", source:{ type:"base64", media_type:"application/pdf", data:b64 } },
          { type:"text", text: extractionPrompt }
        ];

      } else if (isXLSX) {
        const b64 = await toBase64(file);
        content = [
          { type:"document", source:{ type:"base64", media_type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", data:b64 } },
          { type:"text", text: extractionPrompt }
        ];

      } else if (isDOCX) {
        const b64 = await toBase64(file);
        content = [
          { type:"document", source:{ type:"base64", media_type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document", data:b64 } },
          { type:"text", text: extractionPrompt }
        ];

      } else {
        throw new Error(`Unsupported format .${ext} — use PDF, CSV, XLSX or DOCX`);
      }

      const response = await fetch("/api/gemini", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          max_tokens:8000,
          messages:[{ role:"user", content }]
        })
      });

      const ct = response.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        throw new Error("Can't reach the API. If you're testing on localhost, this only works on the deployed Vercel URL — not npm run dev.");
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      if (!data.content?.[0]?.text) throw new Error("Empty response — try again");

      const raw = data.content[0].text;

      // Parse NDJSON: split by line, parse each independently, skip any
      // that fail (e.g. a truncated final line) rather than failing the
      // whole import.
      const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
      let summary = null;
      const parsedTxns = [];

      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj.type === "summary") summary = obj;
          else if (obj.type === "txn") parsedTxns.push(obj);
        } catch {
          // Incomplete or malformed line (usually the last one if truncated)
          // — skip it, keep everything parsed so far.
          continue;
        }
      }

      if (parsedTxns.length === 0) {
        throw new Error("No transactions found. Make sure this file is a bank statement with transaction rows.");
      }

      const catTotals = {};
      parsedTxns.forEach(t => {
        if (t.amount < 0) {
          const cat = t.category || "Other";
          catTotals[cat] = (catTotals[cat] || 0) + Math.abs(t.amount);
        }
      });

      const totalIn  = summary?.totalIn  || parsedTxns.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
      const totalOut = summary?.totalOut || parsedTxns.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);

      setStatements(prev => [...prev, {
        id: crypto.randomUUID?.() || String(Date.now()),
        importedAt: Date.now(),
        accountName: summary?.accountName || "Your bank",
        period: summary?.period || "Imported",
        totalIn, totalOut,
        closingBalance: summary?.closingBalance || 0,
        catTotals,
        fileType: ext.toUpperCase(),
        transactions: parsedTxns,
      }]);

      const topSpend = Object.entries(catTotals)
        .sort((a,b)=>b[1]-a[1]).slice(0,3)
        .map(([k,v])=>`${k} £${v.toFixed(0)}`).join(" · ");

      setMsgs(m => [...m, { role:"ai", text:`Statement loaded ✅\n\n**${summary?.accountName || "Your bank"}** · ${summary?.period || ""}\n\n**In:** £${totalIn.toFixed(2)} · **Out:** £${totalOut.toFixed(2)}\n**Top spend:** ${topSpend}\n\nAsk me anything about your real spending.` }]);

      setTab("home");

    } catch(e) {
      setImportError(e.message || `Could not read this ${ext.toUpperCase()}. Try exporting as CSV from your bank app — it's the most reliable format.`);
    }
    setImporting(false);
  };

  // ── Bank connect ────────────────────────────────────────────────────────────
  const connectBank = async (bank) => {
    setConnectingBank(bank); setBankStep(2);
    await new Promise(r => setTimeout(r, 2200));
    setConnectedBanks(b => [...b, { ...bank, accounts:[{ name:"Current", balance: Math.floor(Math.random()*1800)+200 }] }]);
    setBankStep(3);
  };

  const PageHeader = ({ title, sub, backFn }) => (
    <div style={{ padding:"50px 18px 18px", display:"flex", alignItems:"flex-start", gap:12 }}>
      {backFn && (
        <button onClick={backFn} style={{ background:"none", border:`1px solid ${cl.border}`, color:cl.t2, borderRadius:10, padding:"6px 10px", cursor:"pointer", fontSize:14, marginTop:4, flexShrink:0 }}>←</button>
      )}
      <div>
        <p style={{ fontSize:11, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 3px" }}>{sub}</p>
        <h1 style={{ fontFamily:fs, fontSize:28, fontWeight:600, color:cl.t1, margin:0 }}>{title}</h1>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // IMPORT SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  const ImportScreen = () => (
    <div style={{ padding:"0 18px" }}>
      <PageHeader title="Import statement" sub="PDF · CSV · Excel · Word" backFn={() => setTab("home")} />

      {/* Hidden file input — all supported formats */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.csv,.txt,.xlsx,.xls,.docx,.doc"
        style={{ display:"none" }}
        onChange={e => { if (e.target.files[0]) importStatement(e.target.files[0]); }}
      />

      {/* Privacy card */}
      <div style={{ ...card({ background:"rgba(100,240,72,0.05)", borderColor:"rgba(100,240,72,0.2)", marginBottom:16 }) }}>
        <p style={{ fontSize:13, fontWeight:600, color:cl.accent, margin:"0 0 6px" }}>🔒 Your data stays private</p>
        <p style={{ fontSize:12, color:cl.t2, margin:0, lineHeight:1.6 }}>
          Your file is read in your browser, sent to Claude AI to extract transactions, then immediately discarded. Never stored on any server.
        </p>
      </div>

      {/* Supported formats */}
      <div style={{ ...card({ marginBottom:16 }) }}>
        <p style={{ fontSize:13, fontWeight:600, color:cl.t1, margin:"0 0 12px" }}>Supported formats</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {[
            { ext:"PDF", icon:"📄", desc:"Bank statement PDF", color:"#f26550" },
            { ext:"CSV", icon:"📊", desc:"Exported transactions", color:"#34d399" },
            { ext:"XLSX", icon:"📗", desc:"Excel spreadsheet", color:"#22c55e" },
            { ext:"DOCX", icon:"📘", desc:"Word document", color:"#56a8ff" },
          ].map(({ ext, icon, desc, color }) => (
            <div key={ext} style={{ ...card({ background:cl.s1, padding:"12px 14px" }) }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <span style={{ fontSize:18 }}>{icon}</span>
                <span style={{ fontSize:13, fontWeight:700, color }}>.{ext}</span>
              </div>
              <p style={{ fontSize:11, color:cl.t3, margin:0 }}>{desc}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize:11, color:cl.t3, margin:"12px 0 0", lineHeight:1.5 }}>
          Works with Monzo, Barclays, HSBC, Lloyds, NatWest, Starling, Santander, Halifax, Nationwide and more. Must be digital — not a scanned image.
        </p>
      </div>

      {/* How to export from your bank */}
      <div style={{ ...card({ marginBottom:16 }) }}>
        <p style={{ fontSize:13, fontWeight:600, color:cl.t1, margin:"0 0 10px" }}>How to export from your bank</p>
        {[
          { bank:"Monzo", steps:"App → Account → Statements → Download CSV" },
          { bank:"Barclays", steps:"App → Help → Statements → Download PDF" },
          { bank:"HSBC", steps:"Online banking → Accounts → View statements → PDF" },
          { bank:"Starling", steps:"App → Spaces → Download statement → CSV" },
          { bank:"NatWest", steps:"Online banking → Statements → Export → CSV" },
        ].map(({ bank, steps }, i) => (
          <div key={bank} style={{ padding:"8px 0", borderBottom: i < 4 ? `1px solid ${cl.border}` : "none" }}>
            <p style={{ fontSize:13, color:cl.t1, fontWeight:500, margin:"0 0 2px" }}>{bank}</p>
            <p style={{ fontSize:11, color:cl.t3, margin:0 }}>{steps}</p>
          </div>
        ))}
      </div>

      {/* Import button or loading */}
      {importing ? (
        <div style={{ ...card({ textAlign:"center", padding:"32px 20px", marginBottom:16 }) }}>
          <div style={{ fontSize:36, marginBottom:12 }}>⏳</div>
          <p style={{ fontSize:15, color:cl.t1, fontWeight:500, margin:"0 0 6px" }}>Reading your statement…</p>
          <p style={{ fontSize:12, color:cl.t3, margin:"0 0 16px" }}>Claude is extracting and categorising your transactions</p>
          <div style={{ height:4, background:cl.border, borderRadius:4, overflow:"hidden" }}>
            <div style={{ height:"100%", width:"60%", background:cl.accent, borderRadius:4 }} />
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{ width:"100%", background:cl.accent, color:cl.accentFg, border:"none", borderRadius:14, padding:18, fontSize:16, fontWeight:600, cursor:"pointer", marginBottom:12, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}
        >
          <span style={{ fontSize:20 }}>📂</span> Choose file to import
        </button>
      )}

      {importError && (
        <div style={{ ...card({ background:"rgba(242,101,80,0.08)", borderColor:"rgba(242,101,80,0.25)", marginBottom:16 }) }}>
          <p style={{ fontSize:13, color:cl.red, margin:0 }}>⚠️ {importError}</p>
        </div>
      )}

      {statements.length > 0 && (
        <>
          <h3 style={{ fontSize:12, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 10px" }}>
            Imported statements ({statements.length})
          </h3>
          <div style={{ ...card({ marginBottom:12 }) }}>
            {statements.map((s, i) => (
              <div key={s.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom: i < statements.length-1 ? `1px solid ${cl.border}` : "none" }}>
                <div>
                  <p style={{ fontSize:13, color:cl.t1, fontWeight:500, margin:"0 0 2px" }}>{s.accountName} · {s.fileType}</p>
                  <p style={{ fontSize:11, color:cl.t3, margin:0 }}>{s.period} · {s.transactions.length} transactions</p>
                </div>
                <button
                  onClick={() => setStatements(prev => prev.filter(x => x.id !== s.id))}
                  style={{ background:"none", border:`1px solid ${cl.border}`, color:cl.t3, borderRadius:8, padding:"4px 8px", cursor:"pointer", fontSize:12, flexShrink:0 }}
                >Remove</button>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setStatements([]); setImportError(""); }}
            style={{ width:"100%", background:"none", border:`1px solid ${cl.red}`, color:cl.red, borderRadius:14, padding:14, fontSize:14, cursor:"pointer", marginBottom:24 }}
          >
            Clear all & return to demo data
          </button>
        </>
      )}
    </div>
  );

  // helper — which transactions to show
  const activeTxns = realTxns || txns;

  // ─────────────────────────────────────────────────────────────────────────
  // HOME
  // ─────────────────────────────────────────────────────────────────────────
  const HomeScreen = () => {
    const balance = realSummary ? realSummary.closingBalance : 677.83;
    const totalIn = realSummary ? realSummary.totalIn : 1850;
    const totalOut = realSummary ? realSummary.totalOut : 1102.17;
    const left = totalIn - totalOut;
    const period = realSummary ? realSummary.period : "18 Apr → 26 Apr";

    return (
    <div style={{ padding:"0 18px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"50px 0 20px" }}>
        <div>
          <p style={{ fontSize:12, color:cl.t3, margin:"0 0 2px" }}>Good morning,</p>
          <h1 style={{ fontFamily:fs, fontSize:30, fontWeight:600, color:cl.t1, margin:0 }}>Gabe</h1>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => setTab("import")} style={{ height:40, borderRadius:20, background:cl.s2, border:`1px solid ${cl.border}`, display:"flex", alignItems:"center", gap:6, padding:"0 14px", cursor:"pointer" }}>
            <span style={{ fontSize:14 }}>📄</span>
            <span style={{ fontSize:11, color: realSummary ? cl.accent : cl.t2 }}>{realSummary ? "Real data" : "Import"}</span>
          </button>
          <button onClick={() => setTab("me")} style={{ width:40, height:40, borderRadius:"50%", background:cl.s2, border:`1px solid ${cl.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, cursor:"pointer" }}>🌿</button>
        </div>
      </div>

      {/* Balance */}
      <div style={{ ...gradCard({ padding:"22px", marginBottom:14, position:"relative", overflow:"hidden" }) }}>
        <div style={{ position:"absolute", top:-20, right:-20, width:100, height:100, borderRadius:"50%", background:"rgba(100,240,72,0.05)" }} />
        <p style={{ fontSize:11, color:cl.t3, letterSpacing:"0.07em", textTransform:"uppercase", margin:"0 0 5px" }}>
          {realSummary ? realSummary.accountName : "Total balance"}
        </p>
        <h2 style={{ fontFamily:fs, fontSize:44, fontWeight:600, color:cl.t1, margin:"0 0 4px", lineHeight:1 }}>
          £{Math.floor(balance)}<span style={{ fontSize:22, color:cl.t2 }}>.{String(Math.round((balance % 1) * 100)).padStart(2,"0")}</span>
        </h2>
        <p style={{ fontSize:12, color:cl.t3, margin:"0 0 14px" }}>
          {realSummary ? `${realTxns?.length} transactions · ${period}` : `${connectedBanks.length} accounts · Open Banking`}
        </p>
        <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:10, padding:"10px 12px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
            <span style={{ fontSize:11, color:cl.t3 }}>{period}</span>
            <span style={{ fontSize:11, color:cl.accent, fontWeight:600 }}>£{left.toFixed(0)} left</span>
          </div>
          <div style={{ height:4, background:"rgba(255,255,255,0.07)", borderRadius:4, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${Math.min((totalOut/totalIn)*100,100)}%`, background:cl.accent, borderRadius:4 }} />
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
        {[
          { icon:"🏦", label:"Save",   fn:() => setTab("save") },
          { icon:"📊", label:"Budget", fn:() => setTab("budget") },
          { icon:"★",  label:"Credit", fn:() => { setTab("me"); setMeScreen("credit"); } },
        ].map(({ icon, label, fn }) => (
          <button key={label} onClick={fn} style={{ ...card({ padding:"12px 6px", textAlign:"center", cursor:"pointer", background:cl.s1 }) }}>
            <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
            <div style={{ fontSize:11, color:cl.t2 }}>{label}</div>
          </button>
        ))}
      </div>

      {/* Credit nudge */}
      <div onClick={() => { setTab("me"); setMeScreen("credit"); }} style={{ ...card({ cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }), borderColor:"rgba(244,162,68,0.25)" }}>
        <div>
          <p style={{ fontSize:13, fontWeight:500, color:cl.t1, margin:"0 0 2px" }}>Experian credit score</p>
          <p style={{ fontSize:12, color:cl.warn, margin:0 }}>612 · Fair — 2 quick wins available →</p>
        </div>
        <div style={{ fontFamily:fs, fontSize:28, fontWeight:600, color:cl.warn }}>612</div>
      </div>

      {/* Spend ring */}
      <div style={{ ...card({ display:"flex", alignItems:"center", gap:14, marginBottom:14 }) }}>
        <SpendRing spent={totalOut} total={totalIn} />
        <div>
          <p style={{ fontSize:11, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.05em", margin:"0 0 3px" }}>This period</p>
          <p style={{ fontSize:20, fontWeight:600, color:cl.t1, margin:"0 0 2px" }}>£{totalOut.toFixed(0)} <span style={{ fontSize:12, color:cl.t3 }}>spent</span></p>
          <p style={{ fontSize:14, color:cl.accent, margin:"0 0 7px" }}>£{left.toFixed(0)} remaining</p>
          <button onClick={() => setTab("budget")} style={{ fontSize:12, color:cl.t3, background:"none", border:`1px solid ${cl.border}`, borderRadius:8, padding:"4px 10px", cursor:"pointer" }}>Full breakdown →</button>
        </div>
      </div>

      {/* Recent */}
      <h3 style={{ fontSize:12, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 10px" }}>Recent</h3>
      <div style={{ ...card(), marginBottom:24 }}>
        {activeTxns.slice(0,5).map((t, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom: i < 4 ? `1px solid ${cl.border}` : "none" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:cl.s1, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>{t.i || t.icon || "💳"}</div>
              <div>
                <p style={{ fontSize:13, color:cl.t1, fontWeight:500, margin:0 }}>{t.m || t.merchant}</p>
                <p style={{ fontSize:11, color:cl.t3, margin:0 }}>{t.cat || t.category} · {t.d || t.date}</p>
              </div>
            </div>
            <span style={{ fontSize:13, fontWeight:600, color:t.a > 0 || t.amount > 0 ? cl.accent : cl.t1 }}>
              {(t.a || t.amount) > 0 ? "+" : ""}£{Math.abs(t.a || t.amount).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // BUDGET
  // ─────────────────────────────────────────────────────────────────────────
  const BudgetScreen = () => {
    const totalIn = realSummary ? realSummary.totalIn : 1850;
    const totalOut = realSummary ? realSummary.totalOut : 1102;
    const left = totalIn - totalOut;
    const period = realSummary ? realSummary.period : "18 Apr → 26 Apr";
    const catEntries = realSummary ? Object.entries(realSummary.catTotals).sort((a,b) => b[1]-a[1]) : null;

    const donutEntries = (realSummary
      ? catEntries.map(([name, amt]) => ({ name, amt }))
      : [...cats].sort((a,b) => b.amt - a.amt).map(c => ({ name: c.name, amt: c.amt }))
    ).map((e, i) => ({ ...e, color: catPalette[i % catPalette.length] }));

    // One bar per imported statement — only meaningful once there's a history to compare.
    const trendData = statements.map(s => ({
      label: (s.period.split(/[–—-]/)[0] || s.period).trim().slice(0, 8),
      amt: s.totalOut,
    }));
    const prevOut = statements.length >= 2 ? statements[statements.length - 2].totalOut : null;
    const pctChange = prevOut ? Math.round(((totalOut - prevOut) / prevOut) * 100) : null;

    const selectedStatement = selectedPeriodIdx != null ? statements[selectedPeriodIdx] : null;
    const selectedPrev = selectedPeriodIdx != null && selectedPeriodIdx > 0 ? statements[selectedPeriodIdx - 1] : null;
    const selectedTopCat = selectedStatement
      ? Object.entries(selectedStatement.catTotals).sort((a,b) => b[1]-a[1])[0]
      : null;
    const selectedChange = selectedStatement && selectedPrev
      ? Math.round(((selectedStatement.totalOut - selectedPrev.totalOut) / selectedPrev.totalOut) * 100)
      : null;

    const merchantTotals = {};
    activeTxns.forEach(t => {
      const amt = t.a ?? t.amount;
      if (amt < 0) {
        const name = t.m ?? t.merchant;
        merchantTotals[name] = (merchantTotals[name] || 0) + Math.abs(amt);
      }
    });
    const topMerchants = Object.entries(merchantTotals).sort((a,b) => b[1]-a[1]).slice(0, 5);

    return (
    <div style={{ padding:"0 18px" }}>
      <PageHeader title={period} sub="Pay cycle budget" />
      <div style={{ ...card({ display:"flex", justifyContent:"space-between", marginBottom:12 }) }}>
        {[
          {l:"Income",v:`£${totalIn.toFixed(0)}`,c:cl.t1},
          {l:"Spent",v:`£${totalOut.toFixed(0)}`,c:cl.warn, change:pctChange},
          {l:"Left",v:`£${left.toFixed(0)}`,c:cl.accent},
        ].map(({ l, v, c, change }) => (
          <div key={l} style={{ textAlign:"center" }}>
            <p style={{ fontSize:19, fontWeight:600, color:c, margin:"0 0 3px" }}>{v}</p>
            <p style={{ fontSize:11, color:cl.t3, margin:0 }}>
              {l}
              {change != null && (
                <span style={{ color: change > 0 ? cl.red : cl.accent, fontWeight:600 }}> {change > 0 ? "▲" : "▼"}{Math.abs(change)}%</span>
              )}
            </p>
          </div>
        ))}
      </div>
      <div style={{ ...card({ background:"rgba(100,240,72,0.05)", borderColor:"rgba(100,240,72,0.18)", marginBottom:14 }) }}>
        <p style={{ fontSize:12, color:"#9fe88a", margin:0, lineHeight:1.55 }}>✓ <strong>Payday-cycle budgeting</strong> — resets on your actual pay date, not the 1st.</p>
      </div>

      {/* Spending breakdown donut — tap a segment or legend row to drill in */}
      <h3 style={{ fontSize:12, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 10px" }}>Spending breakdown</h3>
      <div style={{ ...card({ display:"flex", alignItems:"flex-start", gap:16, marginBottom:14 }) }}>
        <div style={{ flexShrink:0 }}>
          <CategoryDonut entries={donutEntries} selected={selectedCat} onSelect={setSelectedCat} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <CategoryLegend entries={donutEntries} selected={selectedCat} onSelect={setSelectedCat} />
        </div>
      </div>

      {/* Top merchants */}
      {topMerchants.length > 0 && (
        <>
          <h3 style={{ fontSize:12, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 10px" }}>Top merchants</h3>
          <div style={{ ...card({ marginBottom:14 }) }}>
            {topMerchants.map(([name, amt], i) => (
              <div key={name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom: i < topMerchants.length-1 ? `1px solid ${cl.border}` : "none" }}>
                <span style={{ fontSize:13, color:cl.t2 }}>{i+1}. {name}</span>
                <span style={{ fontSize:13, color:cl.t1, fontWeight:600 }}>£{amt.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Spending trend across imported statements — tap a bar to drill in */}
      {trendData.length >= 2 && (
        <>
          <h3 style={{ fontSize:12, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 10px" }}>Spending trend</h3>
          <div style={{ ...card({ marginBottom: selectedStatement ? 0 : 14 }) }}>
            <SpendTrendChart data={trendData} selectedIdx={selectedPeriodIdx} onSelect={setSelectedPeriodIdx} />
          </div>
          {selectedStatement && (
            <div style={{ ...card({ background:"rgba(100,240,72,0.05)", borderColor:"rgba(100,240,72,0.18)", marginTop:8, marginBottom:14 }) }}>
              <p style={{ fontSize:13, fontWeight:600, color:cl.t1, margin:"0 0 4px" }}>{selectedStatement.period}</p>
              <p style={{ fontSize:12, color:cl.t2, margin:"0 0 2px" }}>
                Spent £{selectedStatement.totalOut.toFixed(0)}
                {selectedChange != null && (
                  <span style={{ color: selectedChange > 0 ? cl.red : cl.accent, fontWeight:600 }}> ({selectedChange > 0 ? "▲" : "▼"}{Math.abs(selectedChange)}% vs previous)</span>
                )}
              </p>
              {selectedTopCat && (
                <p style={{ fontSize:12, color:cl.t3, margin:0 }}>Top category: {selectedTopCat[0]} · £{selectedTopCat[1].toFixed(0)}</p>
              )}
            </div>
          )}
        </>
      )}

      {!realSummary && (
        <>
          <h3 style={{ fontSize:12, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 10px" }}>Categories</h3>
          <div style={{ ...card({ marginBottom:14 }) }}>
            {cats.map((c, i) => <CatBar key={i} {...c} />)}
          </div>
          <div style={{ ...card({ background:"rgba(242,101,80,0.06)", borderColor:"rgba(242,101,80,0.2)", marginBottom:14 }) }}>
            <p style={{ fontSize:13, fontWeight:500, color:cl.red, margin:"0 0 2px" }}>🎉 Going out — £6.80 over budget</p>
            <p style={{ fontSize:12, color:cl.t3, margin:0 }}>9 days left to recover.</p>
          </div>
        </>
      )}
      <h3 style={{ fontSize:12, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 10px" }}>All transactions</h3>
      <div style={{ ...card(), marginBottom:24 }}>
        {activeTxns.map((t, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 0", borderBottom: i < activeTxns.length-1 ? `1px solid ${cl.border}` : "none" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:30, height:30, borderRadius:8, background:cl.s1, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>{t.i || t.icon || "💳"}</div>
              <div>
                <p style={{ fontSize:13, color:cl.t1, fontWeight:500, margin:0 }}>{t.m || t.merchant}</p>
                <p style={{ fontSize:11, color:cl.t3, margin:0 }}>{t.cat || t.category} · {t.d || t.date}</p>
              </div>
            </div>
            <span style={{ fontSize:13, fontWeight:600, color:(t.a ?? t.amount) > 0 ? cl.accent : cl.t1 }}>{(t.a ?? t.amount) > 0 ? "+" : ""}£{Math.abs(t.a ?? t.amount).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SAVE
  // ─────────────────────────────────────────────────────────────────────────
  const SaveScreen = () => {
    return (
      <div style={{ padding:"0 18px" }}>
        <PageHeader title="Savings" sub="Easy access · FSCS protected up to £85k" />
        <div style={{ ...gradCard({ marginBottom:12 }) }}>
          <p style={{ fontSize:11, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 5px" }}>Balance</p>
          <p style={{ fontFamily:fs, fontSize:44, fontWeight:600, color:cl.t1, margin:"0 0 10px", lineHeight:1 }}>£430<span style={{ fontSize:22, color:cl.t2 }}>.00</span></p>
          <div style={{ display:"flex", gap:20 }}>
            <div><p style={{ fontSize:22, fontWeight:600, color:cl.accent, margin:0 }}>4.1%</p><p style={{ fontSize:11, color:cl.t3, margin:0 }}>AER variable</p></div>
            <div><p style={{ fontSize:22, fontWeight:600, color:cl.t2, margin:0 }}>£17.63</p><p style={{ fontSize:11, color:cl.t3, margin:0 }}>Earned this year</p></div>
          </div>
        </div>
        {[
          { l:"Auto-save £50/month", s:"Transfers on payday automatically", v:autoSave, fn:setAutoSave },
          { l:"Round-up savings",    s:"Rounds each spend up to nearest £1", v:roundUp,  fn:setRoundUp  },
        ].map(({ l, s, v, fn }) => (
          <div key={l} onClick={() => fn(!v)} style={{ ...card({ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, cursor:"pointer" }) }}>
            <div><p style={{ fontSize:14, color:cl.t1, fontWeight:500, margin:"0 0 2px" }}>{l}</p><p style={{ fontSize:12, color:cl.t3, margin:0 }}>{s}</p></div>
            <div style={{ width:44, height:24, borderRadius:12, background: v ? cl.accent : cl.border, position:"relative", flexShrink:0, transition:"background 0.2s" }}>
              <div style={{ position:"absolute", top:2, left: v ? 22 : 2, width:20, height:20, borderRadius:"50%", background: v ? cl.accentFg : cl.t3, transition:"left 0.2s" }} />
            </div>
          </div>
        ))}
        <div style={{ ...card({ background:"rgba(100,240,72,0.05)", borderColor:"rgba(100,240,72,0.15)", marginBottom:16 }) }}>
          <p style={{ fontSize:13, color:cl.t2, fontWeight:500, margin:"0 0 5px" }}>Save £50/month from here:</p>
          <p style={{ fontSize:12, color:cl.t3, lineHeight:1.65, margin:0 }}>→ £1,030 in 1 year (+£18 interest)<br />→ £1,680 in 2 years (+£72 interest)<br /><span style={{ fontSize:11, opacity:0.7 }}>4.1% AER variable, monthly compounding</span></p>
        </div>
        <div style={{ display:"flex", gap:10, marginBottom:24 }}>
          <button style={{ flex:1, background:cl.accent, color:cl.accentFg, border:"none", borderRadius:14, padding:14, fontSize:15, fontWeight:600, cursor:"pointer" }}>Deposit</button>
          <button style={{ flex:1, background:"none", border:`1px solid ${cl.border}`, color:cl.t2, borderRadius:14, padding:14, fontSize:15, cursor:"pointer" }}>Withdraw</button>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ME
  // ─────────────────────────────────────────────────────────────────────────
  const MeOverview = () => (
    <div style={{ padding:"0 18px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"50px 0 18px" }}>
        <div>
          <p style={{ fontSize:12, color:cl.t3, margin:"0 0 2px" }}>Your profile</p>
          <h1 style={{ fontFamily:fs, fontSize:28, fontWeight:600, color:cl.t1, margin:0 }}>Gabe</h1>
        </div>
        <span style={{ fontSize:12, color:cl.t2, background:cl.s1, padding:"4px 12px", borderRadius:20, border:`1px solid ${cl.border}` }}>Free plan</span>
      </div>

      {/* Credit */}
      <div onClick={() => setMeScreen("credit")} style={{ ...card({ cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }), borderColor:"rgba(244,162,68,0.3)" }}>
        <div>
          <p style={{ fontSize:12, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 3px" }}>Experian credit score</p>
          <p style={{ fontFamily:fs, fontSize:32, fontWeight:600, color:cl.warn, margin:"0 0 2px" }}>612</p>
          <p style={{ fontSize:12, color:cl.t3, margin:0 }}>Fair · 2 improvements available →</p>
        </div>
        <CreditDial score={612} />
      </div>

      {/* Banks */}
      <div onClick={() => setMeScreen("banks")} style={{ ...card({ cursor:"pointer", marginBottom:10 }) }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
          <div>
            <p style={{ fontSize:12, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 3px" }}>Open Banking</p>
            <p style={{ fontSize:14, color:cl.t1, fontWeight:500, margin:0 }}>{connectedBanks.length} banks connected</p>
          </div>
          <span style={{ fontSize:12, color:cl.accent, background:"rgba(100,240,72,0.1)", padding:"4px 10px", borderRadius:20 }}>Active</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {connectedBanks.map(b => (
            <div key={b.id} style={{ width:32, height:32, borderRadius:8, background:b.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff" }}>{b.init}</div>
          ))}
          <div style={{ width:32, height:32, borderRadius:8, border:`1px dashed ${cl.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:cl.t3 }}>+</div>
        </div>
      </div>

      {/* Plan */}
      <div onClick={() => setMeScreen("plan")} style={{ ...card({ cursor:"pointer", marginBottom:10 }) }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <p style={{ fontSize:12, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.06em", margin:0 }}>Your plan</p>
          <span style={{ fontSize:12, color:cl.t3, background:cl.s1, padding:"4px 10px", borderRadius:20, border:`1px solid ${cl.border}` }}>Free</span>
        </div>
        <p style={{ fontSize:13, color:cl.t1, margin:"0 0 3px" }}>Upgrade to <strong style={{ color:cl.accent }}>Plus (£4.99/mo)</strong> for credit score monitoring, Open Banking and priority support →</p>
      </div>

      {/* ── NEW: Cancel / account settings ── */}
      <div style={{ ...card({ background:cl.s1, marginBottom:10 }) }}>
        <p style={{ fontSize:12, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 10px" }}>Account</p>
        {[
          { l:"Notifications",  sub:"Manage alerts and reminders", icon:"🔔" },
          { l:"Security",       sub:"Face ID, PIN, 2FA",           icon:"🔒" },
          { l:"Data & privacy", sub:"What we store, how to export",icon:"🗂️" },
        ].map(({ l, sub, icon }) => (
          <div key={l} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:`1px solid ${cl.border}`, cursor:"pointer" }}>
            <span style={{ fontSize:18 }}>{icon}</span>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13, color:cl.t1, fontWeight:500, margin:0 }}>{l}</p>
              <p style={{ fontSize:11, color:cl.t3, margin:0 }}>{sub}</p>
            </div>
            <span style={{ color:cl.t3, fontSize:14 }}>›</span>
          </div>
        ))}
        {/* Cancel — always visible, no hunting */}
        <div onClick={() => setShowCancel(true)} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", cursor:"pointer" }}>
          <span style={{ fontSize:18 }}>🚪</span>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:13, color:cl.red, fontWeight:500, margin:0 }}>Cancel plan</p>
            <p style={{ fontSize:11, color:cl.t3, margin:0 }}>Instant · no friction · keeps free features</p>
          </div>
          <span style={{ color:cl.t3, fontSize:14 }}>›</span>
        </div>
      </div>
    </div>
  );

  const CreditScreen = () => (
    <div style={{ padding:"0 18px" }}>
      <PageHeader title="Credit score" sub="Experian · updated today" backFn={() => setMeScreen("overview")} />
      <div style={{ ...card({ display:"flex", justifyContent:"center", alignItems:"center", flexDirection:"column", padding:"24px 20px", marginBottom:12 }) }}>
        <CreditDial score={612} />
        <p style={{ fontSize:13, color:cl.t3, margin:"8px 0 0" }}>Powered by Experian · updated today</p>
      </div>
      <h3 style={{ fontSize:12, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 6px" }}>Score history</h3>
      <div style={{ ...card({ marginBottom:12 }) }}>
        <ScoreSparkline data={creditData.history} />
        <p style={{ fontSize:11, color:cl.t3, margin:"10px 0 0" }}>+32 points in 6 months</p>
      </div>
      <h3 style={{ fontSize:12, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 9px" }}>Score factors</h3>
      <div style={{ ...card({ marginBottom:12 }) }}>
        {creditData.factors.map((f, i) => {
          const col = f.status==="good" ? cl.accent : f.status==="ok" ? cl.warn : cl.red;
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom: i < creditData.factors.length-1 ? `1px solid ${cl.border}` : "none" }}>
              <div style={{ width:26, height:26, borderRadius:8, background:`${col}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0, color:col }}>{f.status==="good"?"✓":f.status==="ok"?"~":"✗"}</div>
              <div><p style={{ fontSize:13, color:cl.t1, fontWeight:500, margin:0 }}>{f.name}</p><p style={{ fontSize:12, color:cl.t3, margin:0 }}>{f.detail}</p></div>
            </div>
          );
        })}
      </div>
      {[
        { title:"Register on electoral roll", detail:"Could add up to 50 points — free at gov.uk, 5 minutes.", impact:"+50 pts", color:cl.red },
        { title:"Reduce credit utilisation",  detail:"At 55% — pay down ~£250 to reach 30%.",               impact:"+30 pts", color:cl.warn },
      ].map(({ title, detail, impact, color }) => (
        <div key={title} style={{ ...card({ marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center" }) }}>
          <div style={{ flex:1, marginRight:12 }}>
            <p style={{ fontSize:13, color:cl.t1, fontWeight:500, margin:"0 0 2px" }}>{title}</p>
            <p style={{ fontSize:12, color:cl.t3, margin:0 }}>{detail}</p>
          </div>
          <span style={{ fontSize:12, fontWeight:700, color, background:`${color}18`, padding:"4px 10px", borderRadius:20, flexShrink:0 }}>{impact}</span>
        </div>
      ))}
      <div style={{ height:24 }} />
    </div>
  );

  const BanksScreen = () => (
    <div style={{ padding:"0 18px" }}>
      <PageHeader title="Connected banks" sub="Open Banking via TrueLayer" backFn={() => { setMeScreen("overview"); setBankStep(0); setConnectingBank(null); }} />
      {connectedBanks.map(b => (
        <div key={b.id} style={{ ...card({ display:"flex", alignItems:"center", gap:14, marginBottom:10 }) }}>
          <div style={{ width:42, height:42, borderRadius:12, background:b.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:"#fff", flexShrink:0 }}>{b.init}</div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:14, color:cl.t1, fontWeight:500, margin:"0 0 1px" }}>{b.name}</p>
            {b.accounts.map((a, i) => <p key={i} style={{ fontSize:12, color:cl.t3, margin:0 }}>{a.name} · £{a.balance.toFixed(2)}</p>)}
          </div>
          <span style={{ fontSize:11, color:cl.accent, background:"rgba(100,240,72,0.1)", padding:"3px 9px", borderRadius:12 }}>Connected</span>
        </div>
      ))}
      {bankStep===0 && <button onClick={() => setBankStep(1)} style={{ width:"100%", background:"none", border:`1px dashed ${cl.border}`, color:cl.t2, borderRadius:14, padding:"16px", fontSize:14, cursor:"pointer", marginBottom:12 }}>+ Connect another bank</button>}
      {bankStep===1 && (<>
        <h3 style={{ fontSize:12, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 10px" }}>Select your bank</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
          {ukBanks.filter(b => !connectedBanks.find(c => c.id===b.id)).map(b => (
            <button key={b.id} onClick={() => connectBank(b)} style={{ ...card({ display:"flex", alignItems:"center", gap:12, cursor:"pointer", padding:"12px 14px", background:cl.s1 }) }}>
              <div style={{ width:36, height:36, borderRadius:10, background:b.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", flexShrink:0 }}>{b.init}</div>
              <span style={{ fontSize:13, color:cl.t1 }}>{b.name}</span>
            </button>
          ))}
        </div>
        <div style={{ ...card({ background:"rgba(100,240,72,0.05)", borderColor:"rgba(100,240,72,0.15)", marginBottom:14 }) }}>
          <p style={{ fontSize:12, color:"#9fe88a", margin:0, lineHeight:1.55 }}>🔒 Connected via TrueLayer Open Banking. Read-only access. We never store your credentials.</p>
        </div>
      </>)}
      {bankStep===2 && connectingBank && (
        <div style={{ ...card({ textAlign:"center", padding:"32px 20px", marginBottom:14 }) }}>
          <div style={{ width:48, height:48, borderRadius:14, background:connectingBank.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color:"#fff", margin:"0 auto 14px" }}>{connectingBank.init}</div>
          <p style={{ fontSize:15, color:cl.t1, fontWeight:500, margin:"0 0 6px" }}>Connecting to {connectingBank.name}…</p>
          <p style={{ fontSize:12, color:cl.t3, margin:"0 0 16px" }}>Authorising via TrueLayer</p>
          <div style={{ height:4, background:cl.border, borderRadius:4, overflow:"hidden" }}>
            <div style={{ height:"100%", width:"70%", background:cl.accent, borderRadius:4 }} />
          </div>
        </div>
      )}
      {bankStep===3 && connectingBank && (
        <div style={{ ...card({ textAlign:"center", padding:"28px 20px", background:"rgba(100,240,72,0.06)", borderColor:"rgba(100,240,72,0.25)", marginBottom:14 }) }}>
          <div style={{ fontSize:40, marginBottom:10 }}>✅</div>
          <p style={{ fontSize:15, color:cl.t1, fontWeight:500, margin:"0 0 4px" }}>{connectingBank.name} connected</p>
          <p style={{ fontSize:12, color:cl.t3, margin:0 }}>Syncing now</p>
        </div>
      )}
      <div style={{ height:24 }} />
    </div>
  );

  const PlanScreen = () => {
    const [selected, setSelected] = useState("free");
    return (
      <div style={{ padding:"0 18px" }}>
        <PageHeader title="Choose your plan" sub="Transparent pricing · cancel any time" backFn={() => setMeScreen("overview")} />
        <div style={{ ...card({ background:"rgba(100,240,72,0.05)", borderColor:"rgba(100,240,72,0.15)", marginBottom:16 }) }}>
          <p style={{ fontSize:12, color:"#9fe88a", margin:0, lineHeight:1.55 }}>✓ No contracts. No auto-escalating fees. No features gated that used to be free. Cancel any time in one tap, no friction.</p>
        </div>
        {plans.map(plan => (
          <div key={plan.key} onClick={() => setSelected(plan.key)} style={{ ...card({ cursor:"pointer", marginBottom:10, borderColor: selected===plan.key ? plan.color : cl.border, background: selected===plan.key ? `${plan.color}08` : cl.s2, position:"relative", overflow:"hidden" }) }}>
            {plan.highlight && <div style={{ position:"absolute", top:12, right:12, fontSize:10, fontWeight:700, color:cl.accentFg, background:cl.accent, padding:"3px 9px", borderRadius:20 }}>MOST POPULAR</div>}
            {plan.current  && <div style={{ position:"absolute", top:12, right:12, fontSize:10, fontWeight:600, color:cl.t2, background:cl.s1, padding:"3px 9px", borderRadius:20, border:`1px solid ${cl.border}` }}>YOUR PLAN</div>}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <p style={{ fontFamily:fs, fontSize:22, fontWeight:600, color:plan.color, margin:"0 0 2px" }}>{plan.name}</p>
                <p style={{ fontSize:12, color:cl.t3, margin:0 }}>{plan.sub}</p>
              </div>
              <p style={{ fontFamily:fs, fontSize:28, fontWeight:600, color:cl.t1, margin:0 }}>{plan.price}</p>
            </div>
            {plan.features.map((f, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                <span style={{ color:plan.color, fontSize:13 }}>✓</span>
                <span style={{ fontSize:13, color:cl.t2 }}>{f}</span>
              </div>
            ))}
          </div>
        ))}
        {selected !== "free" && (
          <button style={{ width:"100%", background:plans.find(p=>p.key===selected)?.color||cl.accent, color:cl.accentFg, border:"none", borderRadius:14, padding:16, fontSize:15, fontWeight:600, cursor:"pointer", marginTop:6, marginBottom:4 }}>
            Upgrade to {plans.find(p=>p.key===selected)?.name}
          </button>
        )}
        <p style={{ fontSize:11, color:cl.t3, textAlign:"center", margin:"8px 0 24px" }}>Cancel any time in settings. No questions asked.</p>
      </div>
    );
  };

  const MeScreen = () => {
    if (meScreen==="credit") return <CreditScreen />;
    if (meScreen==="banks")  return <BanksScreen />;
    if (meScreen==="plan")   return <PlanScreen />;
    return <MeOverview />;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ASK SCREEN — proper tab, keyboard-safe
  // ─────────────────────────────────────────────────────────────────────────
  const askInputRef = useRef(null);
  const askMsgsRef  = useRef(null);

  const appRef = useRef(null);

  // Fix iOS Safari keyboard — visualViewport resizes when keyboard opens
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => {
      if (appRef.current) {
        appRef.current.style.height = `${vv.height}px`;
      }
    };
    vv.addEventListener("resize", handler);
    vv.addEventListener("scroll", handler);
    handler();
    return () => {
      vv.removeEventListener("resize", handler);
      vv.removeEventListener("scroll", handler);
    };
  }, []);

  // Focus input when switching to ask tab
  useEffect(() => {
    if (tab === "ask") setTimeout(() => askInputRef.current?.focus(), 100);
  }, [tab]);

  // ─────────────────────────────────────────────────────────────────────────
  // SHELL
  // ─────────────────────────────────────────────────────────────────────────
  const navItems = [
    { key:"home",   icon:"◉", label:"Home"   },
    { key:"budget", icon:"◈", label:"Budget" },
    { key:"save",   icon:"◎", label:"Save"   },
    { key:"ask",    icon:"💬", label:"Ask"    },
    { key:"me",     icon:"○", label:"Me"     },
  ];

  const isAsk = tab === "ask";

  return (
    <div ref={appRef} style={{ fontFamily:ff, background:cl.bg, color:cl.t1, height:"100svh", maxWidth:430, margin:"0 auto", display:"flex", flexDirection:"column", overflow:"hidden" }}>

      {/* Wordmark */}
      {!isAsk && (
        <div style={{ position:"fixed", top:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, zIndex:10, padding:"12px 20px 0", display:"flex", justifyContent:"center", background:`linear-gradient(to bottom,${cl.bg} 60%,transparent)`, pointerEvents:"none" }}>
          <span style={{ fontFamily:fs, fontSize:18, fontWeight:600, color:cl.accent, letterSpacing:"0.04em" }}>lucid</span>
        </div>
      )}

      {/* ── All normal screens ── */}
      <div style={{ flex:1, overflowY:"auto", paddingBottom:84, display: isAsk ? "none" : "block" }}>
        {tab==="home"   && <HomeScreen />}
        {tab==="budget" && <BudgetScreen />}
        {tab==="save"   && <SaveScreen />}
        {tab==="import" && <ImportScreen />}
        {tab==="me"     && !showCancel && <MeScreen />}
        {tab==="me"     && showCancel  && <CancelScreen onBack={() => { setShowCancel(false); setMeScreen("overview"); }} />}
      </div>

      {/* ── Ask screen — ALWAYS mounted, hidden with CSS only ── */}
      <div style={{ flex:1, display: isAsk ? "block" : "none", overflowY:"auto", WebkitOverflowScrolling:"touch", position:"relative" }}>

        {/* Header */}
        <div style={{ padding:"52px 18px 12px", borderBottom:`1px solid ${cl.border}`, display:"flex", alignItems:"center", gap:10, background:cl.bg, position:"sticky", top:0, zIndex:2 }}>
          <div style={{ width:32, height:32, borderRadius:"50%", background:cl.accent, color:cl.accentFg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700 }}>L</div>
          <div>
            <p style={{ fontSize:15, fontWeight:600, color:cl.t1, margin:0 }}>Ask Lucid</p>
            <p style={{ fontSize:11, color:cl.accent, margin:0 }}>● Live AI · your real data</p>
          </div>
        </div>

        {/* Quick prompts */}
        {msgs.length < 2 && (
          <div style={{ padding:"10px 18px 4px", display:"flex", flexWrap:"wrap", gap:7 }}>
            {["How's my budget?","What's my top spending category?","How's my credit?","Any subscriptions I should cancel?"].map(q => (
              <button key={q}
                onMouseDown={e => { e.preventDefault(); setInp(q); }}
                onTouchEnd={e => { e.preventDefault(); setInp(q); askInputRef.current?.focus(); }}
                style={{ background:cl.s2, border:`1px solid ${cl.border}`, color:cl.t2, borderRadius:20, padding:"6px 12px", fontSize:12, cursor:"pointer" }}
              >{q}</button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div ref={askMsgsRef} style={{ padding:"12px 18px 120px" }}>
          {msgs.map((msg, i) => (
            <div key={i} style={{ display:"flex", justifyContent: msg.role==="user"?"flex-end":"flex-start", marginBottom:10, alignItems:"flex-start" }}>
              {msg.role==="ai" && (
                <div style={{ width:26, height:26, borderRadius:"50%", background:cl.accent, color:cl.accentFg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0, marginRight:7, marginTop:2 }}>L</div>
              )}
              <div style={{ maxWidth:"78%", background: msg.role==="user"?cl.accent:cl.s2, color: msg.role==="user"?cl.accentFg:cl.t2, borderRadius: msg.role==="user"?"14px 14px 3px 14px":"14px 14px 14px 3px", padding:"10px 13px", fontSize:13, lineHeight:1.55, border: msg.role==="ai"?`1px solid ${cl.border}`:"none" }}>
                {msg.text.split(/(\*\*[^*]+\*\*)|\n/g).map((p, j) => {
                  if (!p) return null;
                  if (p.startsWith("**")&&p.endsWith("**")) return <strong key={j} style={{ color: msg.role==="user"?cl.accentFg:cl.t1 }}>{p.slice(2,-2)}</strong>;
                  return <span key={j}>{p}</span>;
                })}
              </div>
            </div>
          ))}
          {typing && (
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <div style={{ width:26, height:26, borderRadius:"50%", background:cl.accent, color:cl.accentFg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700 }}>L</div>
              <div style={{ background:cl.s2, border:`1px solid ${cl.border}`, borderRadius:"14px 14px 14px 3px", padding:"10px 14px" }}>
                <span style={{ color:cl.t3, fontSize:18, letterSpacing:3 }}>···</span>
              </div>
            </div>
          )}
        </div>

        {/* Input — sticky bottom, keyboard pushes page up naturally */}
        <div style={{ position:"sticky", bottom:0, padding:"10px 18px 18px", borderTop:`1px solid ${cl.border}`, background:cl.s1, display:"flex", gap:10 }}>
          <input
            ref={askInputRef}
            value={inp}
            onChange={e => setInp(e.target.value)}
            onKeyDown={e => e.key==="Enter" && sendMsg()}
            onFocus={() => setTimeout(() => { if(askMsgsRef.current) askMsgsRef.current.scrollTop = askMsgsRef.current.scrollHeight; }, 400)}
            placeholder="Ask anything about your money…"
            enterKeyHint="send"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="sentences"
            spellCheck={false}
            style={{ flex:1, background:cl.s2, border:`1px solid ${cl.border}`, borderRadius:14, padding:"13px 16px", color:cl.t1, fontSize:16, outline:"none", fontFamily:ff, WebkitAppearance:"none" }}
          />
          <button
            onMouseDown={e => { e.preventDefault(); sendMsg(); }}
            style={{ width:48, height:48, borderRadius:14, background: inp.trim()?cl.accent:cl.border, color: inp.trim()?cl.accentFg:cl.t3, border:"none", cursor:"pointer", fontSize:20, flexShrink:0, transition:"background 0.15s" }}
          >→</button>
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ background:cl.s1, borderTop:`1px solid ${cl.border}`, display:"flex", padding:"8px 0 18px", flexShrink:0, zIndex:15 }}>
        {navItems.map(({ key, icon, label }) => (
          <button key={key} onClick={() => { setTab(key); if(key==="me"){ setMeScreen("overview"); setShowCancel(false); } }} style={{ flex:1, background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"5px 0" }}>
            <span style={{ fontSize: key==="ask"?16:18, opacity: tab===key?1:0.28, transition:"opacity 0.15s" }}>{icon}</span>
            <span style={{ fontSize:10, color: tab===key?cl.accent:cl.t3, fontWeight: tab===key?600:400, transition:"color 0.15s" }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}