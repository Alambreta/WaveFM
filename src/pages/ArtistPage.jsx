import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { searchArtist, getArtist, getTopTracks, getTopAlbums, getSimilar, getTopArtists, getTrackInfo } from "../services/lastfm";


/* ==============================
   GLOBAL STYLES (inject once)
============================== */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,800;0,900;1,700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

  html, body { margin: 0; background: #171717; color: #F2EFE9; }
  body { font-family: "Space Mono", monospace; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
  ::selection { background: #D4001A; color: #F2EFE9; }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: #171717; }
  ::-webkit-scrollbar-thumb { background: #3a3a3a; border: 2px solid #171717; }
  ::-webkit-scrollbar-thumb:hover { background: #D4001A; }
  .tab-nums { font-variant-numeric: tabular-nums; }

  .grain::after {
    content: ""; position: fixed; inset: -120%;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
    opacity: 0.06; pointer-events: none; z-index: 9990;
    mix-blend-mode: overlay; animation: grain 0.7s steps(6) infinite;
  }
  @keyframes grain {
    0%{transform:translate(0,0)} 20%{transform:translate(-4%,3%)} 40%{transform:translate(3%,-5%)}
    60%{transform:translate(-3%,2%)} 80%{transform:translate(5%,4%)} 100%{transform:translate(0,0)}
  }
  .scanlines::before {
    content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 9991;
    background: repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0 2px, rgba(0,0,0,0.20) 2px 3px);
    opacity: 0.5;
  }

  @keyframes blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
  .blink { animation: blink 1s steps(1) infinite; }

  @keyframes shimmer { 100% { transform: translateX(100%); } }
  .skel { position: relative; overflow: hidden; background: #232325; }
  .skel::after {
    content:""; position:absolute; inset:0; transform: translateX(-100%);
    background: linear-gradient(90deg, transparent, rgba(242,239,233,0.07), transparent);
    animation: shimmer 1.6s infinite;
  }

  @keyframes eq { 0%,100%{ transform: scaleY(0.25);} 50%{ transform: scaleY(1);} }
  .eqbar { width: 3px; transform-origin: bottom center; background: #D4001A; animation: eq 0.6s ease-in-out infinite; }

  @keyframes glowpulse {
    0%,100% { box-shadow: 0 0 0 1px rgba(245,166,35,0.5), 0 0 8px rgba(245,166,35,0.25); }
    50%     { box-shadow: 0 0 0 1px rgba(245,166,35,0.9), 0 0 18px rgba(245,166,35,0.55); }
  }
  .glow-badge { animation: glowpulse 2.4s ease-in-out infinite; }

  @keyframes spin-slow { to { transform: rotate(360deg); } }
  .vinyl-spin { animation: spin-slow 6s linear infinite; }

  .vinyl {
    border-radius: 50%;
    background:
      radial-gradient(circle at 50% 50%,
        #1a1a1a 0 14%, #0b0b0b 14% 15%, #1a1a1a 15% 27%, #0b0b0b 27% 28%,
        #1a1a1a 28% 41%, #0b0b0b 41% 42%, #1a1a1a 42% 56%, #0b0b0b 56% 57%,
        #1a1a1a 57% 72%, #0b0b0b 72% 73%, #161616 73% 100%);
  }

  @keyframes confetti-fall {
    0%   { transform: translate(0,0) rotate(0deg); opacity: 1; }
    100% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); opacity: 0; }
  }
  .confetti { position: absolute; width: 7px; height: 11px; animation: confetti-fall 1100ms cubic-bezier(.2,.6,.3,1) forwards; }

  @keyframes disco { 0%{filter:none} 50%{filter:hue-rotate(40deg) saturate(1.4) brightness(1.12)} 100%{filter:none} }
  .disco-on { animation: disco 0.5s linear infinite; }
  .disco-flash { position: fixed; inset: 0; pointer-events: none; z-index: 60; mix-blend-mode: screen;
    background: radial-gradient(circle at 50% 40%, rgba(212,0,26,0.25), transparent 60%);
    animation: discoflash 0.5s ease-in-out infinite; }
  @keyframes discoflash { 0%,100%{opacity:0.15} 50%{opacity:0.55} }

  @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  .marquee { display:inline-block; white-space:nowrap; animation: marquee 7s linear infinite; }

  .cursor-dot {
    position: fixed; top: 0; left: 0; width: 16px; height: 16px; border-radius: 50%;
    border: 1.5px solid #D4001A; background: rgba(212,0,26,0.15);
    pointer-events: none; z-index: 9999; transform: translate(-50%,-50%);
    mix-blend-mode: difference; will-change: transform;
  }

  @keyframes flashfade { 0%{opacity:0.85} 100%{opacity:0} }
  .reveal-flash { position: fixed; inset:0; background:#D4001A; pointer-events:none; z-index:9995; animation: flashfade 0.55s ease-out forwards; }

  .fade-up { opacity: 0; transform: translateY(14px); transition: opacity .7s ease, transform .7s ease; }
  .fade-up.in { opacity: 1; transform: none; }

  @keyframes crt-scanline-out {
    0%   { transform: scaleY(1);     filter: brightness(1);            opacity: 1; }
    55%  { transform: scaleY(0.05);  filter: brightness(2.5);          opacity: 1; }
    80%  { transform: scaleY(0.018); filter: brightness(6) blur(1px);  opacity: 1; }
    100% { transform: scaleY(0);     filter: brightness(0);            opacity: 0; }
  }
  .crt-boot-out {
    animation: crt-scanline-out 0.55s ease-in forwards;
    transform-origin: 50% 50%;
  }

  @keyframes crt-wave {
    0%,100% { text-shadow: 1px 0 rgba(212,0,26,0.12), -1px 0 rgba(0,200,255,0.08); transform: none; }
    33%     { text-shadow: -2px 0 rgba(212,0,26,0.16), 2px 0 rgba(0,200,255,0.10); transform: skewX(0.3deg); }
    66%     { text-shadow: 2px 0 rgba(212,0,26,0.10), -1px 0 rgba(0,200,255,0.07); transform: skewX(-0.2deg); }
  }
  .crt-title { animation: crt-wave 5s ease-in-out infinite; }

  @media (hover: none) { .cursor-dot { display: none; } }
`;

const fmt = (n) => Number(n).toLocaleString("en-US");

/* ============================== HOOKS ============================== */
function useCountUp(target, go, duration = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!go || !target) return;
    let raf, start;
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setV(Math.round(ease(p) * target));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [go, target, duration]);
  return v;
}

function useInView() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (seen) return;
    const check = () => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.88 && r.bottom > 0) setSeen(true);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [seen]);
  return [ref, seen];
}


/* ============================== PARTICLES ============================== */
function Particles({ discoRef }) {
  const cv = useRef(null);
  useEffect(() => {
    const c = cv.current;
    const ctx = c.getContext("2d");
    let w, h, raf;
    const N = 70;
    const ps = Array.from({ length: N }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.6 + 0.4,
      vx: (Math.random() - 0.5) * 0.00018,
      vy: -(Math.random() * 0.00022 + 0.00006),
      a: Math.random() * 0.4 + 0.1,
      hue: Math.random() * 360,
    }));
    const resize = () => { w = c.width = window.innerWidth; h = c.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const disco = discoRef.current;
      for (const p of ps) {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        if (p.x < -0.02) p.x = 1.02;
        if (p.x > 1.02) p.x = -0.02;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r, 0, 7);
        if (disco) { p.hue = (p.hue + 2) % 360; ctx.fillStyle = `hsla(${p.hue},90%,60%,${p.a + 0.25})`; }
        else ctx.fillStyle = `rgba(242,239,233,${p.a * 0.5})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [discoRef]);
  return <canvas ref={cv} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1 }} />;
}

/* ============================== CUSTOM CURSOR ============================== */
function CursorDot() {
  const dot = useRef(null);
  useEffect(() => {
    let mx = window.innerWidth / 2, my = window.innerHeight / 2, x = mx, y = my, raf;
    const move = (e) => { mx = e.clientX; my = e.clientY; };
    window.addEventListener("mousemove", move);
    const loop = () => {
      x += (mx - x) * 0.18; y += (my - y) * 0.18;
      if (dot.current) dot.current.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { window.removeEventListener("mousemove", move); cancelAnimationFrame(raf); };
  }, []);
  return <div ref={dot} className="cursor-dot" />;
}

/* ============================== SEARCH DROPDOWN ============================== */
function SearchDropdown({ results, onSelect, visible }) {
  if (!visible || results.length === 0) return null;
  return (
    <div style={{
      position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
      background: "#232325", border: "1px solid #3a3a3a", zIndex: 200,
      maxHeight: 280, overflowY: "auto"
    }}>
      {results.map((r, i) => (
        <div key={i} onClick={() => onSelect(r.name)}
          style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", cursor: "pointer", borderBottom: "1px solid #3a3a3a" }}
          onMouseEnter={e => e.currentTarget.style.background = "#3a3a3a"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          {r.image?.[1]?.["#text"]
            ? <img src={r.image[1]["#text"]} alt={r.name} style={{ width: 32, height: 32, objectFit: "cover", flexShrink: 0 }} />
            : <div style={{ width: 32, height: 32, background: "#3a3a3a", flexShrink: 0 }} />
          }
          <div>
            <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 13, color: "#F2EFE9" }}>{r.name}</div>
            {r.listeners && <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 11, color: "#8A8F88" }}>{fmt(r.listeners)} listeners</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================== HEADER ============================== */
function ListeningNow() {
  const [n, setN] = useState(1247);
  const target = useRef(1247);
  useEffect(() => {
    const tick = setInterval(() => {
      target.current = Math.max(900, target.current + Math.round((Math.random() - 0.45) * 40));
    }, 2600);
    let raf;
    const loop = () => {
      setN((cur) => cur + (target.current - cur) * 0.08);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { clearInterval(tick); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "12px", color: "#8A8F88", whiteSpace: "nowrap" }}>
      <span style={{ position: "relative", display: "flex", width: 8, height: 8 }}>
        <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#D4001A", opacity: 0.75, animation: "ping 1s cubic-bezier(0,0,0.2,1) infinite" }} />
        <span style={{ position: "relative", borderRadius: "50%", width: 8, height: 8, background: "#D4001A" }} />
      </span>
      <span className="tab-nums" style={{ color: "#F2EFE9" }}>{Math.round(n).toLocaleString()}</span>
      <span>listening now</span>
    </div>
  );
}

function TerminalSearch({ onEgg, onSelectArtist }) {
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const [results, setResults] = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const mirror = useRef(null);
  const caret = useRef(null);
  const debounce = useRef(null);

  useLayoutEffect(() => {
    if (mirror.current && caret.current)
      caret.current.style.left = mirror.current.offsetWidth + "px";
  }, [q]);

  const onChange = (e) => {
    const val = e.target.value;
    setQ(val);
    if (val.trim().toLowerCase() === "last.fm") { onEgg(); return; }
    clearTimeout(debounce.current);
    if (val.trim().length < 2) { setResults([]); setShowDrop(false); return; }
    debounce.current = setTimeout(async () => {
      const res = await searchArtist(val);
      setResults(res);
      setShowDrop(true);
    }, 350);
  };

  const onSelect = (name) => {
    setQ(name);
    setShowDrop(false);
    onSelectArtist(name);
  };

  return (
    <div style={{ flex: 1, maxWidth: "28rem", margin: "0 auto", position: "relative" }}>
      <div style={{
        position: "relative", display: "flex", alignItems: "center", gap: "0.5rem",
        padding: "0 0.75rem", height: "2.25rem", background: "#171717",
        border: `1px solid ${focus ? "#D4001A" : "#3a3a3a"}`, transition: "border-color 0.15s"
      }}>
        <span style={{ color: "#D4001A", fontSize: "0.875rem", userSelect: "none" }}>&gt;</span>
        <div style={{ position: "relative", flex: 1 }}>
          <span ref={mirror} style={{ visibility: "hidden", position: "absolute", whiteSpace: "pre", fontFamily: '"Space Mono", monospace', fontSize: 13 }}>
            {q || "search artists, albums…"}
          </span>
          <input
            value={q}
            onChange={onChange}
            onFocus={() => setFocus(true)}
            onBlur={() => setTimeout(() => setShowDrop(false), 150)}
            placeholder="search artists, albums…"
            spellCheck="false"
            style={{
              width: "100%", background: "transparent", outline: "none", border: "none",
              fontFamily: '"Space Mono", monospace', fontSize: 13, color: "#F2EFE9",
              caretColor: "transparent"
            }}
          />
          <span ref={caret} className="blink" style={{
            position: "absolute", top: "50%", transform: "translateY(-50%)",
            width: 7, height: 15, background: "#D4001A", pointerEvents: "none"
          }} />
        </div>
      </div>
      <SearchDropdown results={results} onSelect={onSelect} visible={showDrop} />
    </div>
  );
}

function Header({ onEgg, onSelectArtist, onHome }) {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    window.addEventListener("scroll", on); on();
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 40,
      background: solid ? "rgba(23,23,23,0.85)" : "transparent",
      backdropFilter: solid ? "blur(12px)" : "none",
      borderBottom: solid ? "1px solid #3a3a3a" : "1px solid transparent",
      transition: "background 0.3s, border-color 0.3s"
    }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.25rem", height: "4rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <button onClick={onHome} style={{ display: "flex", alignItems: "baseline", gap: "2px", flexShrink: 0, background: "none", border: "none", padding: 0, cursor: "pointer" }}>
          <span style={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, color: "#F2EFE9", fontSize: "1.125rem", letterSpacing: "-0.02em" }}>waveform</span>
          <span style={{ fontFamily: '"Space Mono", monospace', color: "#D4001A", fontSize: "1.125rem" }}>.fm</span>
          <span className="blink" style={{ fontFamily: '"Space Mono", monospace', color: "#D4001A", fontSize: "1.125rem" }}>_</span>
        </button>
        <TerminalSearch onEgg={onEgg} onSelectArtist={onSelectArtist} />
        <ListeningNow />
      </div>
    </header>
  );
}

/* ============================== HERO ============================== */
function GenreBadge({ g, onClick }) {
  return (
    <span
      className="glow-badge"
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center",
        padding: "0.375rem 0.75rem",
        background: "rgba(40,40,42,0.7)", backdropFilter: "blur(4px)",
        color: "#F5A623", fontSize: 11, textTransform: "uppercase",
        letterSpacing: "0.18em", fontFamily: '"Space Mono", monospace',
        borderRadius: "9999px",
        cursor: onClick ? "pointer" : "default"
      }}>{g}</span>
  );
}

function Hero({ artist, loaded, onListenerClick, onGenreClick }) {
  const listeners = useCountUp(Number(artist?.stats?.listeners ?? 0), loaded, 1400);

  // pick the largest image last.fm returns
  const heroImg = artist?.image?.find(i => i.size === "extralarge")?.["#text"]
    || artist?.image?.find(i => i.size === "large")?.["#text"]
    || null;

  const tags = artist?.tags?.tag?.slice(0, 4).map(t => t.name) ?? [];
  const scrobbles = artist?.stats?.playcount ?? 0;

  const bioText = (() => {
    const raw = artist?.bio?.summary?.split('<a')[0]?.trim() ?? "";
    if (!raw) return null;
    if (raw.length <= 480) return raw;
    const cut = raw.slice(0, 480);
    const lastEnd = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    return lastEnd > 200 ? raw.slice(0, lastEnd + 1) : cut + "…";
  })();

  return (
    <section id="top" style={{ position: "relative" }}>
      <div style={{ position: "relative", height: "84vh", minHeight: 580, width: "100%", overflow: "hidden" }}>
        {/* hero image */}
        {heroImg
          ? <img src={heroImg} alt={artist?.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", opacity: 0.45 }} />
          : <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(135deg, rgba(242,239,233,0.025) 0 2px, transparent 2px 22px)" }} />
        }
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(120% 90% at 70% 20%, rgba(212,0,26,0.18), transparent 55%), radial-gradient(90% 80% at 20% 80%, rgba(245,166,35,0.08), transparent 50%), linear-gradient(180deg, rgba(23,23,23,0.3), #171717)"
        }} />
        {!loaded && <div className="skel" style={{ position: "absolute", inset: 0 }} />}
        <div style={{ position: "absolute", inset: "auto 0 0", height: "78%", background: "linear-gradient(180deg, transparent, #171717 88%)" }} />

        {/* Title + description — centered in hero space */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "5rem 1.25rem 11rem", pointerEvents: "none" }}>
          <div style={{ maxWidth: "56rem", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.875rem", fontSize: 11, fontFamily: '"Space Mono", monospace', color: "#8A8F88", textTransform: "uppercase", letterSpacing: "0.25em" }}>
              <span style={{ width: 32, height: 1, background: "#D4001A", display: "inline-block" }} /> artist profile
            </div>

            {loaded ? (
              <h1 className="crt-title" style={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 900, color: "#F2EFE9", lineHeight: 0.9, letterSpacing: "-0.02em", fontSize: "clamp(2.8rem, 8vw, 7rem)", margin: 0 }}>
                {artist?.name ?? "—"}
              </h1>
            ) : (
              <div className="skel" style={{ height: "clamp(2.8rem,8vw,7rem)", width: "60%", borderRadius: 4, margin: "0 auto" }} />
            )}

            {bioText && (
              <p style={{ marginTop: "1.25rem", marginLeft: "auto", marginRight: "auto", fontFamily: '"Space Mono", monospace', color: "#C0BCB4", fontSize: "0.775rem", maxWidth: "58ch", lineHeight: 1.85 }}
                dangerouslySetInnerHTML={{ __html: bioText }}
              />
            )}
          </div>
        </div>

        {/* Stats + buttons — anchored to bottom */}
        <div style={{ position: "absolute", inset: "auto 0 0" }}>
          <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.25rem 2.5rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "2.5rem 2rem" }}>
              <button onClick={onListenerClick} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
                <div className="tab-nums" style={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, color: "#F2EFE9", lineHeight: 1, fontSize: "clamp(2rem,5vw,3.5rem)" }}>
                  {loaded ? fmt(listeners) : <span style={{ color: "#8A8F88" }}>— — — — —<span className="blink" style={{ color: "#D4001A" }}>█</span></span>}
                </div>
                <div style={{ marginTop: "0.5rem", fontFamily: '"Space Mono", monospace', fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#8A8F88" }}>monthly listeners</div>
              </button>

              <div>
                <div className="tab-nums" style={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, color: "#F5A623", lineHeight: 1, fontSize: "clamp(2rem,5vw,3.5rem)" }}>
                  {loaded ? fmt(scrobbles) : "—"}
                </div>
                <div style={{ marginTop: "0.5rem", fontFamily: '"Space Mono", monospace', fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#8A8F88" }}>all-time plays</div>
              </div>

              {tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
                  {tags.map((g) => <GenreBadge key={g} g={g} onClick={() => onGenreClick?.(g)} />)}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem", marginLeft: "auto" }}>
                <button style={{ padding: "0 1.5rem", height: 48, background: "#D4001A", color: "#F2EFE9", fontFamily: '"Space Mono", monospace', fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>▶</span> play
                </button>
                <button style={{ padding: "0 1.5rem", height: 48, background: "transparent", color: "#F2EFE9", fontFamily: '"Space Mono", monospace', fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.1em", border: "1px solid #3a3a3a", cursor: "pointer" }}>
                  + follow
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================== SECTION TITLE ============================== */
function SectionTitle({ k, children, right }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "1.75rem" }}>
      <div>
        <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 11, color: "#D4001A", textTransform: "uppercase", letterSpacing: "0.3em", marginBottom: "0.5rem" }}>{k}</div>
        <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, color: "#F2EFE9", letterSpacing: "-0.02em", fontSize: "clamp(1.7rem,3.5vw,2.5rem)", margin: 0 }}>{children}</h2>
      </div>
      {right}
    </div>
  );
}

/* ============================== TOP TRACKS ============================== */
function Equalizer() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 20, width: 24 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="eqbar" style={{
          height: "100%",
          animationDuration: (0.45 + Math.random() * 0.5).toFixed(2) + "s",
          animationDelay: (Math.random() * -0.6).toFixed(2) + "s"
        }} />
      ))}
    </div>
  );
}

function Confetti({ x, y }) {
  const bits = Array.from({ length: 34 }, (_, i) => {
    const ang = Math.random() * Math.PI - Math.PI;
    const dist = 60 + Math.random() * 140;
    return {
      dx: Math.cos(ang) * dist + "px",
      dy: (Math.sin(ang) * dist + 120 + Math.random() * 120) + "px",
      rot: (Math.random() * 720 - 360) + "deg",
      delay: (Math.random() * 0.15).toFixed(2) + "s",
      color: Math.random() > 0.35 ? "#D4001A" : "#F5A623",
      left: x, top: y, i,
    };
  });
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, pointerEvents: "none" }}>
      {bits.map((b) => (
        <span key={b.i} className="confetti" style={{
          left: b.left, top: b.top, background: b.color,
          animationDelay: b.delay,
          "--dx": b.dx, "--dy": b.dy, "--rot": b.rot
        }} />
      ))}
    </div>
  );
}

function TrackRow({ t, pos, onNo1Hover, onNo1Leave }) {
  const [ref, seen] = useInView();
  const plays = useCountUp(Number(t.playcount ?? 0), seen, 800);
  const [hover, setHover] = useState(false);
  const isFirst = pos === 1;
  const len = t.duration ? `${Math.floor(t.duration / 60)}:${String(t.duration % 60).padStart(2, "0")}` : "—:——";
  return (
    <div
      ref={ref}
      onMouseEnter={(e) => { setHover(true); if (isFirst) onNo1Hover(e); }}
      onMouseLeave={() => { setHover(false); if (isFirst) onNo1Leave(); }}
      style={{
        display: "grid", gridTemplateColumns: "44px 1fr auto",
        alignItems: "center", gap: "1rem",
        padding: "0.875rem 1.25rem",
        borderBottom: "1px solid rgba(62,62,62,0.6)",
        background: isFirst && hover ? "rgba(212,0,26,0.06)" : hover ? "rgba(40,40,42,0.4)" : "transparent",
        transition: "background 0.15s", cursor: "default"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        {isFirst && hover
          ? <Equalizer />
          : <span style={{ fontFamily: '"Playfair Display", serif', fontSize: "1.5rem", color: hover ? "#D4001A" : "rgba(138,143,136,0.7)", transition: "color 0.15s", fontVariantNumeric: "tabular-nums" }}>{String(pos).padStart(2, "0")}</span>
        }
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: '"Space Mono", monospace', fontSize: 15, color: "#F2EFE9" }}>{t.name}</span>
          {isFirst && <span style={{ flexShrink: 0, color: "#F5A623", fontSize: "0.75rem" }}>★</span>}
        </div>
        <div style={{ marginTop: 8, height: 2, background: "rgba(62,62,62,0.7)", overflow: "hidden", opacity: hover ? 1 : 0, maxWidth: hover ? "100%" : 0, transition: "opacity 0.3s, max-width 0.3s" }}>
          <div style={{ height: "100%", background: "#D4001A", width: (20 + (pos * 9) % 60) + "%" }} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "1rem", fontFamily: '"Space Mono", monospace', fontSize: 13, color: "rgba(138,143,136,0.7)", fontVariantNumeric: "tabular-nums" }}>
        <span style={{ color: "#8A8F88", fontSize: 11 }}>{fmt(plays)}</span>
        <span style={{ color: "#D4001A", opacity: hover ? 1 : 0, transition: "opacity 0.15s" }}>▶</span>
        {len}
      </div>
    </div>
  );
}

function TopTracks({ tracks }) {
  const [confetti, setConfetti] = useState(null);
  const timer = useRef(null);
  const onNo1Hover = (e) => {
    const x = e.clientX, y = e.clientY;
    timer.current = setTimeout(() => {
      setConfetti({ x, y, id: Date.now() });
      setTimeout(() => setConfetti(null), 1400);
    }, 3000);
  };
  const onNo1Leave = () => clearTimeout(timer.current);

  if (!tracks.length) return null;
  return (
    <section style={{ maxWidth: "72rem", margin: "0 auto", padding: "4rem 1.25rem" }}>
      <SectionTitle k="// most played" right={
        <span style={{ fontFamily: '"Space Mono", monospace', fontSize: "0.75rem", color: "#8A8F88" }}>top {tracks.length} tracks</span>
      }>Top Tracks</SectionTitle>
      <div style={{ border: "1px solid #3a3a3a", background: "rgba(40,40,42,0.3)" }}>
        {tracks.map((t, i) => <TrackRow key={t.name} t={t} pos={i + 1} onNo1Hover={onNo1Hover} onNo1Leave={onNo1Leave} />)}
      </div>
      {confetti && (
        <>
          <Confetti key={confetti.id} x={confetti.x} y={confetti.y} />
          <div style={{ position: "fixed", zIndex: 50, pointerEvents: "none", fontFamily: '"Playfair Display", serif', fontStyle: "italic", color: "#F5A623", fontSize: "1.125rem", left: confetti.x, top: confetti.y - 30, transform: "translate(-50%,-100%)" }}>
            "Clásico indiscutible."
          </div>
        </>
      )}
    </section>
  );
}

/* ============================== ALBUMS (3D tilt) ============================== */
function AlbumCard({ a, index, artistName }) {
  const ref = useRef(null);
  const [hov, setHov] = useState(false);
  const hues = [8, 38, 320, 200, 160];
  const hue = hues[index % hues.length];

  const coverImg = a.image?.find(i => i.size === "extralarge")?.["#text"]
    || a.image?.find(i => i.size === "large")?.["#text"]
    || null;

  const onMove = (e) => {
    const el = ref.current, r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${px * 14}deg) rotateX(${-py * 14}deg) translateY(-8px)`;
  };
  const onLeave = () => { ref.current.style.transform = "perspective(800px) rotateY(0) rotateX(0) translateY(0)"; };

  return (
    <div style={{ perspective: "800px", cursor: "pointer" }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent((artistName ?? "") + " " + a.name)}`, "_blank", "noopener")}>
      <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
           style={{ position: "relative", aspectRatio: "1", transition: "transform 0.2s ease-out, box-shadow 0.2s", willChange: "transform", boxShadow: hov ? "0 30px 60px -15px rgba(0,0,0,0.8)" : "none", transformStyle: "preserve-3d" }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", border: "1px solid #3a3a3a" }}>
          {coverImg
            ? <img src={coverImg} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <div style={{ width: "100%", height: "100%", background: `radial-gradient(120% 120% at 30% 20%, oklch(0.32 0.13 ${hue}), #171717 70%)` }}>
                <div style={{ position: "absolute", inset: 0, opacity: 0.25, backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0 2px, transparent 2px 4px)" }} />
                <div style={{ position: "absolute", inset: 0, padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: "rgba(242,239,233,0.5)", letterSpacing: "0.1em" }}>LP</span>
                  <span style={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: "#F2EFE9", lineHeight: 0.95, fontSize: "1.5rem", letterSpacing: "-0.02em" }}>{a.name}</span>
                </div>
              </div>
          }
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem", background: "rgba(23,23,23,0.7)", opacity: hov ? 1 : 0, transition: "opacity 0.2s" }}>
          <span style={{ fontFamily: '"Playfair Display", serif', fontWeight: 900, color: "#F5A623", fontSize: "1.75rem", textAlign: "center", padding: "0 8px" }}>{a.name}</span>
          <span style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: "rgba(242,239,233,0.65)", letterSpacing: "0.12em", textTransform: "uppercase" }}>▶ open on youtube</span>
        </div>
      </div>
      <div style={{ marginTop: "0.75rem", fontFamily: '"Space Mono", monospace', fontSize: 13, color: "#F2EFE9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
      <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 11, color: "#8A8F88" }}>album</div>
    </div>
  );
}

function Albums({ albums, artistName }) {
  if (!albums.length) return null;
  return (
    <section style={{ maxWidth: "72rem", margin: "0 auto", padding: "4rem 1.25rem" }}>
      <SectionTitle k="// discography">Albums</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1.25rem" }}>
        {albums.map((a, i) => <AlbumCard key={a.name} a={a} index={i} artistName={artistName} />)}
      </div>
    </section>
  );
}

/* ============================== SIMILAR ARTISTS ============================== */
function VinylCard({ s, onSelect }) {
  const [hov, setHov] = useState(false);
  const artistImg = (() => {
    const img = s.image?.find(i => i.size === "large")?.["#text"]
      || s.image?.find(i => i.size === "medium")?.["#text"];
    return img && !img.includes("2a96cbd8b46e442fc41c2b86b821562f") ? img : null;
  })();
  return (
    <div style={{ flexShrink: 0, width: 192, scrollSnapAlign: "start", cursor: "pointer" }}
         onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
         onClick={() => onSelect(s.name)}>
      <div style={{ position: "relative", width: 192, height: 192 }}>
        <div className={`vinyl${hov ? " vinyl-spin" : ""}`} style={{ width: 192, height: 192, boxShadow: "0 14px 40px -12px rgba(0,0,0,0.8)" }}>
          <div style={{ position: "absolute", inset: 0, margin: "auto", width: "34%", height: "34%", borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: artistImg ? "transparent" : "radial-gradient(circle, #D4001A, #8a0011)" }}>
            {artistImg
              ? <img src={artistImg} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              : <div style={{ width: "18%", height: "18%", borderRadius: "50%", background: "#171717" }} />
            }
          </div>
        </div>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", pointerEvents: "none", background: "linear-gradient(120deg, rgba(255,255,255,0.10) 0%, transparent 40%)" }} />
      </div>
      <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: '"Space Mono", monospace', fontSize: "0.875rem", color: hov ? "#D4001A" : "#F2EFE9", transition: "color 0.15s" }}>{s.name}</div>
          <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 11, color: "#8A8F88" }}>similar artist</div>
        </div>
        <div style={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: "#F5A623", fontSize: "1.125rem", fontVariantNumeric: "tabular-nums" }}>{Math.round(Number(s.match) * 100)}%</div>
      </div>
    </div>
  );
}

function SimilarArtists({ similar, onSelect }) {
  const scroller = useRef(null);
  const nudge = (d) => scroller.current.scrollBy({ left: d, behavior: "smooth" });
  if (!similar.length) return null;
  return (
    <section style={{ maxWidth: "72rem", margin: "0 auto", padding: "4rem 1.25rem" }}>
      <SectionTitle k="// listeners also play" right={
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {["←","→"].map((arrow, i) => (
            <button key={arrow} onClick={() => nudge(i === 0 ? -420 : 420)} style={{ width: 40, height: 40, border: "1px solid #3a3a3a", background: "transparent", color: "#8A8F88", cursor: "pointer", fontFamily: '"Space Mono", monospace', fontSize: "1rem" }}>{arrow}</button>
          ))}
        </div>
      }>Similar Artists</SectionTitle>
      <div ref={scroller} style={{ display: "flex", gap: "2rem", overflowX: "auto", paddingBottom: "1rem", scrollSnapType: "x mandatory", scrollbarWidth: "thin" }}>
        {similar.map((s) => <VinylCard key={s.name} s={s} onSelect={onSelect} />)}
      </div>
    </section>
  );
}

/* ============================== WINAMP PLAYER ============================== */
function WinampPlayer({ onClose, artistName }) {
  const [playing, setPlaying] = useState(true);
  const [xy, setXy] = useState({ x: window.innerWidth - 360, y: window.innerHeight - 220 });
  const drag = useRef(null);
  const onDown = (e) => { drag.current = { sx: e.clientX, sy: e.clientY, ox: xy.x, oy: xy.y }; };
  useEffect(() => {
    const mv = (e) => { if (!drag.current) return; setXy({ x: drag.current.ox + e.clientX - drag.current.sx, y: drag.current.oy + e.clientY - drag.current.sy }); };
    const up = () => { drag.current = null; };
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
  }, [xy]);
  return (
    <div style={{ position: "fixed", zIndex: 80, width: 320, userSelect: "none", fontFamily: '"Space Mono", monospace', left: xy.x, top: xy.y }}>
      <div style={{ border: "1px solid #3a3a3a", background: "#232325", boxShadow: "0 20px 60px -10px rgba(0,0,0,0.9)" }}>
        <div onMouseDown={onDown} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 0.5rem", height: 28, background: "#171717", borderBottom: "1px solid #3a3a3a", cursor: "move" }}>
          <span style={{ fontSize: 10, letterSpacing: "0.1em", color: "#D4001A" }}>◆ WAVEAMP 2.6</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8A8F88", fontSize: "0.75rem", cursor: "pointer", padding: "0 4px" }}>✕</button>
        </div>
        <div style={{ padding: "0.75rem" }}>
          <div style={{ background: "#171717", border: "1px solid #3a3a3a", padding: "6px 8px", overflow: "hidden" }}>
            <div style={{ fontSize: 11, color: "#F5A623" }}>
              <span className="marquee">{artistName ?? "waveform.fm"}   ★   waveform.fm   ★   {artistName ?? "waveform.fm"}   ★   waveform.fm   ★   </span>
            </div>
          </div>
          <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "flex-end", gap: 2, height: 40, background: "#171717", border: "1px solid #3a3a3a", padding: "4px 8px" }}>
            {Array.from({ length: 22 }).map((_, i) => (
              <span key={i} style={{
                flex: 1, background: i % 3 === 0 ? "#F5A623" : "#D4001A",
                height: playing ? "100%" : "10%", transformOrigin: "bottom",
                animation: playing ? `eq ${(0.4 + Math.random() * 0.5).toFixed(2)}s ease-in-out ${(Math.random() * -0.6).toFixed(2)}s infinite` : "none"
              }} />
            ))}
          </div>
          <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: 6 }}>
            <button style={{ flex: 1, height: 28, background: "#171717", border: "1px solid #3a3a3a", color: "#F2EFE9", fontSize: "0.75rem", cursor: "pointer" }}>⏮</button>
            <button onClick={() => setPlaying((p) => !p)} style={{ flex: 2, height: 28, background: "#D4001A", border: "1px solid #D4001A", color: "#171717", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>
              {playing ? "❚❚ PAUSE" : "▶ PLAY"}
            </button>
            <button style={{ flex: 1, height: 28, background: "#171717", border: "1px solid #3a3a3a", color: "#F2EFE9", fontSize: "0.75rem", cursor: "pointer" }}>⏭</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== FOOTER ============================== */
function Footer() {
  return (
    <footer style={{ maxWidth: "72rem", margin: "0 auto", padding: "4rem 1.25rem", borderTop: "1px solid #3a3a3a", marginTop: "2rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "1.5rem", fontFamily: '"Space Mono", monospace', fontSize: 12, color: "#8A8F88" }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: "0.75rem" }}>
            <span style={{ fontWeight: 700, color: "#F2EFE9", fontSize: "1rem" }}>waveform</span>
            <span style={{ color: "#D4001A", fontSize: "1rem" }}>.fm</span>
          </div>
          <p style={{ maxWidth: "20rem", lineHeight: 1.6 }}>a remake that remembers. scrobbling the ghosts in the machine since whenever you started listening.</p>
        </div>
        <div style={{ display: "flex", gap: "3rem" }}>
          {[["explore", ["charts", "tags", "events"]], ["you", ["library", "history", "settings"]]].map(([label, links]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <span style={{ color: "#D4001A", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: 10, marginBottom: 4 }}>{label}</span>
              {links.map((l) => <a key={l} style={{ cursor: "pointer", color: "#8A8F88" }}>{l}</a>)}
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: "2.5rem", fontSize: 11, color: "rgba(138,143,136,0.5)", fontFamily: '"Space Mono", monospace' }}>
        psst — try the konami code. ↑↑↓↓←→←→ B A
      </div>
    </footer>
  );
}

/* ============================== APP ============================== */
export default function ArtistPage() {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const id = "waveform-global-css";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = GLOBAL_CSS;
      document.head.appendChild(el);
    }
    document.body.classList.add("grain", "scanlines");
    return () => document.body.classList.remove("grain", "scanlines");
  }, []);

  const [loaded, setLoaded] = useState(false);
  const [disco, setDisco] = useState(false);
  const discoRef = useRef(false);
  const [winamp, setWinamp] = useState(false);
  const [lastfmEgg, setLastfmEgg] = useState(false);
  const [endMsg, setEndMsg] = useState(false);
  const listenerClicks = useRef([]);
  const endShown = useRef(false);

  // API data
  const [artist, setArtist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [currentArtist, setCurrentArtist] = useState("");

  // load artist data
  const loadArtist = async (name) => {
    setLoaded(false);
    setArtist(null); setTracks([]); setAlbums([]); setSimilar([]);
    try {
      const [a, t, al, s] = await Promise.all([
        getArtist(name),
        getTopTracks(name),
        getTopAlbums(name),
        getSimilar(name),
      ]);
      setArtist(a);
      setAlbums(al);
      setSimilar(s);
      // Enrich tracks with durations via track.getInfo (artist.gettoptracks often returns 0)
      const enriched = await Promise.all(
        t.map(async (track) => {
          if (Number(track.duration) > 0) return track;
          try {
            const info = await getTrackInfo(name, track.name);
            const sec = Math.round(Number(info?.duration ?? 0) / 1000);
            return { ...track, duration: sec };
          } catch { return track; }
        })
      );
      setTracks(enriched);
      setLoaded(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
    }
  };

  // Load artist on mount — from navigation state or fallback to a random top artist
  useEffect(() => {
    const name = location.state?.artist;
    if (name) {
      setCurrentArtist(name);
      loadArtist(name);
    } else {
      getTopArtists()
        .then(artists => {
          const pick = artists.length > 0
            ? artists[Math.floor(Math.random() * Math.min(10, artists.length))].name
            : "The Beatles";
          setCurrentArtist(pick);
          loadArtist(pick);
        })
        .catch(() => { setCurrentArtist("The Beatles"); loadArtist("The Beatles"); });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSelectArtist = (name) => {
    setCurrentArtist(name);
    loadArtist(name);
  };

  const onGenreClick = (tag) => navigate(`/genre/${encodeURIComponent(tag)}`);

  const triggerDisco = () => {
    setDisco(true); discoRef.current = true;
    setTimeout(() => { setDisco(false); discoRef.current = false; }, 4000);
  };
  const onListenerClick = () => {
    const now = Date.now();
    listenerClicks.current = listenerClicks.current.filter((t) => now - t < 1500);
    listenerClicks.current.push(now);
    if (listenerClicks.current.length >= 5) { listenerClicks.current = []; triggerDisco(); }
  };

  const onEgg = () => { setLastfmEgg(true); setTimeout(() => setLastfmEgg(false), 3000); };

  useEffect(() => {
    const seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
    let idx = 0;
    const on = (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === seq[idx]) { idx++; if (idx === seq.length) { setWinamp(true); idx = 0; } }
      else idx = (k === seq[0]) ? 1 : 0;
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  useEffect(() => {
    const on = () => {
      if (endShown.current) return;
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
        endShown.current = true; setEndMsg(true);
        setTimeout(() => setEndMsg(false), 4500);
      }
    };
    window.addEventListener("scroll", on);
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const els = [...document.querySelectorAll(".fade-up")];
    const check = () => els.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) el.classList.add("in");
    });
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => { window.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, [loaded]);

  return (
    <div style={{ background: "#171717", minHeight: "100vh" }} className={disco ? "disco-on" : ""}>
      <Particles discoRef={discoRef} />
      <CursorDot />
      {disco && <div className="disco-flash" />}

      <Header onEgg={onEgg} onSelectArtist={onSelectArtist} onHome={() => navigate("/home")} />
      <Hero artist={artist} loaded={loaded} onListenerClick={onListenerClick} onGenreClick={onGenreClick} />

      <div className="fade-up"><TopTracks tracks={tracks} /></div>
      <div className="fade-up"><Albums albums={albums} artistName={artist?.name} /></div>
      <div className="fade-up"><SimilarArtists similar={similar} onSelect={onSelectArtist} /></div>
      <Footer />

      {winamp && <WinampPlayer onClose={() => setWinamp(false)} artistName={artist?.name} />}

      {lastfmEgg && (
        <div style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(23,23,23,0.7)", backdropFilter: "blur(4px)", pointerEvents: "none" }}>
          <div style={{ textAlign: "center", padding: "2.5rem 2rem", border: "1px solid #D4001A", background: "rgba(40,40,42,0.9)" }}>
            <div style={{ fontFamily: '"Space Mono", monospace', fontSize: "3rem", fontWeight: 700, color: "#D4001A", letterSpacing: "-0.02em" }}>
              last<span style={{ color: "#F5A623" }}>.</span>fm
            </div>
            <div style={{ marginTop: "1rem", fontFamily: '"Space Mono", monospace', color: "#8A8F88", fontSize: "0.875rem" }}>where it all started.</div>
            <div style={{ marginTop: "0.5rem", fontFamily: '"Space Mono", monospace', fontSize: 10, color: "rgba(138,143,136,0.5)" }}>est. 2002 · an homage</div>
          </div>
        </div>
      )}

      <div style={{
        position: "fixed", bottom: 20, right: 20, zIndex: 85, maxWidth: 260,
        border: "1px solid #3a3a3a", background: "rgba(40,40,42,0.95)",
        padding: "0.75rem 1rem", fontFamily: '"Space Mono", monospace', fontSize: 12, color: "#F2EFE9",
        transition: "opacity 0.5s, transform 0.5s",
        opacity: endMsg ? 1 : 0, transform: endMsg ? "translateY(0)" : "translateY(12px)",
        pointerEvents: endMsg ? "auto" : "none"
      }}>
        <span style={{ color: "#D4001A" }}>▌</span> You've reached the end of the internet.{" "}
        <span style={{ color: "#8A8F88" }}>Go outside.</span>
      </div>
    </div>
  );
}
