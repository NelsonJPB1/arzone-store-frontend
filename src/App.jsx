import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════
   CONFIG - cambia esto por tu dominio de backend
   ═══════════════════════════════════════ */
const API_URL = "https://arzone-backend-production.up.railway.app"; // ← CAMBIAR

/* ═══════════════════════════════════════
   FALLBACK (si el backend no responde)
   ═══════════════════════════════════════ */
const FALLBACK_RANKS = [
  { id: "noble", name: "Noble", price: 4.99, sold: 147, tagline: "Empieza tu aventura con estilo", color: "#818cf8", gradient: "linear-gradient(135deg,#6366f1,#818cf8)", duration: 0, popular: false, perks: ["Prefijo [Noble] en chat", "Kit Noble cada 24h", "3 homes extras", "/hat — bloques como sombrero", "Acceso a /craft"] },
  { id: "rey", name: "Rey", price: 9.99, sold: 89, popular: true, tagline: "El balance perfecto entre poder y precio", color: "#f472b6", gradient: "linear-gradient(135deg,#ec4899,#f472b6)", duration: 0, perks: ["Todo lo de Noble", "Prefijo [Rey] dorado", "Kit Rey cada 12h", "6 homes extras", "/ec — enderchest portátil", "/fly en lobby", "Prioridad en cola"] },
  { id: "divino", name: "Divino", price: 19.99, sold: 34, tagline: "Sin límites. La experiencia definitiva", color: "#fb923c", gradient: "linear-gradient(135deg,#f97316,#fb923c)", duration: 0, popular: false, perks: ["Todo lo de Rey", "Prefijo [Divino] animado", "Kit Divino cada 6h", "10 homes extras", "/feed y /heal", "/fly en survival", "Nick con colores RGB", "Acceso anticipado a eventos"] },
];

const FALLBACK_COUPONS = [
  { code: "ARZONE10", discount: 10, label: "10% OFF", expiresAt: "", maxUses: 0, uses: 0 },
  { code: "BIENVENIDO", discount: 15, label: "15% OFF", expiresAt: "", maxUses: 50, uses: 12 },
];

/* ═══════════════════════════════════════
   API CLIENT
   ═══════════════════════════════════════ */
async function apiGet(path) {
  const r = await fetch(`${API_URL}${path}`);
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json();
}

async function apiPost(path, body, password) {
  const r = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(password ? { "X-Admin-Password": password } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json();
}

/* ═══════════════════════════════════════
   CSS
   ═══════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0c0a1a;--card:rgba(255,255,255,0.03);--text:#e2e8f0;--muted:#64748b;--dim:#334155;--accent1:#818cf8;--accent2:#f472b6;--accent3:#fb923c}
body{background:var(--bg);color:var(--text);font-family:'Sora',sans-serif;overflow-x:hidden}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.8}}
@keyframes gradientMove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
.fade-s{opacity:0;transform:translateY(40px);transition:all .8s cubic-bezier(.16,1,.3,1)}
.fade-s.vis{opacity:1;transform:translateY(0)}
.hero-grad{background:linear-gradient(135deg,#818cf8,#c084fc,#f472b6,#fb923c,#818cf8);background-size:300% 300%;animation:gradientMove 6s ease infinite;-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.cg{position:relative;background:rgba(12,10,26,.8);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.06);border-radius:24px;transition:all .5s cubic-bezier(.16,1,.3,1)}
.cg:hover{border-color:rgba(255,255,255,.1);transform:translateY(-6px);box-shadow:0 20px 60px rgba(0,0,0,.4)}
.bp{padding:16px 0;border-radius:14px;border:none;cursor:pointer;font-family:'Sora',sans-serif;font-size:14px;font-weight:600;width:100%;transition:all .4s cubic-bezier(.16,1,.3,1);position:relative;overflow:hidden}
.bp::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);transform:translateX(-100%);transition:transform .6s}
.bp:hover::after{transform:translateX(100%)}
.sc{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);border-radius:20px;padding:32px 28px;text-align:center;transition:all .4s}
.sc:hover{background:rgba(255,255,255,.04);transform:translateY(-4px)}
.rc{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:20px;padding:28px;transition:all .4s}
.rc:hover{background:rgba(255,255,255,.04)}
.cr{display:flex;align-items:center;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.03)}
.cr:last-child{border-bottom:none}
.adm-inp{width:100%;padding:10px 14px;border-radius:10px;border:1.5px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:#fff;font-size:14px;font-family:'Sora',sans-serif;outline:none;transition:border-color .3s}
.adm-inp:focus{border-color:var(--accent1)}
.adm-btn{padding:10px 20px;border-radius:10px;border:none;cursor:pointer;font-family:'Sora',sans-serif;font-size:13px;font-weight:600;transition:all .3s}
.adm-tab{padding:10px 20px;border-radius:10px;border:none;cursor:pointer;font-family:'Sora',sans-serif;font-size:13px;font-weight:600;transition:all .3s;background:transparent;color:var(--muted)}
.adm-tab.active{background:rgba(255,255,255,.06);color:#fff}
`;

/* ═══ HELPERS ═══ */
function useReveal() {
  const r = useRef(null);
  useEffect(() => {
    const e = r.current; if (!e) return;
    const o = new IntersectionObserver(([x]) => { if (x.isIntersecting) { e.classList.add("vis"); o.disconnect(); } }, { threshold: .15 });
    o.observe(e);
    return () => o.disconnect();
  }, []);
  return r;
}

function Sec({ children, style: s, delay = 0 }) {
  const r = useReveal();
  return <div ref={r} className="fade-s" style={{ transitionDelay: `${delay}ms`, ...s }}>{children}</div>;
}

function Counter({ value, suffix = "" }) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  const st = useRef(false);
  useEffect(() => {
    const e = ref.current; if (!e) return;
    const o = new IntersectionObserver(([x]) => {
      if (x.isIntersecting && !st.current) {
        st.current = true;
        const t0 = performance.now();
        const t = now => {
          const p = Math.min((now - t0) / 1600, 1);
          setN(Math.floor((1 - Math.pow(1 - p, 3)) * value));
          if (p < 1) requestAnimationFrame(t);
        };
        requestAnimationFrame(t);
      }
    }, { threshold: .5 });
    o.observe(e);
    return () => o.disconnect();
  }, [value]);
  return <span ref={ref}>{n}{suffix}</span>;
}

/* ═══ BG ═══ */
function AnimBG() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-15%", left: "20%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(129,140,248,.08) 0%,transparent 70%)", animation: "float 12s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "30%", right: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(244,114,182,.06) 0%,transparent 70%)", animation: "float 15s ease-in-out infinite 2s" }} />
      <div style={{ position: "absolute", bottom: "-20%", left: "40%", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle,rgba(251,146,60,.05) 0%,transparent 70%)", animation: "float 18s ease-in-out infinite 4s" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.015) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
    </div>
  );
}

/* ═══ STATUS ═══ */
function Status() {
  const [p, setP] = useState(null);
  useEffect(() => {
    fetch("https://api.mcsrvstat.us/2/arzone.online").then(r => r.json()).then(d => setP(d.players?.online ?? 0)).catch(() => {});
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 100, padding: "6px 16px" }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: p !== null ? "#34d399" : "#555", boxShadow: p !== null ? "0 0 8px rgba(52,211,153,.5)" : "none", animation: p !== null ? "pulse 2s infinite" : "none" }} />
      <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>{p !== null ? `${p} online` : "..."}</span>
    </div>
  );
}

/* ═══ RANK CARD ═══ */
function RankCard({ rank, index, onBuy }) {
  const [h, setH] = useState(false);
  return (
    <Sec delay={index * 150} style={{ flex: "1 1 320px", maxWidth: 400, minWidth: 280 }}>
      <div className="cg" onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ padding: "36px 32px 32px", display: "flex", flexDirection: "column", height: "100%" }}>
        {rank.popular && (
          <div style={{ position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)", background: rank.gradient, color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: 2, padding: "5px 20px 6px", borderRadius: "0 0 14px 14px", boxShadow: `0 4px 16px ${rank.color}33` }}>MÁS ELEGIDO</div>
        )}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "inline-block", fontSize: 11, fontWeight: 600, color: rank.color, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12, background: rank.color + "12", padding: "4px 14px", borderRadius: 8 }}>{rank.name}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
            <span style={{ fontSize: 52, fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: -2 }}>${String(rank.price).split(".")[0]}</span>
            <span style={{ fontSize: 22, fontWeight: 600, color: "var(--muted)" }}>.{(String(rank.price).split(".")[1] || "00").padEnd(2, "0")}</span>
            <span style={{ fontSize: 13, color: "var(--dim)", marginLeft: 4, fontWeight: 500 }}>USD</span>
          </div>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>{rank.tagline}</p>
          {rank.duration > 0 && <div style={{ marginTop: 8, fontSize: 12, color: rank.color, fontWeight: 600, background: rank.color + "12", display: "inline-block", padding: "3px 12px", borderRadius: 8 }}>Duración: {rank.duration} días</div>}
          {rank.duration === 0 && <div style={{ marginTop: 8, fontSize: 12, color: "#34d399", fontWeight: 600, background: "rgba(52,211,153,.1)", display: "inline-block", padding: "3px 12px", borderRadius: 8 }}>Permanente</div>}
        </div>
        <div style={{ height: 1, background: `linear-gradient(90deg,${rank.color}20,transparent)`, marginBottom: 24 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1, marginBottom: 24 }}>
          {rank.perks.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: rank.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 6l2 2 4-4" stroke={rank.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <span style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.3 }}>{p}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "var(--dim)", marginBottom: 16, fontWeight: 500 }}>
          <Counter value={rank.sold} suffix="+" /> jugadores lo eligieron
        </div>
        <button className="bp" onClick={() => onBuy(rank)} style={{ color: "#fff", background: h ? rank.gradient : "rgba(255,255,255,.06)", boxShadow: h ? `0 8px 32px ${rank.color}30` : "none" }}>Obtener {rank.name}</button>
      </div>
    </Sec>
  );
}

/* ═══ CHECKOUT ═══ */
function Checkout({ rank, onClose }) {
  const [name, setName] = useState("");
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState(null);
  const [step, setStep] = useState("form");
  const [error, setError] = useState("");
  const [cMsg, setCMsg] = useState(null);
  const [show, setShow] = useState(false);
  const [validating, setValidating] = useState(false);
  const ref = useRef(null);

  useEffect(() => { requestAnimationFrame(() => setShow(true)); ref.current?.focus(); }, []);

  const final = applied ? (rank.price * (1 - applied.discount / 100)).toFixed(2) : rank.price.toFixed(2);

  const tryApply = async () => {
    const c = coupon.trim().toUpperCase();
    if (!c) return;
    setValidating(true);
    try {
      const res = await apiPost("/api/validate-coupon", { code: c });
      if (res.valid) {
        setApplied(res.coupon);
        setCMsg({ ok: true, t: `${res.coupon.discount}% OFF aplicado` });
      } else {
        setApplied(null);
        setCMsg({ ok: false, t: res.error || "Cupón inválido" });
      }
    } catch {
      setCMsg({ ok: false, t: "Error al validar. Intenta de nuevo." });
    } finally {
      setValidating(false);
    }
  };

  const pay = () => {
    const n = name.trim();
    if (!n) return setError("Ingresa tu nombre");
    if (n.length < 3 || n.length > 16) return setError("Entre 3 y 16 caracteres");
    if (!/^[a-zA-Z0-9_]+$/.test(n)) return setError("Solo letras, números y _");
    setStep("loading");
    window.open(`https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=nelsonparedes0172@gmail.com&item_name=Rango+${rank.name}+Arzone+-+${n}&amount=${final}&currency_code=USD&notify_url=${API_URL}/ipn&return=https://arzone.online/gracias&cancel_return=https://arzone.online/tienda`, "_blank");
    setTimeout(() => setStep("done"), 2000);
  };

  const inp = (e) => ({ width: "100%", padding: "14px 18px", borderRadius: 12, border: `1.5px solid ${e ? "rgba(248,113,113,.5)" : "rgba(255,255,255,.06)"}`, background: "rgba(255,255,255,.03)", color: "#fff", fontSize: 15, fontFamily: "'Sora',sans-serif", fontWeight: 500, outline: "none", boxSizing: "border-box", transition: "all .3s" });

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: show ? "rgba(6,4,14,.85)" : "rgba(6,4,14,0)", backdropFilter: show ? "blur(20px)" : "blur(0)", transition: "all .35s", padding: 16 }}>
      <div style={{ background: "rgba(14,12,26,.97)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 28, padding: "44px 36px", maxWidth: 460, width: "100%", position: "relative", transform: show ? "scale(1)" : "scale(.96)", opacity: show ? 1 : 0, transition: "all .4s cubic-bezier(.16,1,.3,1)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 18, right: 18, background: "rgba(255,255,255,.04)", border: "none", color: "var(--dim)", fontSize: 18, cursor: "pointer", width: 36, height: 36, borderRadius: 10 }}>×</button>

        {step === "form" && <>
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "inline-block", fontSize: 10, fontWeight: 700, color: rank.color, letterSpacing: 3, textTransform: "uppercase", background: rank.color + "12", padding: "4px 14px", borderRadius: 8, marginBottom: 16 }}>{rank.name}{rank.duration > 0 ? ` · ${rank.duration} días` : " · Permanente"}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              {applied && <span style={{ fontSize: 22, color: "var(--dim)", textDecoration: "line-through" }}>${rank.price}</span>}
              <span style={{ fontSize: 44, fontWeight: 800, color: "#fff", letterSpacing: -1 }}>${final}</span>
              <span style={{ fontSize: 14, color: "var(--dim)", marginLeft: 2 }}>USD</span>
            </div>
            {applied && <span style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>{applied.discount}% OFF ✓</span>}
          </div>

          <label style={{ fontSize: 11, color: "var(--dim)", letterSpacing: 2, fontWeight: 600, display: "block", marginBottom: 8 }}>NOMBRE DE MINECRAFT</label>
          <input ref={ref} type="text" value={name} onChange={e => { setName(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && pay()} placeholder="Tu username" maxLength={16} style={inp(!!error)} />
          {error && <p style={{ fontSize: 12, color: "#f87171", margin: "8px 0 0", fontWeight: 500 }}>{error}</p>}

          <label style={{ fontSize: 11, color: "var(--dim)", letterSpacing: 2, fontWeight: 600, display: "block", marginTop: 22, marginBottom: 8 }}>CUPÓN DE DESCUENTO</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="text" value={coupon} onChange={e => { setCoupon(e.target.value); setCMsg(null); }} onKeyDown={e => e.key === "Enter" && tryApply()} placeholder="Código" maxLength={20} style={{ ...inp(false), textTransform: "uppercase", letterSpacing: 2, flex: 1 }} />
            <button onClick={tryApply} disabled={validating} style={{ padding: "14px 20px", borderRadius: 12, border: "1px solid rgba(255,255,255,.06)", background: "rgba(255,255,255,.03)", color: "var(--muted)", fontSize: 13, fontWeight: 600, cursor: validating ? "wait" : "pointer", fontFamily: "'Sora',sans-serif", whiteSpace: "nowrap" }}>{validating ? "..." : "Aplicar"}</button>
          </div>
          {cMsg && <p style={{ fontSize: 12, color: cMsg.ok ? "#34d399" : "#f87171", margin: "8px 0 0", fontWeight: 500 }}>{cMsg.t}</p>}

          <button onClick={pay} className="bp" style={{ marginTop: 28, color: "#fff", background: rank.gradient, boxShadow: `0 8px 32px ${rank.color}25` }}>Pagar con PayPal</button>
          <p style={{ fontSize: 11, color: "var(--dim)", textAlign: "center", marginTop: 14, fontWeight: 500 }}>Se abrirá PayPal en nueva pestaña · Pago seguro</p>
        </>}

        {step === "loading" && (
          <div style={{ textAlign: "center", padding: "56px 0" }}>
            <div style={{ width: 40, height: 40, border: `2px solid ${rank.color}20`, borderTopColor: rank.color, borderRadius: "50%", margin: "0 auto 24px", animation: "spin .7s linear infinite" }} />
            <p style={{ fontSize: 15, color: "var(--muted)", fontWeight: 500 }}>Abriendo PayPal…</p>
          </div>
        )}

        {step === "done" && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: rank.color + "12", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke={rank.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 0 12px" }}>¡Casi listo!</h3>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, margin: "0 0 8px" }}>Completa el pago en PayPal. Tu rango se activará automáticamente para <strong style={{ color: "#fff" }}>{name}</strong> en menos de 5 minutos.</p>
            <button onClick={onClose} style={{ marginTop: 24, padding: "12px 32px", borderRadius: 12, border: "1px solid rgba(255,255,255,.06)", background: "transparent", color: "var(--muted)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>Cerrar</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ FAQ ═══ */
function FAQ({ q, a }) {
  const [o, setO] = useState(false);
  return (
    <div onClick={() => setO(!o)} style={{ borderBottom: "1px solid rgba(255,255,255,.04)", padding: "22px 0", cursor: "pointer" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 15, color: "var(--text)", fontWeight: 500, paddingRight: 16 }}>{q}</span>
        <svg width="18" height="18" viewBox="0 0 18 18" style={{ transform: o ? "rotate(180deg)" : "none", transition: "transform .3s", flexShrink: 0 }}><path d="M4 7l5 5 5-5" stroke="var(--dim)" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
      </div>
      <div style={{ maxHeight: o ? 200 : 0, overflow: "hidden", transition: "max-height .4s cubic-bezier(.16,1,.3,1)" }}>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "14px 0 0" }}>{a}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   ADMIN PANEL
   ═══════════════════════════════════════ */
function AdminPanel({ ranks, coupons, password, onSaved, onClose }) {
  const [tab, setTab] = useState("ranks");
  const [localRanks, setLocalRanks] = useState(JSON.parse(JSON.stringify(ranks)));
  const [localCoupons, setLocalCoupons] = useState(JSON.parse(JSON.stringify(coupons)));
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      await apiPost("/api/admin/ranks", { ranks: localRanks }, password);
      await apiPost("/api/admin/coupons", { coupons: localCoupons }, password);
      setSaveMsg({ ok: true, t: "Guardado en el servidor" });
      onSaved(localRanks, localCoupons);
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err) {
      setSaveMsg({ ok: false, t: "Error al guardar. Verifica tu conexión." });
    } finally {
      setSaving(false);
    }
  };

  const updateRank = (idx, field, value) => {
    const r = [...localRanks];
    r[idx] = { ...r[idx], [field]: value };
    setLocalRanks(r);
  };
  const addPerk = (idx) => {
    const r = [...localRanks];
    r[idx] = { ...r[idx], perks: [...r[idx].perks, "Nuevo beneficio"] };
    setLocalRanks(r);
  };
  const removePerk = (ri, pi) => {
    const r = [...localRanks];
    r[ri] = { ...r[ri], perks: r[ri].perks.filter((_, i) => i !== pi) };
    setLocalRanks(r);
  };
  const updatePerk = (ri, pi, val) => {
    const r = [...localRanks];
    r[ri] = { ...r[ri], perks: r[ri].perks.map((p, i) => i === pi ? val : p) };
    setLocalRanks(r);
  };
  const addCoupon = () => setLocalCoupons([...localCoupons, { code: "NUEVO", discount: 10, label: "10% OFF", expiresAt: "", maxUses: 0, uses: 0 }]);
  const removeCoupon = (i) => setLocalCoupons(localCoupons.filter((_, idx) => idx !== i));
  const updateCoupon = (idx, field, value) => {
    const c = [...localCoupons];
    c[idx] = { ...c[idx], [field]: value };
    if (field === "discount") c[idx].label = `${value}% OFF`;
    setLocalCoupons(c);
  };

  const st = {
    overlay: { position: "fixed", inset: 0, zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(6,4,14,.9)", backdropFilter: "blur(20px)", padding: 16, overflow: "auto" },
    panel: { background: "#0e0c1a", border: "1px solid rgba(255,255,255,.08)", borderRadius: 28, padding: "32px", maxWidth: 700, width: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative" },
    section: { background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.05)", borderRadius: 16, padding: 24, marginBottom: 16 },
    label: { fontSize: 11, color: "var(--dim)", letterSpacing: 2, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase" },
    row: { display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap", alignItems: "flex-end" },
    field: { flex: "1 1 120px", minWidth: 100 },
  };

  return (
    <div style={st.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={st.panel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Panel de Admin</h2>
            <p style={{ fontSize: 13, color: "var(--dim)" }}>Cambios sincronizados con el servidor</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,.04)", border: "none", color: "var(--dim)", fontSize: 20, cursor: "pointer", width: 40, height: 40, borderRadius: 12 }}>×</button>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 28, background: "rgba(255,255,255,.02)", borderRadius: 12, padding: 4 }}>
          <button className={`adm-tab ${tab === "ranks" ? "active" : ""}`} onClick={() => setTab("ranks")}>Rangos</button>
          <button className={`adm-tab ${tab === "coupons" ? "active" : ""}`} onClick={() => setTab("coupons")}>Cupones</button>
        </div>

        {tab === "ranks" && localRanks.map((rank, ri) => (
          <div key={ri} style={{ ...st.section, borderLeft: `3px solid ${rank.color}` }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: rank.color, marginBottom: 16, letterSpacing: 1 }}>{rank.name}</h3>
            <div style={st.row}>
              <div style={st.field}>
                <label style={st.label}>Nombre</label>
                <input className="adm-inp" value={rank.name} onChange={e => updateRank(ri, "name", e.target.value)} />
              </div>
              <div style={{ ...st.field, maxWidth: 120 }}>
                <label style={st.label}>Precio (USD)</label>
                <input className="adm-inp" type="number" step="0.01" min="0" value={rank.price} onChange={e => updateRank(ri, "price", parseFloat(e.target.value) || 0)} />
              </div>
              <div style={{ ...st.field, maxWidth: 140 }}>
                <label style={st.label}>Duración (días)</label>
                <input className="adm-inp" type="number" min="0" value={rank.duration} onChange={e => updateRank(ri, "duration", parseInt(e.target.value) || 0)} placeholder="0 = permanente" />
              </div>
            </div>
            <div style={st.row}>
              <div style={{ flex: 1 }}>
                <label style={st.label}>Descripción</label>
                <input className="adm-inp" value={rank.tagline} onChange={e => updateRank(ri, "tagline", e.target.value)} />
              </div>
            </div>
            <div style={st.row}>
              <div style={{ ...st.field, maxWidth: 120 }}>
                <label style={st.label}>Vendidos</label>
                <input className="adm-inp" type="number" min="0" value={rank.sold} onChange={e => updateRank(ri, "sold", parseInt(e.target.value) || 0)} />
              </div>
              <div style={{ ...st.field, maxWidth: 120 }}>
                <label style={st.label}>Color</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="color" value={rank.color} onChange={e => { updateRank(ri, "color", e.target.value); updateRank(ri, "gradient", `linear-gradient(135deg,${e.target.value}cc,${e.target.value})`); }} style={{ width: 36, height: 36, border: "none", borderRadius: 8, cursor: "pointer", background: "transparent" }} />
                  <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "monospace" }}>{rank.color}</span>
                </div>
              </div>
              <div style={{ ...st.field, maxWidth: 120 }}>
                <label style={st.label}>Popular</label>
                <button className="adm-btn" onClick={() => updateRank(ri, "popular", !rank.popular)} style={{ background: rank.popular ? "rgba(52,211,153,.15)" : "rgba(255,255,255,.04)", color: rank.popular ? "#34d399" : "var(--dim)", width: "100%" }}>{rank.popular ? "Sí ✓" : "No"}</button>
              </div>
            </div>
            <label style={{ ...st.label, marginTop: 8, marginBottom: 12 }}>Beneficios</label>
            {rank.perks.map((perk, pi) => (
              <div key={pi} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <input className="adm-inp" value={perk} onChange={e => updatePerk(ri, pi, e.target.value)} style={{ flex: 1 }} />
                <button onClick={() => removePerk(ri, pi)} style={{ background: "rgba(248,113,113,.1)", border: "none", color: "#f87171", fontSize: 16, cursor: "pointer", width: 36, height: 36, borderRadius: 8, flexShrink: 0 }}>×</button>
              </div>
            ))}
            <button onClick={() => addPerk(ri)} className="adm-btn" style={{ background: "rgba(129,140,248,.1)", color: "var(--accent1)", marginTop: 4, width: "100%" }}>+ Agregar beneficio</button>
          </div>
        ))}

        {tab === "coupons" && <>
          {localCoupons.map((c, i) => (
            <div key={i} style={st.section}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: 2 }}>{c.code}</h3>
                <button onClick={() => removeCoupon(i)} className="adm-btn" style={{ background: "rgba(248,113,113,.1)", color: "#f87171", fontSize: 12, padding: "6px 14px" }}>Eliminar</button>
              </div>
              <div style={st.row}>
                <div style={st.field}>
                  <label style={st.label}>Código</label>
                  <input className="adm-inp" value={c.code} onChange={e => updateCoupon(i, "code", e.target.value.toUpperCase())} style={{ textTransform: "uppercase", letterSpacing: 2 }} />
                </div>
                <div style={{ ...st.field, maxWidth: 120 }}>
                  <label style={st.label}>Descuento %</label>
                  <input className="adm-inp" type="number" min="1" max="100" value={c.discount} onChange={e => updateCoupon(i, "discount", parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <div style={st.row}>
                <div style={st.field}>
                  <label style={st.label}>Expira</label>
                  <input className="adm-inp" type="date" value={c.expiresAt} onChange={e => updateCoupon(i, "expiresAt", e.target.value)} />
                </div>
                <div style={{ ...st.field, maxWidth: 120 }}>
                  <label style={st.label}>Máx. usos</label>
                  <input className="adm-inp" type="number" min="0" value={c.maxUses} onChange={e => updateCoupon(i, "maxUses", parseInt(e.target.value) || 0)} />
                </div>
                <div style={{ ...st.field, maxWidth: 100 }}>
                  <label style={st.label}>Usados</label>
                  <input className="adm-inp" type="number" min="0" value={c.uses} onChange={e => updateCoupon(i, "uses", parseInt(e.target.value) || 0)} />
                </div>
              </div>
            </div>
          ))}
          <button onClick={addCoupon} className="adm-btn" style={{ background: "rgba(129,140,248,.1)", color: "var(--accent1)", width: "100%", padding: 14 }}>+ Nuevo cupón</button>
        </>}

        {saveMsg && (
          <div style={{ padding: "12px 16px", borderRadius: 10, background: saveMsg.ok ? "rgba(52,211,153,.1)" : "rgba(248,113,113,.1)", color: saveMsg.ok ? "#34d399" : "#f87171", fontSize: 13, fontWeight: 600, marginTop: 16, textAlign: "center" }}>{saveMsg.t}</div>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 20, position: "sticky", bottom: 0, background: "#0e0c1a", padding: "16px 0 4px", borderTop: "1px solid rgba(255,255,255,.04)" }}>
          <button onClick={handleSave} disabled={saving} className="adm-btn" style={{ flex: 1, padding: 16, background: saving ? "rgba(255,255,255,.08)" : "linear-gradient(135deg,#818cf8,#c084fc)", color: "#fff", fontSize: 15, cursor: saving ? "wait" : "pointer" }}>{saving ? "Guardando..." : "Guardar cambios"}</button>
          <button onClick={onClose} className="adm-btn" style={{ padding: "16px 24px", background: "rgba(255,255,255,.04)", color: "var(--muted)" }}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

/* ═══ ADMIN LOGIN ═══ */
function AdminLogin({ onSuccess, onClose }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [checking, setChecking] = useState(false);
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const check = async () => {
    if (!pw) return;
    setChecking(true);
    setErr(false);
    try {
      // Prueba la contraseña haciendo una request al endpoint de admin
      const r = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { "X-Admin-Password": pw },
      });
      if (r.ok) onSuccess(pw);
      else setErr(true);
    } catch {
      setErr(true);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(6,4,14,.85)", backdropFilter: "blur(16px)", padding: 16 }}>
      <div style={{ background: "#0e0c1a", border: "1px solid rgba(255,255,255,.06)", borderRadius: 24, padding: "40px 36px", maxWidth: 380, width: "100%", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(129,140,248,.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="#818cf8" strokeWidth="2" /><path d="M7 11V7a5 5 0 0110 0v4" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" /></svg>
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Panel de Admin</h3>
        <p style={{ fontSize: 13, color: "var(--dim)", marginBottom: 24 }}>Ingresa la contraseña</p>
        <input ref={ref} type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(false); }} onKeyDown={e => e.key === "Enter" && check()} placeholder="Contraseña" className="adm-inp" style={{ marginBottom: err ? 8 : 20, textAlign: "center", borderColor: err ? "rgba(248,113,113,.5)" : undefined }} />
        {err && <p style={{ fontSize: 12, color: "#f87171", marginBottom: 12, fontWeight: 500 }}>Contraseña incorrecta o backend no disponible</p>}
        <button onClick={check} disabled={checking} className="bp" style={{ color: "#fff", background: "linear-gradient(135deg,#818cf8,#c084fc)", cursor: checking ? "wait" : "pointer" }}>{checking ? "Verificando..." : "Entrar"}</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN
   ═══════════════════════════════════════ */
export default function App() {
  const [ranks, setRanks] = useState(FALLBACK_RANKS);
  const [coupons, setCoupons] = useState(FALLBACK_COUPONS);
  const [loaded, setLoaded] = useState(false);
  const [sel, setSel] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPw, setAdminPw] = useState("");
  const [copied, setCopied] = useState(false);
  const logoClicks = useRef(0);
  const logoTimer = useRef(null);

  // Cargar config del backend
  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet("/api/config");
        if (data.ranks?.length) setRanks(data.ranks);
        if (data.coupons?.length) setCoupons(data.coupons);
      } catch (err) {
        console.warn("Backend no disponible, usando fallback:", err.message);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const handleLogoClick = () => {
    logoClicks.current++;
    clearTimeout(logoTimer.current);
    logoTimer.current = setTimeout(() => { logoClicks.current = 0; }, 2000);
    if (logoClicks.current >= 5) { logoClicks.current = 0; setShowLogin(true); }
  };

  const copyIP = () => { navigator.clipboard?.writeText("arzone.online"); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const allPerks = ["Kit periódico", "Homes extras", "/hat", "/craft", "/ec portátil", "/fly lobby", "/fly survival", "/feed y /heal", "Nick con colores", "Cola prioritaria", "Eventos anticipados"];
  const compMap = [[true, true, true], ["3", "6", "10"], [true, true, true], [true, true, true], [false, true, true], [false, true, true], [false, false, true], [false, false, true], [false, false, true], [false, true, true], [false, false, true]];

  if (!loaded) return <div style={{ minHeight: "100vh", background: "#0c0a1a", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 40, height: 40, border: "2px solid rgba(129,140,248,.2)", borderTopColor: "#818cf8", borderRadius: "50%", animation: "spin .7s linear infinite" }} /><style>{CSS}</style></div>;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", position: "relative" }}>
      <style>{CSS}</style>
      <AnimBG />

      <nav style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px clamp(16px,5vw,64px)", background: "rgba(12,10,26,.6)", backdropFilter: "blur(16px) saturate(1.2)", borderBottom: "1px solid rgba(255,255,255,.03)" }}>
        <div onClick={handleLogoClick} style={{ fontSize: 20, fontWeight: 800, letterSpacing: 5, cursor: "default", userSelect: "none" }}>
          <span className="hero-grad">A</span><span style={{ color: "#fff" }}>RZONE</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <Status />
          <a href="https://discord.arzone.online" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none", fontWeight: 600, padding: "6px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,.06)" }}>Discord</a>
        </div>
      </nav>

      <Sec style={{ textAlign: "center", padding: "120px 24px 60px", maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 100, padding: "6px 20px", marginBottom: 32 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px rgba(52,211,153,.5)" }} />
          <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>Servidor activo 24/7</span>
        </div>
        <h1 style={{ fontSize: "clamp(36px,7vw,72px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, marginBottom: 24 }}>
          <span style={{ color: "#fff" }}>Lleva tu juego al</span><br /><span className="hero-grad">siguiente nivel</span>
        </h1>
        <p style={{ fontSize: "clamp(16px,2vw,19px)", color: "var(--muted)", maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.7 }}>
          Rangos exclusivos con ventajas reales. Activación automática. Un solo pago, beneficios para siempre.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <a href="#rangos" style={{ padding: "15px 36px", borderRadius: 14, background: "linear-gradient(135deg,#818cf8,#c084fc)", color: "#fff", fontSize: 15, fontWeight: 600, textDecoration: "none", boxShadow: "0 8px 32px rgba(129,140,248,.25)" }}>Ver rangos</a>
          <button onClick={copyIP} style={{ padding: "15px 36px", borderRadius: 14, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", color: "var(--muted)", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>{copied ? "¡IP Copiada!" : "arzone.online"}</button>
        </div>
      </Sec>

      <Sec style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "center", gap: "clamp(32px,6vw,80px)", padding: "40px 24px 80px", flexWrap: "wrap" }}>
        {[{ v: ranks.reduce((a, r) => a + r.sold, 0), s: "+", l: "Rangos vendidos" }, { v: 5, s: " min", l: "Activación promedio" }, { v: 99, s: "%", l: "Satisfacción" }].map((s, i) => (
          <div key={i} style={{ textAlign: "center", minWidth: 120 }}>
            <div style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 800, color: "#fff", letterSpacing: -1 }}><Counter value={s.v} suffix={s.s} /></div>
            <div style={{ fontSize: 13, color: "var(--dim)", marginTop: 6, fontWeight: 500, letterSpacing: .5 }}>{s.l}</div>
          </div>
        ))}
      </Sec>

      <Sec style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "0 24px 100px" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent1)", letterSpacing: 3, textTransform: "uppercase", textAlign: "center", marginBottom: 12 }}>Cómo funciona</p>
        <h2 style={{ fontSize: "clamp(24px,4vw,40px)", fontWeight: 800, textAlign: "center", marginBottom: 48, letterSpacing: -1 }}>Tres pasos, menos de cinco minutos</h2>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          {[{ n: "01", t: "Elige tu rango", d: "Compara los beneficios y elige el que mejor se adapte a ti." }, { n: "02", t: "Paga con PayPal", d: "Ingresa tu nombre de Minecraft, aplica un cupón si tienes, y paga seguro." }, { n: "03", t: "Juega con ventajas", d: "Tu rango se activa automáticamente. Entra al server y disfruta." }].map((s, i) => (
            <Sec key={i} delay={i * 120} style={{ flex: "1 1 260px", maxWidth: 320 }}>
              <div className="sc">
                <div style={{ fontSize: 40, fontWeight: 800, background: `linear-gradient(135deg,${["#818cf8", "#f472b6", "#fb923c"][i]},${["#c084fc", "#fb7185", "#fbbf24"][i]})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 16, lineHeight: 1 }}>{s.n}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: "#fff" }}>{s.t}</h3>
                <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>{s.d}</p>
              </div>
            </Sec>
          ))}
        </div>
      </Sec>

      <div id="rangos" style={{ position: "relative", zIndex: 1, maxWidth: 1300, margin: "0 auto", padding: "0 20px 100px" }}>
        <Sec>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent2)", letterSpacing: 3, textTransform: "uppercase", textAlign: "center", marginBottom: 12 }}>Rangos</p>
          <h2 style={{ fontSize: "clamp(24px,4vw,40px)", fontWeight: 800, textAlign: "center", marginBottom: 56, letterSpacing: -1 }}>Encuentra el rango perfecto para ti</h2>
        </Sec>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 20, alignItems: "stretch" }}>
          {ranks.map((r, i) => <RankCard key={r.id} rank={r} index={i} onBuy={setSel} />)}
        </div>
      </div>

      <Sec style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto", padding: "0 24px 100px" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent3)", letterSpacing: 3, textTransform: "uppercase", textAlign: "center", marginBottom: 12 }}>Comparación</p>
        <h2 style={{ fontSize: "clamp(22px,3.5vw,36px)", fontWeight: 800, textAlign: "center", marginBottom: 40, letterSpacing: -1 }}>¿Qué incluye cada rango?</h2>
        <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)", borderRadius: 24, padding: "12px 28px" }}>
          <div className="cr" style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
            <div style={{ flex: 2, fontSize: 13, fontWeight: 700, color: "var(--dim)", letterSpacing: 1 }}>BENEFICIO</div>
            {ranks.map(r => <div key={r.id} style={{ flex: 1, textAlign: "center", fontSize: 13, fontWeight: 700, color: r.color, letterSpacing: 1 }}>{r.name.toUpperCase()}</div>)}
          </div>
          {allPerks.map((feat, i) => (
            <div key={i} className="cr">
              <div style={{ flex: 2, fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>{feat}</div>
              {compMap[i].map((v, j) => (
                <div key={j} style={{ flex: 1, textAlign: "center" }}>
                  {v === true ? <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill={ranks[j]?.color + "18"} /><path d="M5 8l2 2 4-4" stroke={ranks[j]?.color} strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
                    : v === false ? <span style={{ color: "var(--dim)", fontSize: 16 }}>—</span>
                      : <span style={{ fontSize: 13, color: ranks[j]?.color, fontWeight: 600 }}>{v}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Sec>

      <Sec style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "0 24px 100px" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent1)", letterSpacing: 3, textTransform: "uppercase", textAlign: "center", marginBottom: 12 }}>Reseñas</p>
        <h2 style={{ fontSize: "clamp(22px,3.5vw,36px)", fontWeight: 800, textAlign: "center", marginBottom: 40, letterSpacing: -1 }}>Lo que dicen los jugadores</h2>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          {[{ name: "CraftKing_99", rank: "Divino", text: "El /fly en survival cambió completamente mi forma de jugar. Mejor inversión que he hecho.", stars: 5 }, { name: "Luna_MC", rank: "Rey", text: "La activación fue instantánea. Compré y en 2 minutos ya tenía mi rango. Súper recomendado.", stars: 5 }, { name: "BlockMaster", rank: "Noble", text: "Perfecto para empezar. El /craft es muy útil y el kit diario está genial.", stars: 4 }].map((r, i) => (
            <Sec key={i} delay={i * 120} style={{ flex: "1 1 280px", maxWidth: 340 }}>
              <div className="rc">
                <div style={{ display: "flex", gap: 2, marginBottom: 14 }}>{Array.from({ length: 5 }).map((_, j) => <svg key={j} width="16" height="16" viewBox="0 0 16 16" fill={j < r.stars ? "#fbbf24" : "var(--dim)"}><path d="M8 1l2.2 4.5 5 .7-3.6 3.5.8 5L8 12.4 3.6 14.7l.8-5L.8 6.2l5-.7z" /></svg>)}</div>
                <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 16 }}>"{r.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--dim)" }}>{r.name[0]}</div>
                  <div><div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{r.name}</div><div style={{ fontSize: 11, color: "var(--dim)", fontWeight: 500 }}>Rango {r.rank}</div></div>
                </div>
              </div>
            </Sec>
          ))}
        </div>
      </Sec>

      <Sec style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto", padding: "0 24px 100px" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent2)", letterSpacing: 3, textTransform: "uppercase", textAlign: "center", marginBottom: 12 }}>FAQ</p>
        <h2 style={{ fontSize: "clamp(22px,3.5vw,36px)", fontWeight: 800, textAlign: "center", marginBottom: 40, letterSpacing: -1 }}>Preguntas frecuentes</h2>
        <FAQ q="¿Cuánto tarda la activación?" a="Menos de 5 minutos tras confirmar el pago. Si estás online, recibirás una notificación en el chat." />
        <FAQ q="¿Los rangos son permanentes?" a="Depende del rango. Revisa la duración indicada en cada tarjeta." />
        <FAQ q="¿No recibí mi rango?" a="Envía tu comprobante de PayPal y nombre de Minecraft por Discord." />
        <FAQ q="¿Puedo mejorar mi rango?" a="Sí, compra un rango superior y reemplazará al anterior automáticamente." />
        <FAQ q="¿Cómo uso un cupón?" a="Al comprar, verás un campo para ingresar tu código." />
      </Sec>

      <Sec style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "0 24px 100px" }}>
        <div style={{ background: "linear-gradient(135deg,rgba(129,140,248,.08),rgba(244,114,182,.06),rgba(251,146,60,.04))", border: "1px solid rgba(255,255,255,.06)", borderRadius: 28, padding: "60px 40px", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(24px,4vw,40px)", fontWeight: 800, marginBottom: 16, letterSpacing: -1 }}>¿Listo para <span className="hero-grad">dominar</span> Arzone?</h2>
          <p style={{ fontSize: 16, color: "var(--muted)", maxWidth: 440, margin: "0 auto 32px", lineHeight: 1.7 }}>Elige tu rango ahora.</p>
          <a href="#rangos" style={{ display: "inline-block", padding: "16px 40px", borderRadius: 14, background: "linear-gradient(135deg,#818cf8,#c084fc,#f472b6)", color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none", boxShadow: "0 8px 32px rgba(129,140,248,.2)" }}>Ver rangos</a>
        </div>
      </Sec>

      <footer style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "20px 24px 48px", borderTop: "1px solid rgba(255,255,255,.03)" }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 5, marginBottom: 16 }}><span className="hero-grad">A</span><span style={{ color: "#fff" }}>RZONE</span></div>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 20, flexWrap: "wrap" }}>
          <a href="https://discord.gg/arzone" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--dim)", textDecoration: "none", fontWeight: 500 }}>Discord</a>
          <span style={{ fontSize: 13, color: "var(--dim)", fontWeight: 500 }}>play.arzone.online</span>
          <span onClick={() => setShowLogin(true)} style={{ fontSize: 13, color: "rgba(255,255,255,.04)", fontWeight: 500, cursor: "default" }}>Admin</span>
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,.08)", lineHeight: 2 }}>© 2026 Arzone · Rangos virtuales, no reembolsables · No afiliado con Mojang Studios</p>
      </footer>

      {sel && <Checkout rank={sel} onClose={() => setSel(null)} />}
      {showLogin && <AdminLogin onSuccess={(pw) => { setAdminPw(pw); setShowLogin(false); setShowAdmin(true); }} onClose={() => setShowLogin(false)} />}
      {showAdmin && <AdminPanel ranks={ranks} coupons={coupons} password={adminPw} onSaved={(r, c) => { setRanks(r); setCoupons(c); }} onClose={() => setShowAdmin(false)} />}
    </div>
  );
}
