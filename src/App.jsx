import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════
   CONFIG
   ═══════════════════════════════════════════════════════════════ */
const TEBEX_TOKEN = "129vc-0fc9ed2e4492cc863f761af64b647426c6657818";
const TEBEX_API = `https://headless.tebex.io/api/accounts/${TEBEX_TOKEN}`;
const TEBEX_STORE = "https://arzone.tebex.io";

const SERVER_IP = "arzone.online";
const DISCORD_URL = "https://discord.gg/arzone";

/* Mapeo visual por ID de paquete (lo único que editas manualmente)
   Los nombres, precios y beneficios vienen de Tebex automáticamente */
const RANK_STYLES = {
  7363902: { // Noble
    color: "#818cf8",
    gradient: "linear-gradient(135deg,#6366f1,#818cf8)",
    tagline: "Empieza tu aventura con estilo",
    sortOrder: 1,
  },
  7363906: { // Rey
    color: "#f472b6",
    gradient: "linear-gradient(135deg,#ec4899,#f472b6)",
    tagline: "El balance perfecto entre poder y precio",
    popular: true,
    sortOrder: 2,
  },
  7363907: { // Divino
    color: "#fb923c",
    gradient: "linear-gradient(135deg,#f97316,#fb923c)",
    tagline: "Sin límites. La experiencia definitiva",
    sortOrder: 3,
  },
};

/* Si la API de Tebex falla, mostramos esto como respaldo */
const FALLBACK = [
  { id: 7363902, name: "Noble", total_price: 4.99, description: "<ul><li>Prefijo [Noble] en chat</li><li>Kit Noble cada 24h</li><li>3 homes extras</li><li>/hat — bloques como sombrero</li><li>Acceso a /craft</li></ul>" },
  { id: 7363906, name: "Rey", total_price: 9.99, description: "<ul><li>Todo lo de Noble</li><li>Prefijo [Rey] dorado</li><li>Kit Rey cada 12h</li><li>6 homes extras</li><li>/ec — enderchest portátil</li><li>/fly en lobby</li><li>Prioridad en cola</li></ul>" },
  { id: 7363907, name: "Divino", total_price: 19.99, description: "<ul><li>Todo lo de Rey</li><li>Prefijo [Divino] animado</li><li>Kit Divino cada 6h</li><li>10 homes extras</li><li>/feed y /heal</li><li>/fly en survival</li><li>Nick con colores</li></ul>" },
];

/* ═══ Helpers para parsear datos de Tebex ═══ */
function extractPerksFromDescription(html) {
  if (!html) return [];

  // Intentar extraer <li> primero
  const liMatches = html.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
  if (liMatches && liMatches.length > 0) {
    return liMatches.map(li => {
      // Quitar tags HTML internos y limpiar
      return li.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
    }).filter(Boolean);
  }

  // Si no hay <li>, intentar dividir por <br>, <p>, o líneas
  const text = html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);

  // Si las líneas empiezan con * o - o •, las usamos
  const bulletLines = lines.filter(l => /^[\*\-•]/.test(l)).map(l => l.replace(/^[\*\-•]\s*/, ""));
  if (bulletLines.length > 0) return bulletLines;

  // Última opción: cada línea es un perk
  return lines;
}

function transformTebexPackage(pkg) {
  const style = RANK_STYLES[pkg.id] || {
    color: "#94a3b8",
    gradient: "linear-gradient(135deg,#64748b,#94a3b8)",
    tagline: "",
    sortOrder: 99,
  };
  return {
    id: pkg.id,
    name: pkg.name.replace(/^Arzone\s*[·•]\s*/i, "").trim(), // limpia "Arzone · Noble" -> "Noble"
    price: pkg.total_price ?? pkg.base_price ?? 0,
    perks: extractPerksFromDescription(pkg.description),
    tebexUrl: `${TEBEX_STORE}/package/${pkg.id}`,
    color: style.color,
    gradient: style.gradient,
    tagline: style.tagline,
    popular: style.popular || false,
    sortOrder: style.sortOrder,
  };
}

/* ═══ ESTILOS ═══ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0c0a1a;--text:#e2e8f0;--muted:#64748b;--dim:#334155;--accent1:#818cf8;--accent2:#f472b6;--accent3:#fb923c}
body{background:var(--bg);color:var(--text);font-family:'Sora',sans-serif;overflow-x:hidden}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.8}}
@keyframes gradientMove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
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

function Status() {
  const [p, setP] = useState(null);
  useEffect(() => {
    fetch(`https://api.mcsrvstat.us/2/${SERVER_IP}`).then(r => r.json()).then(d => setP(d.players?.online ?? 0)).catch(() => {});
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 100, padding: "6px 16px" }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: p !== null ? "#34d399" : "#555", boxShadow: p !== null ? "0 0 8px rgba(52,211,153,.5)" : "none", animation: p !== null ? "pulse 2s infinite" : "none" }} />
      <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>{p !== null ? `${p} online` : "..."}</span>
    </div>
  );
}

/* ═══ STATS DE VENTAS (desde Tebex) ═══
   Tebex no tiene endpoint público de "total ventas", pero podemos
   mostrar números fijos que actualizas tú o usar el contador del server.
   Por simplicidad usamos "+10 jugadores" como social proof. */
function SalesStats({ totalRanks }) {
  return (
    <Sec style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "center", gap: "clamp(32px,6vw,80px)", padding: "40px 24px 80px", flexWrap: "wrap" }}>
      {[
        { v: 270, s: "+", l: "Rangos vendidos" },
        { v: 5, s: " min", l: "Activación promedio" },
        { v: 99, s: "%", l: "Satisfacción" },
      ].map((s, i) => (
        <div key={i} style={{ textAlign: "center", minWidth: 120 }}>
          <div style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 800, color: "#fff", letterSpacing: -1 }}><Counter value={s.v} suffix={s.s} /></div>
          <div style={{ fontSize: 13, color: "var(--dim)", marginTop: 6, fontWeight: 500, letterSpacing: .5 }}>{s.l}</div>
        </div>
      ))}
    </Sec>
  );
}

/* ═══ RANK CARD ═══ */
function RankCard({ rank, index }) {
  const [h, setH] = useState(false);
  const buy = () => window.open(rank.tebexUrl, "_blank");
  const priceStr = String(rank.price.toFixed(2));
  const [whole, decimal] = priceStr.split(".");

  return (
    <Sec delay={index * 150} style={{ flex: "1 1 320px", maxWidth: 400, minWidth: 280 }}>
      <div className="cg" onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ padding: "36px 32px 32px", display: "flex", flexDirection: "column", height: "100%" }}>
        {rank.popular && (
          <div style={{ position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)", background: rank.gradient, color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: 2, padding: "5px 20px 6px", borderRadius: "0 0 14px 14px", boxShadow: `0 4px 16px ${rank.color}33` }}>MÁS ELEGIDO</div>
        )}

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "inline-block", fontSize: 11, fontWeight: 600, color: rank.color, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12, background: rank.color + "12", padding: "4px 14px", borderRadius: 8 }}>{rank.name}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
            <span style={{ fontSize: 52, fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: -2 }}>${whole}</span>
            <span style={{ fontSize: 22, fontWeight: 600, color: "var(--muted)" }}>.{decimal}</span>
            <span style={{ fontSize: 13, color: "var(--dim)", marginLeft: 4, fontWeight: 500 }}>USD</span>
          </div>
          {rank.tagline && <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>{rank.tagline}</p>}
          <div style={{ marginTop: 10, fontSize: 12, color: "#34d399", fontWeight: 600, background: "rgba(52,211,153,.1)", display: "inline-block", padding: "3px 12px", borderRadius: 8 }}>Permanente</div>
        </div>

        <div style={{ height: 1, background: `linear-gradient(90deg,${rank.color}20,transparent)`, marginBottom: 24 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1, marginBottom: 24 }}>
          {rank.perks.length > 0 ? rank.perks.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: rank.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 6l2 2 4-4" stroke={rank.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <span style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.3 }}>{p}</span>
            </div>
          )) : (
            <p style={{ fontSize: 13, color: "var(--dim)", fontStyle: "italic" }}>Configura los beneficios en Tebex</p>
          )}
        </div>

        <button className="bp" onClick={buy} style={{ color: "#fff", background: h ? rank.gradient : "rgba(255,255,255,.06)", boxShadow: h ? `0 8px 32px ${rank.color}30` : "none" }}>
          Comprar {rank.name}
        </button>
      </div>
    </Sec>
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

/* ═══ MAIN ═══ */
export default function App() {
  const [ranks, setRanks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${TEBEX_API}/packages`);
        if (!res.ok) throw new Error("API error");
        const json = await res.json();
        const packages = json.data || [];

        // Filtrar solo los que están en RANK_STYLES (ignora otros productos)
        const filtered = packages.filter(p => RANK_STYLES[p.id]);
        const transformed = filtered.map(transformTebexPackage).sort((a, b) => a.sortOrder - b.sortOrder);

        if (transformed.length === 0) {
          // No hay rangos definidos, usar fallback
          setRanks(FALLBACK.map(transformTebexPackage).sort((a, b) => a.sortOrder - b.sortOrder));
          setError(true);
        } else {
          setRanks(transformed);
        }
      } catch (err) {
        console.warn("Tebex API offline, usando fallback:", err.message);
        setRanks(FALLBACK.map(transformTebexPackage).sort((a, b) => a.sortOrder - b.sortOrder));
        setError(true);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const copyIP = () => { navigator.clipboard?.writeText(SERVER_IP); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  // Datos derivados para la tabla comparativa
  const allPerksUnique = Array.from(new Set(ranks.flatMap(r => r.perks)));

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: "#0c0a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 40, height: 40, border: "2px solid rgba(129,140,248,.2)", borderTopColor: "#818cf8", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{CSS}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", position: "relative" }}>
      <style>{CSS}</style>
      <AnimBG />

      <nav style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px clamp(16px,5vw,64px)", background: "rgba(12,10,26,.6)", backdropFilter: "blur(16px) saturate(1.2)", borderBottom: "1px solid rgba(255,255,255,.03)" }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 5, userSelect: "none" }}>
          <span className="hero-grad">A</span><span style={{ color: "#fff" }}>RZONE</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <Status />
          <a href={DISCORD_URL} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none", fontWeight: 600, padding: "6px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,.06)" }}>Discord</a>
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
          <button onClick={copyIP} style={{ padding: "15px 36px", borderRadius: 14, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", color: "var(--muted)", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>{copied ? "¡IP Copiada!" : SERVER_IP}</button>
        </div>
      </Sec>

      <SalesStats totalRanks={ranks.length} />

      <Sec style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "0 24px 100px" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent1)", letterSpacing: 3, textTransform: "uppercase", textAlign: "center", marginBottom: 12 }}>Cómo funciona</p>
        <h2 style={{ fontSize: "clamp(24px,4vw,40px)", fontWeight: 800, textAlign: "center", marginBottom: 48, letterSpacing: -1 }}>Tres pasos, menos de cinco minutos</h2>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          {[{ n: "01", t: "Elige tu rango", d: "Compara los beneficios y elige el que mejor se adapte a ti." }, { n: "02", t: "Paga seguro con Tebex", d: "Acepta PayPal, tarjeta de crédito, criptomonedas y métodos locales." }, { n: "03", t: "Juega con ventajas", d: "Tu rango se activa automáticamente. Entra al server y disfruta." }].map((s, i) => (
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
          {ranks.map((r, i) => <RankCard key={r.id} rank={r} index={i} />)}
        </div>
        {error && (
          <p style={{ textAlign: "center", marginTop: 32, fontSize: 12, color: "var(--dim)" }}>
            ⚠️ Mostrando datos de respaldo. Verifica tu Tebex.
          </p>
        )}
      </div>

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
        <FAQ q="¿Los rangos son permanentes?" a="Sí. Pago único, sin suscripciones ni renovaciones." />
        <FAQ q="¿Qué métodos de pago aceptan?" a="PayPal, tarjetas de crédito y débito, criptomonedas y métodos locales según tu país. Todo procesado de forma segura por Tebex." />
        <FAQ q="¿No recibí mi rango?" a="Envía tu comprobante y nombre de Minecraft por Discord." />
        <FAQ q="¿Puedo mejorar mi rango?" a="Sí, compra un rango superior y reemplazará al anterior automáticamente." />
        <FAQ q="¿Tienen cupones de descuento?" a="Sí, lanzamos cupones en Discord. Puedes aplicarlos directamente en el checkout de Tebex." />
      </Sec>

      <Sec style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "0 24px 100px" }}>
        <div style={{ background: "linear-gradient(135deg,rgba(129,140,248,.08),rgba(244,114,182,.06),rgba(251,146,60,.04))", border: "1px solid rgba(255,255,255,.06)", borderRadius: 28, padding: "60px 40px", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(24px,4vw,40px)", fontWeight: 800, marginBottom: 16, letterSpacing: -1 }}>¿Listo para <span className="hero-grad">dominar</span> Arzone?</h2>
          <p style={{ fontSize: 16, color: "var(--muted)", maxWidth: 440, margin: "0 auto 32px", lineHeight: 1.7 }}>Elige tu rango ahora y empieza a disfrutar de ventajas exclusivas hoy mismo.</p>
          <a href="#rangos" style={{ display: "inline-block", padding: "16px 40px", borderRadius: 14, background: "linear-gradient(135deg,#818cf8,#c084fc,#f472b6)", color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none", boxShadow: "0 8px 32px rgba(129,140,248,.2)" }}>Ver rangos</a>
        </div>
      </Sec>

      <footer style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "20px 24px 48px", borderTop: "1px solid rgba(255,255,255,.03)" }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 5, marginBottom: 16 }}><span className="hero-grad">A</span><span style={{ color: "#fff" }}>RZONE</span></div>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 20, flexWrap: "wrap" }}>
          <a href={DISCORD_URL} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--dim)", textDecoration: "none", fontWeight: 500 }}>Discord</a>
          <span style={{ fontSize: 13, color: "var(--dim)", fontWeight: 500 }}>{SERVER_IP}</span>
          <a href={TEBEX_STORE} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--dim)", textDecoration: "none", fontWeight: 500 }}>Tienda Tebex</a>
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,.08)", lineHeight: 2 }}>© 2026 Arzone · Pagos procesados por Tebex · No afiliado con Mojang Studios</p>
      </footer>
    </div>
  );
}
