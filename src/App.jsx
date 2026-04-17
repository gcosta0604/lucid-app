import { useState, useEffect, useRef } from "react";

// ── Tokens ───────────────────────────────────────────────────────────────────
const cl = {
  bg: "#060d08", s1: "#0c1810", s2: "#111e15", s3: "#162119",
  border: "#1a2e1f", t1: "#dceae1", t2: "#6fa882", t3: "#3d6345",
  accent: "#64f048", accentFg: "#071209",
  warn: "#f4a244", red: "#f26550", blue: "#56a8ff", purple: "#b07bf5",
};
const ff = "'DM Sans', system-ui, sans-serif";
const fs = "'Cormorant Garamond', Georgia, serif";

// ── Helpers ──────────────────────────────────────────────────────────────────
const getFloatFee = (a, s) => {
  if (s === "free") return 0; if (s === "next") return 1.99;
  return a <= 50 ? 1.49 : a <= 100 ? 2.49 : a <= 150 ? 3.49 : 4.49;
};
const card = (e = {}) => ({ background: cl.s2, border: `1px solid ${cl.border}`, borderRadius: 16, padding: "16px 18px", ...e });
const gradCard = (e = {}) => ({ ...card(), background: "linear-gradient(145deg,#162b1a,#0e1e13)", borderColor: "#235530", ...e });

// ── Static data ──────────────────────────────────────────────────────────────
const txns = [
  { m: "Gail's Bakery", cat: "Food & Drink", a: -4.80, d: "Today", i: "☕" },
  { m: "TfL", cat: "Transport", a: -2.90, d: "Today", i: "🚇" },
  { m: "Salary – Compass", cat: "Income", a: 1850.00, d: "18 Apr", i: "💷" },
  { m: "Tesco Express", cat: "Groceries", a: -23.40, d: "17 Apr", i: "🛒" },
  { m: "Monzo Flex", cat: "Bills", a: -45.00, d: "17 Apr", i: "💳" },
  { m: "Deliveroo", cat: "Food & Drink", a: -18.90, d: "16 Apr", i: "🍕" },
  { m: "Spotify Premium", cat: "Subscriptions", a: -11.99, d: "15 Apr", i: "🎵" },
  { m: "Sainsbury's", cat: "Groceries", a: -31.20, d: "14 Apr", i: "🛒" },
];
const cats = [
  { name: "Food & Drink", amt: 312.40, lim: 350, color: cl.accent, icon: "🍽️" },
  { name: "Transport", amt: 98.60, lim: 120, color: cl.blue, icon: "🚇" },
  { name: "Groceries", amt: 189.50, lim: 200, color: cl.purple, icon: "🛒" },
  { name: "Subscriptions", amt: 47.98, lim: 50, color: cl.warn, icon: "📱" },
  { name: "Going out", amt: 156.80, lim: 150, color: cl.red, icon: "🎉" },
  { name: "Self care", amt: 88.20, lim: 100, color: "#34d399", icon: "✨" },
];
const creditData = {
  score: 612, max: 999, band: "Fair",
  history: [{ m: "Nov", s: 580 }, { m: "Dec", s: 591 }, { m: "Jan", s: 598 }, { m: "Feb", s: 605 }, { m: "Mar", s: 609 }, { m: "Apr", s: 612 }],
  factors: [
    { name: "Payment history", status: "good", detail: "No missed payments in 2 years" },
    { name: "Credit history length", status: "ok", detail: "Average account age: 3.2 years" },
    { name: "Credit utilisation", status: "bad", detail: "55% used — aim under 30%" },
    { name: "Electoral roll", status: "bad", detail: "Not registered — adds up to 50 pts" },
    { name: "Hard searches", status: "good", detail: "None in the last 6 months" },
  ],
};
const ukBanks = [
  { id: "hsbc", name: "HSBC", bg: "#db0011", init: "H" },
  { id: "lloyds", name: "Lloyds", bg: "#006a4e", init: "L" },
  { id: "natwest", name: "NatWest", bg: "#42145f", init: "N" },
  { id: "starling", name: "Starling", bg: "#6935d3", init: "S" },
  { id: "santander", name: "Santander", bg: "#ec0000", init: "Sa" },
  { id: "halifax", name: "Halifax", bg: "#005eb8", init: "Ha" },
  { id: "nationwide", name: "Nationwide", bg: "#0f5ea2", init: "Nw" },
  { id: "virgin", name: "Virgin Money", bg: "#e10514", init: "V" },
];
const plans = [
  { key: "free", name: "Free", price: "£0", sub: "Always free", current: true, color: cl.t2, features: ["Payday-cycle budgeting", "Smart categorisation", "Float up to £50 (standard)", "Savings 4.1% AER", "Ask Lucid (AI chat)"] },
  { key: "plus", name: "Plus", price: "£4.99", sub: "per month", current: false, color: cl.accent, highlight: true, features: ["Everything in Free", "Float up to £200 + instant transfers", "Credit score monitoring", "Debt Reset tool", "Open Banking (all banks)", "Priority support"] },
  { key: "builder", name: "Builder", price: "£7.99", sub: "per month", current: false, color: cl.blue, features: ["Everything in Plus", "Lucid Card (credit builder)", "Credit boost challenges", "1-to-1 financial coaching /mo"] },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function SpendRing({ spent, total, size = 116 }) {
  const r = 46, circ = 2 * Math.PI * r, pct = Math.min(spent / total, 1), over = spent > total;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke={cl.border} strokeWidth="7" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={over ? cl.red : cl.accent}
        strokeWidth="7" strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 50 50)" style={{ transition: "stroke-dasharray 0.6s" }} />
      <text x="50" y="46" textAnchor="middle" fill={cl.t1} fontSize="13" fontFamily={ff} fontWeight="600">£{Math.round(spent)}</text>
      <text x="50" y="60" textAnchor="middle" fill={cl.t3} fontSize="9" fontFamily={ff}>of £{Math.round(total)}</text>
    </svg>
  );
}

function CreditDial({ score, max = 999 }) {
  const pct = score / max, r = 48, cx = 65, cy = 65;
  const circ = 2 * Math.PI * r, arcLen = circ * (240 / 360), fill = pct * arcLen;
  const scoreColor = score < 561 ? cl.red : score < 721 ? cl.warn : score < 881 ? cl.accent : "#22c55e";
  const band = score < 561 ? "Poor" : score < 721 ? "Fair" : score < 881 ? "Good" : "Excellent";
  return (
    <svg width={130} height={120} viewBox="0 0 130 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={cl.border} strokeWidth="10"
        strokeDasharray={`${arcLen} ${circ - arcLen}`} strokeLinecap="round"
        transform={`rotate(150 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={scoreColor} strokeWidth="10"
        strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
        transform={`rotate(150 ${cx} ${cy})`} style={{ transition: "stroke-dasharray 0.9s ease" }} />
      <text x={cx} y={cy - 4} textAnchor="middle" fill={cl.t1} fontSize="26" fontFamily={fs} fontWeight="600">{score}</text>
      <text x={cx} y={cy + 13} textAnchor="middle" fill={cl.t3} fontSize="10" fontFamily={ff}>out of {max}</text>
      <text x={cx} y={cx + 28} textAnchor="middle" fill={scoreColor} fontSize="12" fontFamily={ff} fontWeight="600">{band}</text>
    </svg>
  );
}

function ScoreSparkline({ data }) {
  const w = 280, h = 60, pad = 8;
  const min = Math.min(...data.map(d => d.s)) - 10;
  const max = Math.max(...data.map(d => d.s)) + 10;
  const toX = i => pad + (i / (data.length - 1)) * (w - pad * 2);
  const toY = s => h - pad - ((s - min) / (max - min)) * (h - pad * 2);
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
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: cl.t1 }}>{icon} {name}</span>
        <span style={{ fontSize: 12 }}>
          <span style={{ color: over ? cl.red : cl.t2 }}>£{amt.toFixed(2)}</span>
          <span style={{ color: cl.t3 }}> / £{lim}</span>
        </span>
      </div>
      <div style={{ height: 5, background: cl.border, borderRadius: 6, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: over ? cl.red : color, borderRadius: 6, transition: "width 0.5s" }} />
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function LucidApp() {
  const [tab, setTab] = useState("home");
  const [meScreen, setMeScreen] = useState("overview"); // overview | credit | banks | plan
  const [askOpen, setAskOpen] = useState(false);
  const [msgs, setMsgs] = useState([
    { role: "ai", text: "Hey Gabe 👋 I'm Lucid — your AI finance assistant. I can see your accounts, spending, and credit score. Ask me anything." }
  ]);
  const [inp, setInp] = useState("");
  const [typing, setTyping] = useState(false);
  const [connectedBanks, setConnectedBanks] = useState([
    { id: "monzo", name: "Monzo", bg: "#ff6b35", init: "M", accounts: [{ name: "Personal", balance: 247.83 }] },
    { id: "barclays", name: "Barclays", bg: "#00aeef", init: "B", accounts: [{ name: "Savings", balance: 430.00 }] },
  ]);
  const [bankStep, setBankStep] = useState(0); // 0=list, 1=picker, 2=connecting, 3=done
  const [connectingBank, setConnectingBank] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, askOpen]);

  // ── Real Claude API call ──────────────────────────────────────────────────
  const sendMsg = async () => {
    if (!inp.trim()) return;
    const q = inp.trim(); setInp("");
    setMsgs(m => [...m, { role: "user", text: q }]);
    setTyping(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are Lucid, a UK-based AI financial assistant. You are honest, direct, and never upsell. You know the user's financial data:
- Name: Gabe
- Current balance: £247.83 (Monzo)
- Savings: £430.00 at 4.1% AER (Barclays)
- Pay cycle: 18 Apr → 26 Apr (9 days left)
- Monthly income: £1,850
- Spent this cycle: £1,102.17
- Remaining: £747.83
- Float available: £175 (interest-free advance, repaid on payday)
- Credit score: 612/999 (Fair, Experian)
- Credit utilisation: 55% (needs to be below 30%)
- Not registered on electoral roll (would add up to 50 pts)
- Current plan: Free tier
Float fees: Standard (3 days) = free, Next day = £1.99, Instant = £1.49–£4.49 based on amount
Keep responses concise (under 120 words), use plain UK English. No asterisks on sentences. Use **bold** only for key figures. Never push a subscription upgrade unless directly asked. Always answer the actual question first.`,
          messages: msgs.filter(m => m.role !== "system").concat([{ role: "user", content: q }])
            .map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text }))
        })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't get a response right now.";
      setMsgs(m => [...m, { role: "ai", text: reply }]);
    } catch {
      setMsgs(m => [...m, { role: "ai", text: "Connection issue — try again in a moment." }]);
    }
    setTyping(false);
  };

  // ── Connect bank flow ────────────────────────────────────────────────────
  const connectBank = async (bank) => {
    setConnectingBank(bank); setBankStep(2);
    await new Promise(r => setTimeout(r, 2200));
    const mockBalance = Math.floor(Math.random() * 1800) + 200;
    setConnectedBanks(b => [...b, { ...bank, accounts: [{ name: "Current", balance: mockBalance }] }]);
    setBankStep(3);
  };

  // ── Shared layout pieces ──────────────────────────────────────────────────
  const PageHeader = ({ title, sub, backFn }) => (
    <div style={{ padding: "50px 18px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
      {backFn && (
        <button onClick={backFn} style={{ background: "none", border: `1px solid ${cl.border}`, color: cl.t2, borderRadius: 10, padding: "6px 10px", cursor: "pointer", fontSize: 14, marginTop: 4, flexShrink: 0 }}>←</button>
      )}
      <div>
        <p style={{ fontSize: 11, color: cl.t3, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 3px" }}>{sub}</p>
        <h1 style={{ fontFamily: fs, fontSize: 28, fontWeight: 600, color: cl.t1, margin: 0 }}>{title}</h1>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // HOME
  // ─────────────────────────────────────────────────────────────────────────
  const HomeScreen = () => (
    <div style={{ padding: "0 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "50px 0 20px" }}>
        <div>
          <p style={{ fontSize: 12, color: cl.t3, margin: "0 0 2px" }}>Good morning,</p>
          <h1 style={{ fontFamily: fs, fontSize: 30, fontWeight: 600, color: cl.t1, margin: 0 }}>Gabe</h1>
        </div>
        <button onClick={() => setTab("me")} style={{ width: 40, height: 40, borderRadius: "50%", background: cl.s2, border: `1px solid ${cl.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer" }}>🌿</button>
      </div>
      <div style={{ ...gradCard({ padding: "22px", marginBottom: 14, position: "relative", overflow: "hidden" }) }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(100,240,72,0.05)" }} />
        <p style={{ fontSize: 11, color: cl.t3, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 5px" }}>Total balance</p>
        <h2 style={{ fontFamily: fs, fontSize: 44, fontWeight: 600, color: cl.t1, margin: "0 0 4px", lineHeight: 1 }}>
          £{(247.83 + 430.00 + connectedBanks.reduce((s, b) => s + b.accounts.reduce((a, ac) => ac.name !== "Savings" ? a + (ac.balance === 430.00 ? 0 : ac.balance) : a, 0), 0)).toFixed(2)}
        </h2>
        <p style={{ fontSize: 12, color: cl.t3, margin: "0 0 14px" }}>{connectedBanks.length} connected account{connectedBanks.length !== 1 ? "s" : ""} · via Open Banking</p>
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: cl.t3 }}>Pay cycle 18 Apr → 26 Apr</span>
            <span style={{ fontSize: 11, color: cl.accent, fontWeight: 600 }}>9 days left</span>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: "46%", background: cl.accent, borderRadius: 4 }} />
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          { icon: "💸", label: "Float", to: "float" },
          { icon: "🏦", label: "Save", to: "save" },
          { icon: "📊", label: "Budget", to: "budget" },
          { icon: "★", label: "Credit", fn: () => { setTab("me"); setMeScreen("credit"); } },
        ].map(({ icon, label, to, fn }) => (
          <button key={label} onClick={fn || (() => setTab(to))} style={{ ...card({ padding: "12px 6px", textAlign: "center", cursor: "pointer", background: cl.s1 }) }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 11, color: cl.t2 }}>{label}</div>
          </button>
        ))}
      </div>
      {/* Credit score nudge */}
      <div onClick={() => { setTab("me"); setMeScreen("credit"); }} style={{ ...card({ background: cl.s1, borderColor: "rgba(244,162,68,0.25)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }) }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: cl.t1, margin: "0 0 2px" }}>Experian credit score</p>
          <p style={{ fontSize: 12, color: cl.warn, margin: 0 }}>612 · Fair — 2 actions to improve →</p>
        </div>
        <div style={{ fontFamily: fs, fontSize: 28, fontWeight: 600, color: cl.warn }}>612</div>
      </div>
      <div style={{ ...card({ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }) }}>
        <SpendRing spent={1102.17} total={1850} />
        <div>
          <p style={{ fontSize: 11, color: cl.t3, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 3px" }}>This cycle</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: cl.t1, margin: "0 0 2px" }}>£1,102 <span style={{ fontSize: 12, color: cl.t3 }}>spent</span></p>
          <p style={{ fontSize: 14, color: cl.accent, margin: "0 0 7px" }}>£748 remaining</p>
          <button onClick={() => setTab("budget")} style={{ fontSize: 12, color: cl.t3, background: "none", border: `1px solid ${cl.border}`, borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}>Full breakdown →</button>
        </div>
      </div>
      <h3 style={{ fontSize: 12, color: cl.t3, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>Recent</h3>
      <div style={{ ...card(), marginBottom: 24 }}>
        {txns.slice(0, 5).map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 4 ? `1px solid ${cl.border}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: cl.s1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{t.i}</div>
              <div>
                <p style={{ fontSize: 13, color: cl.t1, fontWeight: 500, margin: 0 }}>{t.m}</p>
                <p style={{ fontSize: 11, color: cl.t3, margin: 0 }}>{t.cat} · {t.d}</p>
              </div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: t.a > 0 ? cl.accent : cl.t1 }}>{t.a > 0 ? "+" : ""}£{Math.abs(t.a).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // BUDGET
  // ─────────────────────────────────────────────────────────────────────────
  const BudgetScreen = () => (
    <div style={{ padding: "0 18px" }}>
      <PageHeader title="18 Apr → 26 Apr" sub="Pay cycle budget" />
      <div style={{ ...card({ display: "flex", justifyContent: "space-between", marginBottom: 12 }) }}>
        {[{ l: "Income", v: "£1,850", c: cl.t1 }, { l: "Spent", v: "£1,102", c: cl.warn }, { l: "Left", v: "£748", c: cl.accent }].map(({ l, v, c }) => (
          <div key={l} style={{ textAlign: "center" }}>
            <p style={{ fontSize: 19, fontWeight: 600, color: c, margin: "0 0 3px" }}>{v}</p>
            <p style={{ fontSize: 11, color: cl.t3, margin: 0 }}>{l}</p>
          </div>
        ))}
      </div>
      <div style={{ ...card({ background: "rgba(100,240,72,0.05)", borderColor: "rgba(100,240,72,0.18)", marginBottom: 14 }) }}>
        <p style={{ fontSize: 12, color: "#9fe88a", margin: 0, lineHeight: 1.55 }}>✓ <strong>Payday-cycle budgeting</strong> — resets on your actual pay date, not the 1st of the month.</p>
      </div>
      <h3 style={{ fontSize: 12, color: cl.t3, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>Categories</h3>
      <div style={{ ...card({ marginBottom: 14 }) }}>{cats.map((c, i) => <CatBar key={i} {...c} />)}</div>
      <div style={{ ...card({ background: "rgba(242,101,80,0.06)", borderColor: "rgba(242,101,80,0.2)", marginBottom: 14 }) }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: cl.red, margin: "0 0 2px" }}>🎉 Going out — £6.80 over budget</p>
        <p style={{ fontSize: 12, color: cl.t3, margin: 0 }}>9 days left to recover.</p>
      </div>
      <h3 style={{ fontSize: 12, color: cl.t3, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>All transactions</h3>
      <div style={{ ...card(), marginBottom: 24 }}>
        {txns.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: i < txns.length - 1 ? `1px solid ${cl.border}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: cl.s1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{t.i}</div>
              <div>
                <p style={{ fontSize: 13, color: cl.t1, fontWeight: 500, margin: 0 }}>{t.m}</p>
                <p style={{ fontSize: 11, color: cl.t3, margin: 0 }}>{t.cat} · {t.d}</p>
              </div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: t.a > 0 ? cl.accent : cl.t1 }}>{t.a > 0 ? "+" : ""}£{Math.abs(t.a).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // FLOAT
  // ─────────────────────────────────────────────────────────────────────────
  const FloatScreen = () => {
    const [step, setStep] = useState(0);
    const [amt, setAmt] = useState(100);
    const [speed, setSpeed] = useState("free");
    const [done, setDone] = useState(false);
    const fee = getFloatFee(amt, speed), recv = amt - fee;
    if (done) return (
      <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", textAlign: "center" }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontFamily: fs, fontSize: 32, color: cl.t1, margin: "0 0 8px" }}>Float sent</h2>
        <p style={{ fontSize: 16, color: cl.accent, margin: "0 0 4px" }}>£{recv.toFixed(2)} on its way</p>
        <p style={{ fontSize: 12, color: cl.t3, marginBottom: 28 }}>Repayment of <strong style={{ color: cl.t2 }}>£{amt.toFixed(2)}</strong> on <strong style={{ color: cl.t2 }}>26 Apr</strong> · no interest</p>
        <button onClick={() => { setDone(false); setStep(0); setTab("home"); }} style={{ background: cl.accent, color: cl.accentFg, border: "none", borderRadius: 14, padding: "14px 36px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Back to home</button>
      </div>
    );
    return (
      <div style={{ padding: "0 18px" }}>
        <PageHeader title="Float" sub="Interest-free · no credit check" />
        <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
          {["Fees", "Amount", "Confirm"].map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: step >= i ? cl.accent : cl.border, color: step >= i ? cl.accentFg : cl.t3, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
              <span style={{ fontSize: 11, color: step === i ? cl.t1 : cl.t3 }}>{s}</span>
              {i < 2 && <span style={{ color: cl.t3, fontSize: 10 }}>›</span>}
            </div>
          ))}
        </div>
        {step === 0 && (<>
          <div style={{ ...gradCard({ marginBottom: 12 }) }}>
            <p style={{ fontSize: 11, color: cl.t3, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 5px" }}>Available now</p>
            <p style={{ fontFamily: fs, fontSize: 40, fontWeight: 600, color: cl.t1, margin: "0 0 3px", lineHeight: 1 }}>£175</p>
            <p style={{ fontSize: 12, color: cl.t3 }}>repaid 26 Apr · no interest ever</p>
          </div>
          <h3 style={{ fontSize: 12, color: cl.t3, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 9px" }}>Complete fee schedule</h3>
          <div style={{ ...card({ marginBottom: 12 }) }}>
            <p style={{ fontSize: 12, color: cl.t3, margin: "0 0 10px", lineHeight: 1.5 }}>No interest. No hidden charges. Every cost, upfront:</p>
            {[["Standard transfer (1–3 days)", "FREE", true], ["Next-day transfer", "£1.99 flat", false], ["Instant · £1–50", "£1.49", false], ["Instant · £51–100", "£2.49", false], ["Instant · £101–150", "£3.49", false], ["Instant · £151–175", "£4.49", false]].map(([l, f, hi]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", borderRadius: 8, background: hi ? "rgba(100,240,72,0.07)" : "transparent", marginBottom: 2 }}>
                <span style={{ fontSize: 13, color: cl.t2 }}>{l}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: hi ? cl.accent : cl.t1 }}>{f}</span>
              </div>
            ))}
          </div>
          <div style={{ ...card({ background: "rgba(244,162,68,0.06)", borderColor: "rgba(244,162,68,0.2)", marginBottom: 16 }) }}>
            <p style={{ fontSize: 12, color: "#f4c06a", margin: 0, lineHeight: 1.55 }}>⚡ Your limit won't randomly drop if you repay on time. We don't split your advance into smaller tranches to charge fees twice.</p>
          </div>
          <button onClick={() => setStep(1)} style={{ width: "100%", background: cl.accent, color: cl.accentFg, border: "none", borderRadius: 14, padding: 16, fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 22 }}>Choose amount →</button>
        </>)}
        {step === 1 && (<>
          <div style={{ ...card({ textAlign: "center", marginBottom: 12 }) }}>
            <p style={{ fontFamily: fs, fontSize: 52, fontWeight: 600, color: cl.t1, margin: "0 0 8px", lineHeight: 1 }}>£{amt}</p>
            <input type="range" min={10} max={175} step={5} value={amt} onChange={e => setAmt(Number(e.target.value))} style={{ width: "100%", accentColor: cl.accent, marginBottom: 4 }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: cl.t3 }}>£10</span><span style={{ fontSize: 11, color: cl.t3 }}>£175</span>
            </div>
          </div>
          {[{ key: "free", l: "Standard", s: "1–3 business days", f: 0 }, { key: "next", l: "Next day", s: "By tomorrow", f: 1.99 }, { key: "instant", l: "Instant", s: "Within minutes", f: getFloatFee(amt, "instant") }].map(({ key, l, s, f }) => (
            <div key={key} onClick={() => setSpeed(key)} style={{ ...card({ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: 8, borderColor: speed === key ? cl.accent : cl.border, background: speed === key ? "rgba(100,240,72,0.06)" : cl.s2 }) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${speed === key ? cl.accent : cl.t3}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {speed === key && <div style={{ width: 8, height: 8, borderRadius: "50%", background: cl.accent }} />}
                </div>
                <div><p style={{ fontSize: 14, color: cl.t1, fontWeight: 500, margin: 0 }}>{l}</p><p style={{ fontSize: 12, color: cl.t3, margin: 0 }}>{s}</p></div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: f === 0 ? cl.accent : cl.warn }}>{f === 0 ? "Free" : `+£${f.toFixed(2)}`}</span>
            </div>
          ))}
          <div style={{ ...card({ background: cl.s1, margin: "12px 0 14px" }) }}>
            {[["Requested", `£${amt.toFixed(2)}`], ["Fee", fee === 0 ? "None" : `-£${fee.toFixed(2)}`], ["You receive", `£${recv.toFixed(2)}`]].map(([k, v], i) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: i < 2 ? `1px solid ${cl.border}` : "none" }}>
                <span style={{ fontSize: 13, color: cl.t3 }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: i === 2 ? 700 : 500, color: i === 1 && fee > 0 ? cl.warn : i === 1 ? cl.accent : cl.t1 }}>{v}</span>
              </div>
            ))}
            <p style={{ fontSize: 11, color: cl.t3, margin: "7px 0 0" }}>Repayment of £{amt.toFixed(2)} on 26 Apr · 0% interest</p>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
            <button onClick={() => setStep(0)} style={{ flex: 1, background: "none", border: `1px solid ${cl.border}`, color: cl.t2, borderRadius: 14, padding: 14, fontSize: 14, cursor: "pointer" }}>← Back</button>
            <button onClick={() => setStep(2)} style={{ flex: 2, background: cl.accent, color: cl.accentFg, border: "none", borderRadius: 14, padding: 14, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Review →</button>
          </div>
        </>)}
        {step === 2 && (<>
          <div style={{ ...card({ textAlign: "center", padding: "24px 20px", marginBottom: 12 }) }}>
            <p style={{ fontSize: 11, color: cl.t3, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 5px" }}>You'll receive</p>
            <p style={{ fontFamily: fs, fontSize: 46, fontWeight: 600, color: cl.t1, margin: "0 0 4px", lineHeight: 1 }}>£{recv.toFixed(2)}</p>
            <p style={{ fontSize: 13, color: cl.t3 }}>{speed === "free" ? "In 1–3 business days · free" : speed === "next" ? "Tomorrow · £1.99" : `Within minutes · £${fee.toFixed(2)}`}</p>
          </div>
          <div style={{ ...card({ marginBottom: 16 }) }}>
            {[["Amount", `£${amt.toFixed(2)}`], ["Fee", fee === 0 ? "None" : `£${fee.toFixed(2)}`], ["You receive", `£${recv.toFixed(2)}`], ["Repayment", "26 Apr 2026"], ["Interest", "0% — none"], ["Credit check", "None"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${cl.border}` }}>
                <span style={{ fontSize: 13, color: cl.t3 }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: cl.t1 }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
            <button onClick={() => setStep(1)} style={{ flex: 1, background: "none", border: `1px solid ${cl.border}`, color: cl.t2, borderRadius: 14, padding: 14, fontSize: 14, cursor: "pointer" }}>← Edit</button>
            <button onClick={() => setDone(true)} style={{ flex: 2, background: cl.accent, color: cl.accentFg, border: "none", borderRadius: 14, padding: 14, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Confirm ✓</button>
          </div>
        </>)}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SAVE
  // ─────────────────────────────────────────────────────────────────────────
  const SaveScreen = () => {
    const [autoSave, setAutoSave] = useState(false);
    const [roundUp, setRoundUp] = useState(true);
    return (
      <div style={{ padding: "0 18px" }}>
        <PageHeader title="Savings" sub="Easy access · FSCS protected up to £85k" />
        <div style={{ ...gradCard({ marginBottom: 12 }) }}>
          <p style={{ fontSize: 11, color: cl.t3, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 5px" }}>Balance</p>
          <p style={{ fontFamily: fs, fontSize: 44, fontWeight: 600, color: cl.t1, margin: "0 0 10px", lineHeight: 1 }}>£430<span style={{ fontSize: 22, color: cl.t2 }}>.00</span></p>
          <div style={{ display: "flex", gap: 20 }}>
            <div><p style={{ fontSize: 22, fontWeight: 600, color: cl.accent, margin: 0 }}>4.1%</p><p style={{ fontSize: 11, color: cl.t3, margin: 0 }}>AER variable</p></div>
            <div><p style={{ fontSize: 22, fontWeight: 600, color: cl.t2, margin: 0 }}>£17.63</p><p style={{ fontSize: 11, color: cl.t3, margin: 0 }}>Earned this year</p></div>
          </div>
        </div>
        {[{ l: "Auto-save £50/month", s: "Transfers on payday automatically", v: autoSave, fn: setAutoSave }, { l: "Round-up savings", s: "Rounds each spend up to nearest £1", v: roundUp, fn: setRoundUp }].map(({ l, s, v, fn }) => (
          <div key={l} onClick={() => fn(!v)} style={{ ...card({ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, cursor: "pointer" }) }}>
            <div><p style={{ fontSize: 14, color: cl.t1, fontWeight: 500, margin: "0 0 2px" }}>{l}</p><p style={{ fontSize: 12, color: cl.t3, margin: 0 }}>{s}</p></div>
            <div style={{ width: 44, height: 24, borderRadius: 12, background: v ? cl.accent : cl.border, position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
              <div style={{ position: "absolute", top: 2, left: v ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: v ? cl.accentFg : cl.t3, transition: "left 0.2s" }} />
            </div>
          </div>
        ))}
        <div style={{ ...card({ background: "rgba(100,240,72,0.05)", borderColor: "rgba(100,240,72,0.15)", marginBottom: 16 }) }}>
          <p style={{ fontSize: 13, color: cl.t2, fontWeight: 500, margin: "0 0 5px" }}>Save £50/month from here:</p>
          <p style={{ fontSize: 12, color: cl.t3, lineHeight: 1.65, margin: 0 }}>→ £1,030 in 1 year (+£18 interest)<br />→ £1,680 in 2 years (+£72 interest)<br /><span style={{ fontSize: 11, color: cl.t3, opacity: 0.7 }}>4.1% AER variable, monthly compounding</span></p>
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <button style={{ flex: 1, background: cl.accent, color: cl.accentFg, border: "none", borderRadius: 14, padding: 14, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Deposit</button>
          <button style={{ flex: 1, background: "none", border: `1px solid ${cl.border}`, color: cl.t2, borderRadius: 14, padding: 14, fontSize: 15, cursor: "pointer" }}>Withdraw</button>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ME — sub-screens
  // ─────────────────────────────────────────────────────────────────────────
  const MeOverview = () => (
    <div style={{ padding: "0 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "50px 0 18px" }}>
        <div>
          <p style={{ fontSize: 12, color: cl.t3, margin: "0 0 2px" }}>Your profile</p>
          <h1 style={{ fontFamily: fs, fontSize: 28, fontWeight: 600, color: cl.t1, margin: 0 }}>Gabe</h1>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 11, color: cl.t3, margin: "0 0 2px" }}>Current plan</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: cl.t2, margin: 0 }}>Free</p>
        </div>
      </div>
      {/* Credit score card */}
      <div onClick={() => setMeScreen("credit")} style={{ ...card({ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }), borderColor: "rgba(244,162,68,0.3)" }}>
        <div>
          <p style={{ fontSize: 12, color: cl.t3, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 3px" }}>Experian credit score</p>
          <p style={{ fontFamily: fs, fontSize: 32, fontWeight: 600, color: cl.warn, margin: "0 0 2px" }}>612</p>
          <p style={{ fontSize: 12, color: cl.t3, margin: 0 }}>Fair · 2 improvements available →</p>
        </div>
        <CreditDial score={612} />
      </div>
      {/* Open banking card */}
      <div onClick={() => setMeScreen("banks")} style={{ ...card({ cursor: "pointer", marginBottom: 10 }) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: 12, color: cl.t3, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 3px" }}>Open Banking</p>
            <p style={{ fontSize: 14, color: cl.t1, fontWeight: 500, margin: 0 }}>{connectedBanks.length} banks connected</p>
          </div>
          <span style={{ fontSize: 12, color: cl.accent, background: "rgba(100,240,72,0.1)", padding: "4px 10px", borderRadius: 20 }}>Active</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {connectedBanks.map(b => (
            <div key={b.id} style={{ width: 32, height: 32, borderRadius: 8, background: b.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{b.init}</div>
          ))}
          <div style={{ width: 32, height: 32, borderRadius: 8, border: `1px dashed ${cl.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: cl.t3 }}>+</div>
        </div>
      </div>
      {/* Plan card */}
      <div onClick={() => setMeScreen("plan")} style={{ ...card({ cursor: "pointer", marginBottom: 20 }) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <p style={{ fontSize: 12, color: cl.t3, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Your plan</p>
          <span style={{ fontSize: 12, color: cl.t3, background: cl.s1, padding: "4px 10px", borderRadius: 20, border: `1px solid ${cl.border}` }}>Free</span>
        </div>
        <p style={{ fontSize: 13, color: cl.t1, margin: "0 0 3px" }}>Upgrade to <strong style={{ color: cl.accent }}>Plus (£4.99/mo)</strong> for:</p>
        <p style={{ fontSize: 12, color: cl.t3, margin: 0 }}>Float up to £200, instant transfers, credit monitoring →</p>
      </div>
    </div>
  );

  const CreditScreen = () => (
    <div style={{ padding: "0 18px" }}>
      <PageHeader title="Credit score" sub="Experian · updated today" backFn={() => setMeScreen("overview")} />
      <div style={{ ...card({ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", padding: "24px 20px", marginBottom: 12, position: "relative", overflow: "hidden" }) }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(244,162,68,0.05)" }} />
        <CreditDial score={612} />
        <p style={{ fontSize: 13, color: cl.t3, margin: "8px 0 0" }}>Powered by Experian · updated today</p>
      </div>
      <h3 style={{ fontSize: 12, color: cl.t3, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>Score history (6 months)</h3>
      <div style={{ ...card({ marginBottom: 12, overflowX: "hidden" }) }}>
        <ScoreSparkline data={creditData.history} />
        <p style={{ fontSize: 11, color: cl.t3, margin: "10px 0 0" }}>+32 points in 6 months</p>
      </div>
      <h3 style={{ fontSize: 12, color: cl.t3, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 9px" }}>Score factors</h3>
      <div style={{ ...card({ marginBottom: 12 }) }}>
        {creditData.factors.map((f, i) => {
          const col = f.status === "good" ? cl.accent : f.status === "ok" ? cl.warn : cl.red;
          const icon = f.status === "good" ? "✓" : f.status === "ok" ? "~" : "✗";
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < creditData.factors.length - 1 ? `1px solid ${cl.border}` : "none" }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: `${col}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, color: col }}>{icon}</div>
              <div>
                <p style={{ fontSize: 13, color: cl.t1, fontWeight: 500, margin: 0 }}>{f.name}</p>
                <p style={{ fontSize: 12, color: cl.t3, margin: 0 }}>{f.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
      <h3 style={{ fontSize: 12, color: cl.t3, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 9px" }}>Priority actions</h3>
      {[
        { title: "Register on electoral roll", detail: "Could add up to 50 points. Free, takes 5 minutes at gov.uk.", impact: "+50 pts", color: cl.red },
        { title: "Reduce credit utilisation", detail: "You're at 55%. Pay down £250 to reach 30%.", impact: "+30 pts", color: cl.warn },
      ].map(({ title, detail, impact, color }) => (
        <div key={title} style={{ ...card({ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }) }}>
          <div style={{ flex: 1, marginRight: 12 }}>
            <p style={{ fontSize: 13, color: cl.t1, fontWeight: 500, margin: "0 0 2px" }}>{title}</p>
            <p style={{ fontSize: 12, color: cl.t3, margin: 0 }}>{detail}</p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color, background: `${color}18`, padding: "4px 10px", borderRadius: 20, flexShrink: 0 }}>{impact}</span>
        </div>
      ))}
      <div style={{ height: 24 }} />
    </div>
  );

  const BanksScreen = () => (
    <div style={{ padding: "0 18px" }}>
      <PageHeader title="Connected banks" sub="Open Banking via TrueLayer" backFn={() => { setMeScreen("overview"); setBankStep(0); setConnectingBank(null); }} />
      {/* Connected */}
      {connectedBanks.map(b => (
        <div key={b.id} style={{ ...card({ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }) }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: b.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{b.init}</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, color: cl.t1, fontWeight: 500, margin: "0 0 1px" }}>{b.name}</p>
            {b.accounts.map((a, i) => (
              <p key={i} style={{ fontSize: 12, color: cl.t3, margin: 0 }}>{a.name} · £{a.balance.toFixed(2)}</p>
            ))}
          </div>
          <span style={{ fontSize: 11, color: cl.accent, background: "rgba(100,240,72,0.1)", padding: "3px 9px", borderRadius: 12 }}>Connected</span>
        </div>
      ))}
      {/* Connect new */}
      {bankStep === 0 && (
        <button onClick={() => setBankStep(1)} style={{ width: "100%", background: "none", border: `1px dashed ${cl.border}`, color: cl.t2, borderRadius: 14, padding: "16px", fontSize: 14, cursor: "pointer", marginBottom: 12 }}>
          + Connect another bank
        </button>
      )}
      {bankStep === 1 && (<>
        <h3 style={{ fontSize: 12, color: cl.t3, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>Select your bank</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {ukBanks.filter(b => !connectedBanks.find(c => c.id === b.id)).map(b => (
            <button key={b.id} onClick={() => connectBank(b)} style={{ ...card({ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px 14px", background: cl.s1 }) }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: b.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{b.init}</div>
              <span style={{ fontSize: 13, color: cl.t1 }}>{b.name}</span>
            </button>
          ))}
        </div>
        <div style={{ ...card({ background: "rgba(100,240,72,0.05)", borderColor: "rgba(100,240,72,0.15)", marginBottom: 14 }) }}>
          <p style={{ fontSize: 12, color: "#9fe88a", margin: 0, lineHeight: 1.55 }}>🔒 Connected securely via TrueLayer Open Banking. We never store your bank credentials. Read-only access.</p>
        </div>
      </>)}
      {bankStep === 2 && connectingBank && (
        <div style={{ ...card({ textAlign: "center", padding: "32px 20px", marginBottom: 14 }) }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: connectingBank.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 auto 14px" }}>{connectingBank.init}</div>
          <p style={{ fontSize: 15, color: cl.t1, fontWeight: 500, margin: "0 0 6px" }}>Connecting to {connectingBank.name}…</p>
          <p style={{ fontSize: 12, color: cl.t3, margin: "0 0 16px" }}>Authorising via TrueLayer Open Banking</p>
          <div style={{ height: 4, background: cl.border, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: "70%", background: cl.accent, borderRadius: 4, animation: "pulse 1s ease infinite" }} />
          </div>
        </div>
      )}
      {bankStep === 3 && connectingBank && (
        <div style={{ ...card({ textAlign: "center", padding: "28px 20px", background: "rgba(100,240,72,0.06)", borderColor: "rgba(100,240,72,0.25)", marginBottom: 14 }) }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
          <p style={{ fontSize: 15, color: cl.t1, fontWeight: 500, margin: "0 0 4px" }}>{connectingBank.name} connected</p>
          <p style={{ fontSize: 12, color: cl.t3, margin: 0 }}>Accounts and transactions are now syncing</p>
        </div>
      )}
      <div style={{ height: 24 }} />
    </div>
  );

  const PlanScreen = () => {
    const [selected, setSelected] = useState("free");
    return (
      <div style={{ padding: "0 18px" }}>
        <PageHeader title="Choose your plan" sub="Transparent pricing · cancel anytime" backFn={() => setMeScreen("overview")} />
        <div style={{ ...card({ background: "rgba(100,240,72,0.05)", borderColor: "rgba(100,240,72,0.15)", marginBottom: 16 }) }}>
          <p style={{ fontSize: 12, color: "#9fe88a", margin: 0, lineHeight: 1.55 }}>✓ No contracts. No auto-escalating fees. No features gated behind paywalls that used to be free. You can cancel any time, no friction.</p>
        </div>
        {plans.map(plan => (
          <div key={plan.key} onClick={() => setSelected(plan.key)} style={{ ...card({ cursor: "pointer", marginBottom: 10, borderColor: selected === plan.key ? plan.color : cl.border, background: selected === plan.key ? `${plan.color}08` : cl.s2, position: "relative", overflow: "hidden" }) }}>
            {plan.highlight && <div style={{ position: "absolute", top: 12, right: 12, fontSize: 10, fontWeight: 700, color: cl.accentFg, background: cl.accent, padding: "3px 9px", borderRadius: 20 }}>MOST POPULAR</div>}
            {plan.current && <div style={{ position: "absolute", top: 12, right: 12, fontSize: 10, fontWeight: 600, color: cl.t2, background: cl.s1, padding: "3px 9px", borderRadius: 20, border: `1px solid ${cl.border}` }}>YOUR PLAN</div>}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <p style={{ fontFamily: fs, fontSize: 22, fontWeight: 600, color: plan.color, margin: "0 0 2px" }}>{plan.name}</p>
                <p style={{ fontSize: 12, color: cl.t3, margin: 0 }}>{plan.sub}</p>
              </div>
              <p style={{ fontFamily: fs, fontSize: 28, fontWeight: 600, color: cl.t1, margin: 0 }}>{plan.price}</p>
            </div>
            {plan.features.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <span style={{ color: plan.color, fontSize: 13 }}>✓</span>
                <span style={{ fontSize: 13, color: cl.t2 }}>{f}</span>
              </div>
            ))}
          </div>
        ))}
        {selected !== "free" && (
          <button style={{ width: "100%", background: plans.find(p => p.key === selected)?.color || cl.accent, color: cl.accentFg, border: "none", borderRadius: 14, padding: 16, fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 6, marginBottom: 4 }}>
            Upgrade to {plans.find(p => p.key === selected)?.name}
          </button>
        )}
        <p style={{ fontSize: 11, color: cl.t3, textAlign: "center", margin: "8px 0 24px" }}>Cancel any time in settings. No questions asked.</p>
      </div>
    );
  };

  const MeScreen = () => {
    if (meScreen === "credit") return <CreditScreen />;
    if (meScreen === "banks") return <BanksScreen />;
    if (meScreen === "plan") return <PlanScreen />;
    return <MeOverview />;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ASK LUCID (overlay, real Claude API)
  // ─────────────────────────────────────────────────────────────────────────
  const AskOverlay = () => (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column" }}>
      <div onClick={() => setAskOpen(false)} style={{ flex: "0 0 80px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      <div style={{ flex: 1, background: cl.s1, borderTop: `1px solid ${cl.border}`, borderRadius: "20px 20px 0 0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px 10px", borderBottom: `1px solid ${cl.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: cl.accent, color: cl.accentFg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>L</div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: cl.t1, margin: 0 }}>Ask Lucid</p>
              <p style={{ fontSize: 11, color: cl.accent, margin: 0 }}>● AI · your real financial data</p>
            </div>
          </div>
          <button onClick={() => setAskOpen(false)} style={{ background: "none", border: `1px solid ${cl.border}`, color: cl.t2, borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 13 }}>✕</button>
        </div>
        {msgs.length < 2 && (
          <div style={{ padding: "10px 18px", display: "flex", flexWrap: "wrap", gap: 7 }}>
            {["What are your fees?", "How's my budget?", "Can I get a Float?", "How's my credit score?"].map(q => (
              <button key={q} onClick={() => { const el = document.getElementById("ask-inp"); if (el) { el.value = q; setInp(q); } }} style={{ background: cl.s2, border: `1px solid ${cl.border}`, color: cl.t2, borderRadius: 20, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>{q}</button>
            ))}
          </div>
        )}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 18px" }}>
          {msgs.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 10, alignItems: "flex-start" }}>
              {msg.role === "ai" && <div style={{ width: 26, height: 26, borderRadius: "50%", background: cl.accent, color: cl.accentFg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, marginRight: 7, marginTop: 2 }}>L</div>}
              <div style={{ maxWidth: "78%", background: msg.role === "user" ? cl.accent : cl.s2, color: msg.role === "user" ? cl.accentFg : cl.t2, borderRadius: msg.role === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px", padding: "10px 13px", fontSize: 13, lineHeight: 1.55, border: msg.role === "ai" ? `1px solid ${cl.border}` : "none" }}>
                {msg.text.split(/(\*\*[^*]+\*\*)|\n/g).map((p, j) => {
                  if (!p) return null;
                  if (p.startsWith("**") && p.endsWith("**")) return <strong key={j} style={{ color: msg.role === "user" ? cl.accentFg : cl.t1 }}>{p.slice(2, -2)}</strong>;
                  return <span key={j}>{p}</span>;
                })}
              </div>
            </div>
          ))}
          {typing && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: cl.accent, color: cl.accentFg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>L</div>
              <div style={{ background: cl.s2, border: `1px solid ${cl.border}`, borderRadius: "14px 14px 14px 3px", padding: "10px 14px" }}>
                <span style={{ color: cl.t3, fontSize: 18, letterSpacing: 3 }}>···</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div style={{ padding: "10px 18px 18px", borderTop: `1px solid ${cl.border}`, display: "flex", gap: 10 }}>
          <input id="ask-inp" value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMsg()}
            placeholder="Ask anything about your money…"
            style={{ flex: 1, background: cl.s2, border: `1px solid ${cl.border}`, borderRadius: 12, padding: "11px 14px", color: cl.t1, fontSize: 13, outline: "none", fontFamily: ff }} />
          <button onClick={sendMsg} style={{ width: 44, height: 44, borderRadius: 12, background: inp.trim() ? cl.accent : cl.border, color: inp.trim() ? cl.accentFg : cl.t3, border: "none", cursor: "pointer", fontSize: 18, flexShrink: 0, transition: "background 0.15s" }}>→</button>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // SHELL
  // ─────────────────────────────────────────────────────────────────────────
  const navItems = [
    { key: "home", icon: "◉", label: "Home" },
    { key: "budget", icon: "◈", label: "Budget" },
    { key: "float", icon: "◇", label: "Float" },
    { key: "save", icon: "◎", label: "Save" },
    { key: "me", icon: "○", label: "Me" },
  ];

  return (
    <div style={{ fontFamily: ff, background: cl.bg, color: cl.t1, minHeight: "100vh", maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* Wordmark */}
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, zIndex: 10, padding: "12px 20px 0", display: "flex", justifyContent: "center", background: `linear-gradient(to bottom,${cl.bg} 60%,transparent)`, pointerEvents: "none" }}>
        <span style={{ fontFamily: fs, fontSize: 18, fontWeight: 600, color: cl.accent, letterSpacing: "0.04em" }}>lucid</span>
      </div>

      {/* Screen */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 84 }}>
        {tab === "home" && <HomeScreen />}
        {tab === "budget" && <BudgetScreen />}
        {tab === "float" && <FloatScreen />}
        {tab === "save" && <SaveScreen />}
        {tab === "me" && <MeScreen />}
      </div>

      {/* FAB — Ask Lucid */}
      {!askOpen && (
        <button onClick={() => setAskOpen(true)} style={{ position: "fixed", bottom: 92, right: "calc(50% - 215px + 16px)", width: 52, height: 52, borderRadius: "50%", background: cl.accent, color: cl.accentFg, border: "none", cursor: "pointer", fontSize: 22, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 20px rgba(100,240,72,0.3)` }}>
          💬
        </button>
      )}

      {/* Ask overlay */}
      {askOpen && <AskOverlay />}

      {/* Bottom nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: cl.s1, borderTop: `1px solid ${cl.border}`, display: "flex", padding: "8px 0 18px", zIndex: 15 }}>
        {navItems.map(({ key, icon, label }) => (
          <button key={key} onClick={() => { setTab(key); if (key === "me") setMeScreen("overview"); }} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "5px 0" }}>
            <span style={{ fontSize: 18, opacity: tab === key ? 1 : 0.28, transition: "opacity 0.15s" }}>{icon}</span>
            <span style={{ fontSize: 10, color: tab === key ? cl.accent : cl.t3, fontWeight: tab === key ? 600 : 400, transition: "color 0.15s" }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
