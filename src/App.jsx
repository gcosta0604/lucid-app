import { useState, useEffect, useRef } from "react";

// ── Tokens ────────────────────────────────────────────────────────────────────
const cl = {
  bg: "#060d08", s1: "#0c1810", s2: "#111e15",
  border: "#1a2e1f", t1: "#dceae1", t2: "#6fa882", t3: "#3d6345",
  accent: "#64f048", accentFg: "#071209",
  warn: "#f4a244", red: "#f26550", blue: "#56a8ff", purple: "#b07bf5",
};
const ff = "'DM Sans', system-ui, sans-serif";
const fs = "'Cormorant Garamond', Georgia, serif";

const getFloatFee = (a, s) => {
  if (s === "free") return 0; if (s === "next") return 1.99;
  return a <= 50 ? 1.49 : a <= 100 ? 2.49 : a <= 150 ? 3.49 : 4.49;
};
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
  { key:"free",    name:"Free",    price:"£0",    sub:"Always free",  current:true,  color:cl.t2,    features:["Payday-cycle budgeting","Smart categorisation","Float up to £50 (standard)","Savings 4.1% AER","Ask Lucid (AI chat)"] },
  { key:"plus",    name:"Plus",    price:"£4.99", sub:"per month",    current:false, color:cl.accent, highlight:true, features:["Everything in Free","Float up to £200 + instant transfers","Credit score monitoring","Debt Reset tool","Open Banking (all banks)","Priority support"] },
  { key:"builder", name:"Builder", price:"£7.99", sub:"per month",    current:false, color:cl.blue,   features:["Everything in Plus","Lucid Card (credit builder)","Credit boost challenges","1-to-1 financial coaching /mo"] },
];

// ── Float score factors ───────────────────────────────────────────────────────
const floatScoreFactors = [
  { name: "Repayment history", score: 100, max: 100, detail: "Always repaid on time — never changes your limit", color: cl.accent },
  { name: "Income consistency", score: 70, max: 100, detail: "Regular salary detected · 3 months of data", color: cl.accent },
  { name: "Account activity",   score: 55, max: 100, detail: "More transaction history increases your limit over time", color: cl.warn },
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

// ─────────────────────────────────────────────────────────────────────────────
// ── NEW: Fee Receipt component
// ─────────────────────────────────────────────────────────────────────────────
function FeeReceipt({ amt, fee, recv, speed, repayDate, onClose }) {
  const ts = new Date().toLocaleString("en-GB", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
  return (
    <div style={{ position:"fixed", inset:0, zIndex:60, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(6px)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ width:"100%", maxWidth:430, background:cl.s1, borderRadius:"20px 20px 0 0", border:`1px solid ${cl.border}`, padding:"24px 20px 36px" }}>

        {/* header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <div>
            <p style={{ fontFamily:fs, fontSize:22, fontWeight:600, color:cl.t1, margin:0 }}>Fee Receipt</p>
            <p style={{ fontSize:11, color:cl.t3, margin:0 }}>{ts}</p>
          </div>
          <div style={{ width:36, height:36, borderRadius:"50%", background:"rgba(100,240,72,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>✅</div>
        </div>

        {/* guarantee badge */}
        <div style={{ ...card({ background:"rgba(100,240,72,0.07)", borderColor:"rgba(100,240,72,0.25)", padding:"12px 14px", marginBottom:16 }) }}>
          <p style={{ fontSize:12, fontWeight:600, color:cl.accent, margin:"0 0 3px" }}>✓ Full-amount guarantee</p>
          <p style={{ fontSize:12, color:cl.t3, margin:0, lineHeight:1.5 }}>
            Your entire £{amt.toFixed(2)} will arrive in <strong style={{ color:cl.t1 }}>one transfer</strong>.
            We never split advances to charge fees multiple times.
          </p>
        </div>

        {/* line items */}
        <div style={{ ...card({ background:cl.s2, padding:"4px 14px", marginBottom:14 }) }}>
          {[
            { k:"Float amount requested", v:`£${amt.toFixed(2)}`,  bold:false },
            { k:"Transfer fee",           v: fee === 0 ? "Free ✓" : `-£${fee.toFixed(2)}`, col: fee === 0 ? cl.accent : cl.warn, bold:false },
            { k:"Amount you receive",     v:`£${recv.toFixed(2)}`, bold:true  },
            { k:"Transfer speed",         v: speed === "free" ? "Standard (1–3 days)" : speed === "next" ? "Next day" : "Instant", bold:false },
            { k:"Interest rate",          v:"0.00% — none",        bold:false },
            { k:"Credit check",           v:"None",                bold:false },
            { k:"Repayment date",         v: repayDate,            bold:false },
            { k:"Repayment amount",       v:`£${amt.toFixed(2)}`,  bold:false },
          ].map(({ k, v, bold, col }) => (
            <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:`1px solid ${cl.border}` }}>
              <span style={{ fontSize:13, color:cl.t3 }}>{k}</span>
              <span style={{ fontSize:13, fontWeight: bold ? 700 : 500, color: col || (bold ? cl.t1 : cl.t2) }}>{v}</span>
            </div>
          ))}
          <p style={{ fontSize:11, color:cl.t3, margin:"10px 0 4px", lineHeight:1.55 }}>
            This receipt confirms every charge associated with your Float. Save or screenshot it — it's yours.
          </p>
        </div>

        <button onClick={onClose} style={{ width:"100%", background:cl.accent, color:cl.accentFg, border:"none", borderRadius:14, padding:15, fontSize:15, fontWeight:600, cursor:"pointer" }}>
          Done
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── NEW: Float Score Explainer
// ─────────────────────────────────────────────────────────────────────────────
function FloatScorePanel({ onClose }) {
  const total = floatScoreFactors.reduce((s, f) => s + f.score, 0);
  const maxTotal = floatScoreFactors.reduce((s, f) => s + f.max, 0);
  const pct = Math.round((total / maxTotal) * 100);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:60, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(6px)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ width:"100%", maxWidth:430, background:cl.s1, borderRadius:"20px 20px 0 0", border:`1px solid ${cl.border}`, padding:"24px 20px 36px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
          <div>
            <p style={{ fontFamily:fs, fontSize:22, fontWeight:600, color:cl.t1, margin:0 }}>Your Float score</p>
            <p style={{ fontSize:12, color:cl.t3, margin:"3px 0 0" }}>Why your limit is £175 — and how to raise it</p>
          </div>
          <button onClick={onClose} style={{ background:"none", border:`1px solid ${cl.border}`, color:cl.t2, borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:13 }}>✕</button>
        </div>

        {/* Big score */}
        <div style={{ ...card({ background:"rgba(100,240,72,0.06)", borderColor:"rgba(100,240,72,0.2)", textAlign:"center", padding:"18px 14px", marginBottom:14 }) }}>
          <p style={{ fontFamily:fs, fontSize:52, fontWeight:600, color:cl.accent, margin:"0 0 2px", lineHeight:1 }}>{pct}<span style={{ fontSize:24, color:cl.t2 }}>%</span></p>
          <p style={{ fontSize:12, color:cl.t3, margin:0 }}>Float eligibility score · updates every pay cycle</p>
          <div style={{ height:6, background:cl.border, borderRadius:6, overflow:"hidden", margin:"12px 0 0" }}>
            <div style={{ height:"100%", width:`${pct}%`, background:cl.accent, borderRadius:6, transition:"width 0.6s" }} />
          </div>
        </div>

        {/* Factor breakdown */}
        <h3 style={{ fontSize:11, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 10px" }}>What makes up your score</h3>
        <div style={{ ...card({ marginBottom:14 }) }}>
          {floatScoreFactors.map((f, i) => {
            const fpct = Math.round((f.score / f.max) * 100);
            return (
              <div key={i} style={{ paddingBottom: i < floatScoreFactors.length - 1 ? 12 : 0, marginBottom: i < floatScoreFactors.length - 1 ? 12 : 0, borderBottom: i < floatScoreFactors.length - 1 ? `1px solid ${cl.border}` : "none" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:13, color:cl.t1, fontWeight:500 }}>{f.name}</span>
                  <span style={{ fontSize:12, color:f.color, fontWeight:600 }}>{fpct}%</span>
                </div>
                <div style={{ height:4, background:cl.border, borderRadius:4, overflow:"hidden", marginBottom:5 }}>
                  <div style={{ height:"100%", width:`${fpct}%`, background:f.color, borderRadius:4, transition:"width 0.5s" }} />
                </div>
                <p style={{ fontSize:12, color:cl.t3, margin:0, lineHeight:1.45 }}>{f.detail}</p>
              </div>
            );
          })}
        </div>

        {/* Promise */}
        <div style={{ ...card({ background:"rgba(244,162,68,0.06)", borderColor:"rgba(244,162,68,0.2)", marginBottom:16 }) }}>
          <p style={{ fontSize:12, color:"#f4c06a", margin:0, lineHeight:1.6 }}>
            <strong>Your limit will never drop if you repay on time.</strong> We only increase limits — never decrease them for on-time repayers. If your score changes we'll always tell you why.
          </p>
        </div>

        <button onClick={onClose} style={{ width:"100%", background:cl.accent, color:cl.accentFg, border:"none", borderRadius:14, padding:14, fontSize:15, fontWeight:600, cursor:"pointer" }}>
          Got it
        </button>
      </div>
    </div>
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
          Float advances and credit monitoring pause until you resubscribe.
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
  const [askOpen, setAskOpen]   = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [msgs, setMsgs] = useState([
    { role:"ai", text:"Hey Gabe 👋 I'm Lucid — your AI finance assistant. I can see your accounts, spending, and credit score. Ask me anything." }
  ]);
  const [inp, setInp]         = useState("");
  const [typing, setTyping]   = useState(false);
  const [connectedBanks, setConnectedBanks] = useState([
    { id:"monzo",   name:"Monzo",   bg:"#ff6b35", init:"M", accounts:[{ name:"Personal", balance:247.83 }] },
    { id:"barclays",name:"Barclays",bg:"#00aeef", init:"B", accounts:[{ name:"Savings",  balance:430.00 }] },
  ]);
  const [bankStep, setBankStep]         = useState(0);
  const [connectingBank, setConnectingBank] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, askOpen]);

  // ── Claude API ──────────────────────────────────────────────────────────────
  const sendMsg = async () => {
    if (!inp.trim()) return;
    const q = inp.trim(); setInp("");
    setMsgs(m => [...m, { role:"user", text:q }]);
    setTyping(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:`You are Lucid, a UK-based AI financial assistant. Honest, direct, never upsell.
User data: Name: Gabe, Balance: £247.83 (Monzo), Savings: £430 at 4.1% AER (Barclays),
Pay cycle: 18 Apr→26 Apr (9 days left), Income: £1,850/mo, Spent: £1,102, Left: £748,
Float available: £175 (interest-free, repaid payday), Credit score: 612/999 (Fair, Experian),
Credit utilisation: 55% (target <30%), Not on electoral roll, Plan: Free tier.
Float fees: Standard free, Next day £1.99, Instant £1.49–£4.49. Full amount in ONE transfer always.
Concise under 120 words, UK English, **bold** key figures only.`,
          messages: msgs.concat([{role:"user",text:q}])
            .map(m => ({ role: m.role==="ai"?"assistant":"user", content: m.text }))
        })
      });
      const data = await res.json();
      setMsgs(m => [...m, { role:"ai", text: data.content?.[0]?.text || "Sorry, try again." }]);
    } catch {
      setMsgs(m => [...m, { role:"ai", text:"Connection issue — try again in a moment." }]);
    }
    setTyping(false);
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
  // HOME — now shows Float eligibility pre-paywall
  // ─────────────────────────────────────────────────────────────────────────
  const HomeScreen = () => (
    <div style={{ padding:"0 18px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"50px 0 20px" }}>
        <div>
          <p style={{ fontSize:12, color:cl.t3, margin:"0 0 2px" }}>Good morning,</p>
          <h1 style={{ fontFamily:fs, fontSize:30, fontWeight:600, color:cl.t1, margin:0 }}>Gabe</h1>
        </div>
        <button onClick={() => setTab("me")} style={{ width:40, height:40, borderRadius:"50%", background:cl.s2, border:`1px solid ${cl.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, cursor:"pointer" }}>🌿</button>
      </div>

      {/* Balance */}
      <div style={{ ...gradCard({ padding:"22px", marginBottom:14, position:"relative", overflow:"hidden" }) }}>
        <div style={{ position:"absolute", top:-20, right:-20, width:100, height:100, borderRadius:"50%", background:"rgba(100,240,72,0.05)" }} />
        <p style={{ fontSize:11, color:cl.t3, letterSpacing:"0.07em", textTransform:"uppercase", margin:"0 0 5px" }}>Total balance</p>
        <h2 style={{ fontFamily:fs, fontSize:44, fontWeight:600, color:cl.t1, margin:"0 0 4px", lineHeight:1 }}>£677<span style={{ fontSize:22, color:cl.t2 }}>.83</span></h2>
        <p style={{ fontSize:12, color:cl.t3, margin:"0 0 14px" }}>{connectedBanks.length} accounts · Open Banking</p>
        <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:10, padding:"10px 12px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
            <span style={{ fontSize:11, color:cl.t3 }}>Pay cycle 18 Apr → 26 Apr</span>
            <span style={{ fontSize:11, color:cl.accent, fontWeight:600 }}>9 days left</span>
          </div>
          <div style={{ height:4, background:"rgba(255,255,255,0.07)", borderRadius:4, overflow:"hidden" }}>
            <div style={{ height:"100%", width:"46%", background:cl.accent, borderRadius:4 }} />
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:14 }}>
        {[
          { icon:"💸", label:"Float",  fn:() => setTab("float") },
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

      {/* ── NEW: Float eligibility card — visible BEFORE paywall ── */}
      <div onClick={() => setTab("float")} style={{ ...card({ cursor:"pointer", marginBottom:12, background:cl.s1, position:"relative", overflow:"hidden" }), borderColor:"rgba(100,240,72,0.3)" }}>
        <div style={{ position:"absolute", top:0, right:0, background:cl.accent, color:cl.accentFg, fontSize:10, fontWeight:700, padding:"4px 12px", borderRadius:"0 14px 0 10px" }}>NO SUBSCRIPTION NEEDED</div>
        <p style={{ fontSize:11, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 4px" }}>Float — interest-free advance</p>
        <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:8 }}>
          <span style={{ fontFamily:fs, fontSize:38, fontWeight:600, color:cl.t1, lineHeight:1 }}>£175</span>
          <span style={{ fontSize:12, color:cl.t3 }}>available right now</span>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {["0% interest", "No credit check", "Repaid 26 Apr", "One transfer, one fee"].map(tag => (
            <span key={tag} style={{ fontSize:11, background:"rgba(100,240,72,0.1)", color:cl.accent, padding:"3px 9px", borderRadius:20 }}>{tag}</span>
          ))}
        </div>
        <p style={{ fontSize:11, color:cl.t3, margin:"8px 0 0" }}>Tap to see full fee schedule before borrowing →</p>
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
        <SpendRing spent={1102.17} total={1850} />
        <div>
          <p style={{ fontSize:11, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.05em", margin:"0 0 3px" }}>This cycle</p>
          <p style={{ fontSize:20, fontWeight:600, color:cl.t1, margin:"0 0 2px" }}>£1,102 <span style={{ fontSize:12, color:cl.t3 }}>spent</span></p>
          <p style={{ fontSize:14, color:cl.accent, margin:"0 0 7px" }}>£748 remaining</p>
          <button onClick={() => setTab("budget")} style={{ fontSize:12, color:cl.t3, background:"none", border:`1px solid ${cl.border}`, borderRadius:8, padding:"4px 10px", cursor:"pointer" }}>Full breakdown →</button>
        </div>
      </div>

      {/* Recent */}
      <h3 style={{ fontSize:12, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 10px" }}>Recent</h3>
      <div style={{ ...card(), marginBottom:24 }}>
        {txns.slice(0,5).map((t, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom: i < 4 ? `1px solid ${cl.border}` : "none" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:cl.s1, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>{t.i}</div>
              <div>
                <p style={{ fontSize:13, color:cl.t1, fontWeight:500, margin:0 }}>{t.m}</p>
                <p style={{ fontSize:11, color:cl.t3, margin:0 }}>{t.cat} · {t.d}</p>
              </div>
            </div>
            <span style={{ fontSize:13, fontWeight:600, color:t.a > 0 ? cl.accent : cl.t1 }}>{t.a > 0 ? "+" : ""}£{Math.abs(t.a).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // BUDGET
  // ─────────────────────────────────────────────────────────────────────────
  const BudgetScreen = () => (
    <div style={{ padding:"0 18px" }}>
      <PageHeader title="18 Apr → 26 Apr" sub="Pay cycle budget" />
      <div style={{ ...card({ display:"flex", justifyContent:"space-between", marginBottom:12 }) }}>
        {[{l:"Income",v:"£1,850",c:cl.t1},{l:"Spent",v:"£1,102",c:cl.warn},{l:"Left",v:"£748",c:cl.accent}].map(({ l, v, c }) => (
          <div key={l} style={{ textAlign:"center" }}>
            <p style={{ fontSize:19, fontWeight:600, color:c, margin:"0 0 3px" }}>{v}</p>
            <p style={{ fontSize:11, color:cl.t3, margin:0 }}>{l}</p>
          </div>
        ))}
      </div>
      <div style={{ ...card({ background:"rgba(100,240,72,0.05)", borderColor:"rgba(100,240,72,0.18)", marginBottom:14 }) }}>
        <p style={{ fontSize:12, color:"#9fe88a", margin:0, lineHeight:1.55 }}>✓ <strong>Payday-cycle budgeting</strong> — resets on your actual pay date, not the 1st.</p>
      </div>
      <h3 style={{ fontSize:12, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 10px" }}>Categories</h3>
      <div style={{ ...card({ marginBottom:14 }) }}>{cats.map((c, i) => <CatBar key={i} {...c} />)}</div>
      <div style={{ ...card({ background:"rgba(242,101,80,0.06)", borderColor:"rgba(242,101,80,0.2)", marginBottom:14 }) }}>
        <p style={{ fontSize:13, fontWeight:500, color:cl.red, margin:"0 0 2px" }}>🎉 Going out — £6.80 over budget</p>
        <p style={{ fontSize:12, color:cl.t3, margin:0 }}>9 days left to recover.</p>
      </div>
      <h3 style={{ fontSize:12, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 10px" }}>All transactions</h3>
      <div style={{ ...card(), marginBottom:24 }}>
        {txns.map((t, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 0", borderBottom: i < txns.length-1 ? `1px solid ${cl.border}` : "none" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:30, height:30, borderRadius:8, background:cl.s1, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>{t.i}</div>
              <div>
                <p style={{ fontSize:13, color:cl.t1, fontWeight:500, margin:0 }}>{t.m}</p>
                <p style={{ fontSize:11, color:cl.t3, margin:0 }}>{t.cat} · {t.d}</p>
              </div>
            </div>
            <span style={{ fontSize:13, fontWeight:600, color:t.a > 0 ? cl.accent : cl.t1 }}>{t.a > 0 ? "+" : ""}£{Math.abs(t.a).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // FLOAT — with Float Score + Fee Receipt
  // ─────────────────────────────────────────────────────────────────────────
  const FloatScreen = () => {
    const [step, setStep]         = useState(0);
    const [amt, setAmt]           = useState(100);
    const [speed, setSpeed]       = useState("free");
    const [done, setDone]         = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [showScore, setShowScore]     = useState(false);
    const fee = getFloatFee(amt, speed), recv = amt - fee;

    if (done) return (
      <>
        <div style={{ padding:"0 18px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"80vh", textAlign:"center" }}>
          <div style={{ fontSize:60, marginBottom:16 }}>✅</div>
          <h2 style={{ fontFamily:fs, fontSize:32, color:cl.t1, margin:"0 0 8px" }}>Float sent</h2>
          <p style={{ fontSize:16, color:cl.accent, margin:"0 0 4px" }}>£{recv.toFixed(2)} on its way</p>
          <p style={{ fontSize:12, color:cl.t3, marginBottom:6 }}>
            {speed==="free" ? "1–3 business days · free" : speed==="next" ? "Tomorrow · £1.99" : `Within minutes · £${fee.toFixed(2)}`}
          </p>
          <p style={{ fontSize:12, color:cl.t3, marginBottom:22 }}>
            Repayment of <strong style={{ color:cl.t2 }}>£{amt.toFixed(2)}</strong> on <strong style={{ color:cl.t2 }}>26 Apr</strong> · 0% interest
          </p>
          <button onClick={() => setShowReceipt(true)} style={{ width:"100%", background:"none", border:`1px solid ${cl.accent}`, color:cl.accent, borderRadius:14, padding:14, fontSize:14, cursor:"pointer", marginBottom:10 }}>
            View fee receipt →
          </button>
          <button onClick={() => { setDone(false); setStep(0); setTab("home"); }} style={{ width:"100%", background:cl.accent, color:cl.accentFg, border:"none", borderRadius:14, padding:14, fontSize:15, fontWeight:600, cursor:"pointer" }}>
            Back to home
          </button>
        </div>
        {showReceipt && <FeeReceipt amt={amt} fee={fee} recv={recv} speed={speed} repayDate="26 Apr 2026" onClose={() => setShowReceipt(false)} />}
      </>
    );

    return (
      <>
        <div style={{ padding:"0 18px" }}>
          <PageHeader title="Float" sub="Interest-free · no credit check" />

          {/* Step indicator */}
          <div style={{ display:"flex", gap:6, marginBottom:18 }}>
            {["Fees","Amount","Confirm"].map((s, i) => (
              <div key={s} style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:22, height:22, borderRadius:"50%", background: step>=i ? cl.accent : cl.border, color: step>=i ? cl.accentFg : cl.t3, fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{i+1}</div>
                <span style={{ fontSize:11, color: step===i ? cl.t1 : cl.t3 }}>{s}</span>
                {i < 2 && <span style={{ color:cl.t3, fontSize:10 }}>›</span>}
              </div>
            ))}
          </div>

          {/* ── STEP 0: Fees first ─────────────────────────────────────────── */}
          {step===0 && (<>
            <div style={{ ...gradCard({ marginBottom:12 }) }}>
              <p style={{ fontSize:11, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 5px" }}>Available now</p>
              <p style={{ fontFamily:fs, fontSize:40, fontWeight:600, color:cl.t1, margin:"0 0 3px", lineHeight:1 }}>£175</p>
              <p style={{ fontSize:12, color:cl.t3, margin:"0 0 12px" }}>repaid 26 Apr · 0% interest · no credit check</p>
              {/* Float score link */}
              <button onClick={() => setShowScore(true)} style={{ background:"none", border:`1px solid rgba(100,240,72,0.3)`, color:cl.accent, borderRadius:10, padding:"6px 12px", fontSize:12, cursor:"pointer" }}>
                Why £175? See your Float score →
              </button>
            </div>

            {/* Guarantee banner */}
            <div style={{ ...card({ background:"rgba(100,240,72,0.07)", borderColor:"rgba(100,240,72,0.3)", marginBottom:12, display:"flex", gap:14, alignItems:"flex-start" }) }}>
              <div style={{ width:36, height:36, borderRadius:10, background:"rgba(100,240,72,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>🛡️</div>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:cl.accent, margin:"0 0 3px" }}>Full-amount guarantee</p>
                <p style={{ fontSize:12, color:cl.t2, margin:0, lineHeight:1.5 }}>Your entire amount arrives in <strong style={{ color:cl.t1 }}>one transfer</strong>, one fee. We never split advances into daily tranches to charge fees multiple times.</p>
              </div>
            </div>

            <h3 style={{ fontSize:12, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 9px" }}>Complete fee schedule</h3>
            <div style={{ ...card({ marginBottom:12 }) }}>
              <p style={{ fontSize:12, color:cl.t3, margin:"0 0 10px", lineHeight:1.5 }}>Every charge that exists. Nothing else:</p>
              {[
                ["Standard transfer (1–3 days)", "FREE",     true  ],
                ["Next-day transfer",             "£1.99 flat",false],
                ["Instant · £1–50",               "£1.49",    false],
                ["Instant · £51–100",             "£2.49",    false],
                ["Instant · £101–150",            "£3.49",    false],
                ["Instant · £151–175",            "£4.49",    false],
              ].map(([l, f, hi]) => (
                <div key={l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 10px", borderRadius:8, background: hi ? "rgba(100,240,72,0.07)" : "transparent", marginBottom:2 }}>
                  <span style={{ fontSize:13, color:cl.t2 }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:600, color: hi ? cl.accent : cl.t1 }}>{f}</span>
                </div>
              ))}
            </div>
            <div style={{ ...card({ background:"rgba(244,162,68,0.06)", borderColor:"rgba(244,162,68,0.2)", marginBottom:16 }) }}>
              <p style={{ fontSize:12, color:"#f4c06a", margin:0, lineHeight:1.55 }}>⚡ Repay on time and your limit stays stable or grows. It will never silently drop. If anything changes we'll tell you exactly why.</p>
            </div>
            <button onClick={() => setStep(1)} style={{ width:"100%", background:cl.accent, color:cl.accentFg, border:"none", borderRadius:14, padding:16, fontSize:15, fontWeight:600, cursor:"pointer", marginBottom:22 }}>Choose amount →</button>
          </>)}

          {/* ── STEP 1: Amount + speed ─────────────────────────────────────── */}
          {step===1 && (<>
            <div style={{ ...card({ textAlign:"center", marginBottom:12 }) }}>
              <p style={{ fontFamily:fs, fontSize:52, fontWeight:600, color:cl.t1, margin:"0 0 8px", lineHeight:1 }}>£{amt}</p>
              <input type="range" min={10} max={175} step={5} value={amt} onChange={e => setAmt(Number(e.target.value))} style={{ width:"100%", accentColor:cl.accent, marginBottom:4 }} />
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:11, color:cl.t3 }}>£10</span>
                <span style={{ fontSize:11, color:cl.t3 }}>£175</span>
              </div>
            </div>
            {[
              { key:"free",    l:"Standard", s:"1–3 business days", f:0 },
              { key:"next",    l:"Next day", s:"By tomorrow",       f:1.99 },
              { key:"instant", l:"Instant",  s:"Within minutes",    f:getFloatFee(amt,"instant") },
            ].map(({ key, l, s, f }) => (
              <div key={key} onClick={() => setSpeed(key)} style={{ ...card({ display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", marginBottom:8, borderColor: speed===key ? cl.accent : cl.border, background: speed===key ? "rgba(100,240,72,0.06)" : cl.s2 }) }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${speed===key ? cl.accent : cl.t3}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {speed===key && <div style={{ width:8, height:8, borderRadius:"50%", background:cl.accent }} />}
                  </div>
                  <div><p style={{ fontSize:14, color:cl.t1, fontWeight:500, margin:0 }}>{l}</p><p style={{ fontSize:12, color:cl.t3, margin:0 }}>{s}</p></div>
                </div>
                <span style={{ fontSize:14, fontWeight:600, color: f===0 ? cl.accent : cl.warn }}>{f===0 ? "Free" : `+£${f.toFixed(2)}`}</span>
              </div>
            ))}
            {/* Live cost summary */}
            <div style={{ ...card({ background:cl.s1, margin:"12px 0 14px" }) }}>
              {[["Requested",`£${amt.toFixed(2)}`],["Fee", fee===0?"None":`-£${fee.toFixed(2)}`],["You receive",`£${recv.toFixed(2)}`]].map(([k,v],i) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom: i<2 ? `1px solid ${cl.border}` : "none" }}>
                  <span style={{ fontSize:13, color:cl.t3 }}>{k}</span>
                  <span style={{ fontSize:13, fontWeight: i===2?700:500, color: i===1&&fee>0?cl.warn:i===1?cl.accent:cl.t1 }}>{v}</span>
                </div>
              ))}
              <p style={{ fontSize:11, color:cl.t3, margin:"7px 0 0" }}>Repayment of £{amt.toFixed(2)} on 26 Apr · 0% interest</p>
            </div>
            <div style={{ display:"flex", gap:10, marginBottom:22 }}>
              <button onClick={() => setStep(0)} style={{ flex:1, background:"none", border:`1px solid ${cl.border}`, color:cl.t2, borderRadius:14, padding:14, fontSize:14, cursor:"pointer" }}>← Back</button>
              <button onClick={() => setStep(2)} style={{ flex:2, background:cl.accent, color:cl.accentFg, border:"none", borderRadius:14, padding:14, fontSize:15, fontWeight:600, cursor:"pointer" }}>Review →</button>
            </div>
          </>)}

          {/* ── STEP 2: Confirm ────────────────────────────────────────────── */}
          {step===2 && (<>
            <div style={{ ...card({ textAlign:"center", padding:"24px 20px", marginBottom:12 }) }}>
              <p style={{ fontSize:11, color:cl.t3, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 5px" }}>You'll receive</p>
              <p style={{ fontFamily:fs, fontSize:46, fontWeight:600, color:cl.t1, margin:"0 0 4px", lineHeight:1 }}>£{recv.toFixed(2)}</p>
              <p style={{ fontSize:13, color:cl.t3 }}>{speed==="free"?"1–3 days · free":speed==="next"?`Tomorrow · £1.99`:`Minutes · £${fee.toFixed(2)}`}</p>
            </div>
            {/* Guarantee reminder */}
            <div style={{ ...card({ background:"rgba(100,240,72,0.06)", borderColor:"rgba(100,240,72,0.2)", marginBottom:12 }) }}>
              <p style={{ fontSize:12, color:cl.accent, fontWeight:600, margin:"0 0 2px" }}>🛡️ Full-amount guarantee applies</p>
              <p style={{ fontSize:12, color:cl.t3, margin:0 }}>£{recv.toFixed(2)} arrives in one transfer. A fee receipt will be generated automatically.</p>
            </div>
            <div style={{ ...card({ marginBottom:16 }) }}>
              {[["Amount",`£${amt.toFixed(2)}`],["Fee",fee===0?"None":`£${fee.toFixed(2)}`],["You receive",`£${recv.toFixed(2)}`],["Repayment","26 Apr 2026"],["Interest","0% — none"],["Credit check","None"]].map(([k,v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${cl.border}` }}>
                  <span style={{ fontSize:13, color:cl.t3 }}>{k}</span>
                  <span style={{ fontSize:13, fontWeight:500, color:cl.t1 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:10, marginBottom:22 }}>
              <button onClick={() => setStep(1)} style={{ flex:1, background:"none", border:`1px solid ${cl.border}`, color:cl.t2, borderRadius:14, padding:14, fontSize:14, cursor:"pointer" }}>← Edit</button>
              <button onClick={() => setDone(true)} style={{ flex:2, background:cl.accent, color:cl.accentFg, border:"none", borderRadius:14, padding:14, fontSize:15, fontWeight:600, cursor:"pointer" }}>Confirm ✓</button>
            </div>
          </>)}
        </div>

        {/* Panels */}
        {showScore   && <FloatScorePanel onClose={() => setShowScore(false)} />}
      </>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SAVE
  // ─────────────────────────────────────────────────────────────────────────
  const SaveScreen = () => {
    const [autoSave, setAutoSave] = useState(false);
    const [roundUp,  setRoundUp]  = useState(true);
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
        <p style={{ fontSize:13, color:cl.t1, margin:"0 0 3px" }}>Upgrade to <strong style={{ color:cl.accent }}>Plus (£4.99/mo)</strong> for Float up to £200, instant transfers, credit monitoring →</p>
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
  // ASK OVERLAY
  // ─────────────────────────────────────────────────────────────────────────
  const AskOverlay = () => (
    <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", flexDirection:"column" }}>
      <div onClick={() => setAskOpen(false)} style={{ flex:"0 0 80px", background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)" }} />
      <div style={{ flex:1, background:cl.s1, borderTop:`1px solid ${cl.border}`, borderRadius:"20px 20px 0 0", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"14px 18px 10px", borderBottom:`1px solid ${cl.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:cl.accent, color:cl.accentFg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700 }}>L</div>
            <div>
              <p style={{ fontSize:14, fontWeight:600, color:cl.t1, margin:0 }}>Ask Lucid</p>
              <p style={{ fontSize:11, color:cl.accent, margin:0 }}>● AI · your real financial data</p>
            </div>
          </div>
          <button onClick={() => setAskOpen(false)} style={{ background:"none", border:`1px solid ${cl.border}`, color:cl.t2, borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:13 }}>✕</button>
        </div>
        {msgs.length < 2 && (
          <div style={{ padding:"10px 18px", display:"flex", flexWrap:"wrap", gap:7 }}>
            {["What are your fees?","How's my budget?","Can I get a Float?","How's my credit?"].map(q => (
              <button key={q} onClick={() => setInp(q)} style={{ background:cl.s2, border:`1px solid ${cl.border}`, color:cl.t2, borderRadius:20, padding:"6px 12px", fontSize:12, cursor:"pointer" }}>{q}</button>
            ))}
          </div>
        )}
        <div style={{ flex:1, overflowY:"auto", padding:"8px 18px" }}>
          {msgs.map((msg, i) => (
            <div key={i} style={{ display:"flex", justifyContent: msg.role==="user"?"flex-end":"flex-start", marginBottom:10, alignItems:"flex-start" }}>
              {msg.role==="ai" && <div style={{ width:26, height:26, borderRadius:"50%", background:cl.accent, color:cl.accentFg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0, marginRight:7, marginTop:2 }}>L</div>}
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
          <div ref={endRef} />
        </div>
        <div style={{ padding:"10px 18px 18px", borderTop:`1px solid ${cl.border}`, display:"flex", gap:10 }}>
          <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key==="Enter" && sendMsg()}
            placeholder="Ask anything about your money…"
            style={{ flex:1, background:cl.s2, border:`1px solid ${cl.border}`, borderRadius:12, padding:"11px 14px", color:cl.t1, fontSize:13, outline:"none", fontFamily:ff }} />
          <button onClick={sendMsg} style={{ width:44, height:44, borderRadius:12, background: inp.trim()?cl.accent:cl.border, color: inp.trim()?cl.accentFg:cl.t3, border:"none", cursor:"pointer", fontSize:18, flexShrink:0, transition:"background 0.15s" }}>→</button>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // SHELL
  // ─────────────────────────────────────────────────────────────────────────
  const navItems = [
    { key:"home",   icon:"◉", label:"Home"   },
    { key:"budget", icon:"◈", label:"Budget" },
    { key:"float",  icon:"◇", label:"Float"  },
    { key:"save",   icon:"◎", label:"Save"   },
    { key:"me",     icon:"○", label:"Me"     },
  ];

  return (
    <div style={{ fontFamily:ff, background:cl.bg, color:cl.t1, minHeight:"100vh", maxWidth:430, margin:"0 auto", display:"flex", flexDirection:"column", position:"relative" }}>
      {/* Wordmark */}
      <div style={{ position:"fixed", top:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, zIndex:10, padding:"12px 20px 0", display:"flex", justifyContent:"center", background:`linear-gradient(to bottom,${cl.bg} 60%,transparent)`, pointerEvents:"none" }}>
        <span style={{ fontFamily:fs, fontSize:18, fontWeight:600, color:cl.accent, letterSpacing:"0.04em" }}>lucid</span>
      </div>

      {/* Screen */}
      <div style={{ flex:1, overflowY:"auto", paddingBottom:84 }}>
        {tab==="home"   && <HomeScreen />}
        {tab==="budget" && <BudgetScreen />}
        {tab==="float"  && <FloatScreen />}
        {tab==="save"   && <SaveScreen />}
        {tab==="me"     && !showCancel && <MeScreen />}
        {tab==="me"     && showCancel  && <CancelScreen onBack={() => { setShowCancel(false); setMeScreen("overview"); }} />}
      </div>

      {/* FAB */}
      {!askOpen && (
        <button onClick={() => setAskOpen(true)} style={{ position:"fixed", bottom:92, right:"calc(50% - 215px + 16px)", width:52, height:52, borderRadius:"50%", background:cl.accent, color:cl.accentFg, border:"none", cursor:"pointer", fontSize:22, zIndex:20, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 20px rgba(100,240,72,0.3)` }}>
          💬
        </button>
      )}

      {askOpen   && <AskOverlay />}

      {/* Bottom nav */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:cl.s1, borderTop:`1px solid ${cl.border}`, display:"flex", padding:"8px 0 18px", zIndex:15 }}>
        {navItems.map(({ key, icon, label }) => (
          <button key={key} onClick={() => { setTab(key); if(key==="me"){ setMeScreen("overview"); setShowCancel(false); } }} style={{ flex:1, background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"5px 0" }}>
            <span style={{ fontSize:18, opacity: tab===key?1:0.28, transition:"opacity 0.15s" }}>{icon}</span>
            <span style={{ fontSize:10, color: tab===key?cl.accent:cl.t3, fontWeight: tab===key?600:400, transition:"color 0.15s" }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
