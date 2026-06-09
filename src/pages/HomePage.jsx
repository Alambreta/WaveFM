import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { searchArtist, getTopArtists, getArtistImage } from "../services/lastfm";

/* ============================== GLOBAL CSS (full — injected once for the whole app) ============================== */
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
  @keyframes ping { 75%,100%{transform:scale(2);opacity:0} }

  @keyframes scratch-flash { 0%{opacity:1} 100%{opacity:0} }
  @keyframes slot-flash { 0%,100%{opacity:1} 50%{opacity:0.25} }
  @keyframes love-toast-in { from{transform:translateY(16px);opacity:0} to{transform:none;opacity:1} }
  @keyframes shutdown-in { from{opacity:0} to{opacity:1} }

  .love-mode { filter: hue-rotate(310deg) saturate(0.85); transition: filter 0.9s ease; }
  .love-mode-off { filter: none; transition: filter 0.9s ease; }
`;

/* ============================== BOOT SEQUENCE ============================== */
const BOOT_LINES = [
  "> waveform.fm terminal v2.6.0",
  "> initializing audioscrobbler core ............ ok",
  "> mounting /dev/wax ......................... ok",
  "> decoding waveform cache ................... ok",
  "> establishing uplink to the ether ......... ok",
  "> loading chart data from last.fm api ...",
  "> welcome back, listener_",
];

function BootSequence({ onDone }) {
  const [n, setN] = useState(0);
  const [flickering, setFlickering] = useState(false);
  useEffect(() => {
    if (n >= BOOT_LINES.length) {
      const t = setTimeout(() => { setFlickering(true); setTimeout(onDone, 750); }, 350);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN((x) => x + 1), n === 0 ? 120 : 175);
    return () => clearTimeout(t);
  }, [n, onDone]);
  return (
    <div
      className={flickering ? "crt-boot-out" : ""}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "#171717", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 1.5rem" }}
    >
      <div style={{ width: "100%", maxWidth: "42rem" }}>
        <pre style={{ fontFamily: '"Space Mono", monospace', fontSize: "clamp(12px,2vw,15px)", lineHeight: 1.8, color: "#8A8F88" }}>
          {BOOT_LINES.slice(0, n).map((l, i) => (
            <div key={i} style={{ color: i === BOOT_LINES.length - 1 ? "#F5A623" : (i >= 1 && i <= 4 ? "#8A8F88" : "#F2EFE9") }}>
              {l.includes("ok")
                ? <span>{l.replace(" ok", " ")}<span style={{ color: "#D4001A" }}>ok</span></span>
                : l}
              {i === n - 1 && <span className="blink" style={{ color: "#D4001A" }}>█</span>}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
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

/* ============================== GENRE CATALOG ============================== */
const GENRE_CATEGORIES = [
  {
    label: "Rock",
    genres: ["rock", "classic rock", "alternative rock", "indie rock", "hard rock", "punk rock", "post-rock", "progressive rock", "psychedelic rock", "grunge", "shoegaze", "garage rock", "art rock", "glam rock"],
  },
  {
    label: "Metal",
    genres: ["metal", "heavy metal", "death metal", "black metal", "doom metal", "thrash metal", "power metal", "nu-metal", "gothic metal", "folk metal"],
  },
  {
    label: "Electronic",
    genres: ["electronic", "techno", "house", "ambient", "trance", "drum and bass", "dubstep", "synthwave", "industrial", "idm", "electronica", "trip-hop", "downtempo", "chillout", "minimal techno", "deep house", "jungle"],
  },
  {
    label: "Pop",
    genres: ["pop", "indie pop", "dream pop", "baroque pop", "synth-pop", "k-pop", "dance pop", "electropop", "art pop"],
  },
  {
    label: "Hip-Hop & R&B",
    genres: ["hip-hop", "rap", "trap", "r&b", "soul", "neo-soul", "conscious hip-hop", "gangsta rap", "lo-fi hip-hop"],
  },
  {
    label: "Jazz & Blues",
    genres: ["jazz", "blues", "jazz fusion", "bebop", "smooth jazz", "free jazz", "delta blues", "chicago blues", "soul jazz"],
  },
  {
    label: "Classical & Instrumental",
    genres: ["classical", "instrumental", "post-classical", "neoclassical", "orchestral", "chamber music", "opera", "contemporary classical"],
  },
  {
    label: "Folk & Country",
    genres: ["folk", "country", "americana", "bluegrass", "alt-country", "celtic", "singer-songwriter", "acoustic"],
  },
  {
    label: "World",
    genres: ["latin", "reggae", "afrobeat", "bossa nova", "world", "flamenco", "salsa", "cumbia", "reggaeton", "dancehall", "samba", "ska"],
  },
  {
    label: "Other",
    genres: ["funk", "disco", "gospel", "new wave", "emo", "hardcore", "post-punk", "noise rock", "math rock", "lo-fi", "vaporwave", "darkwave", "goth"],
  },
];

const fmt = (n) => Number(n).toLocaleString("en-US");

/* ============================== EASTER EGG HELPERS ============================== */
function playScratch(dir = 1) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const dur = 0.38;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.setValueAtTime(dir > 0 ? 280 : 1100, ctx.currentTime);
    filt.frequency.exponentialRampToValueAtTime(dir > 0 ? 1400 : 180, ctx.currentTime + dur);
    filt.Q.value = 2.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
    src.start(); src.stop(ctx.currentTime + dur);
  } catch (_) {}
}

function detectClosedLoop(path) {
  if (path.length < 12) return false;
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x, dy = path[i].y - path[i - 1].y;
    total += Math.sqrt(dx * dx + dy * dy);
  }
  if (total < 120) return false;
  const ex = path[path.length - 1].x - path[0].x;
  const ey = path[path.length - 1].y - path[0].y;
  return Math.sqrt(ex * ex + ey * ey) < Math.min(total * 0.22, 90);
}

function runTerminalCommand(cmd) {
  const c = cmd.trim().toLowerCase();
  if (!c) return [];
  if (c === "ls" || c === "ls music" || c === "ls -la") {
    return [
      "total 8",
      "drwxr-xr-x  feelings/",
      "-rw-r--r--  favourite_song_that_ruins_you.mp3",
      "-rw-r--r--  that_album_you_never_finished.flac",
      "-rw-r--r--  nostalgia_overdose.ogg",
      "-r--------  do_not_open.zip",
    ];
  }
  if (c.startsWith("rm")) return ["rm: Permission denied: cannot delete music. Nice try."];
  if (c === "git blame last.fm") {
    return [
      "^a1b2c3d (Scrobbler Bot   2003-01-01) play_count++",
      "^d4e5f6a (That One Friend 2007-06-14) told_you_this_band_was_good()",
      "^f0a1b2e (You             2018-11-30) listened_at_3am_again()",
      "^c3d4e5f (Nostalgia       2024-01-01) everything_sounds_better_now()",
    ];
  }
  if (c === "whoami") return ["listener_"];
  if (c === "date") return [new Date().toString()];
  if (c === "ping daft_punk" || c === "ping daft punk") {
    return [
      "PING daft_punk: 56 data bytes",
      "Request timeout for icmp_seq 0",
      "Request timeout for icmp_seq 1",
      "— disbanded (2021). still processing.",
    ];
  }
  if (c === "cat feelings.txt") return ["cat: feelings.txt: file too large. seek help."];
  if (c === "sudo shutdown now" || c === "shutdown now" || c === "shutdown") return ["__SHUTDOWN__"];
  if (c === "clear") return ["__CLEAR__"];
  if (c === "exit" || c === "quit" || c === "q") return ["__EXIT__"];
  if (c === "help") {
    return [
      "available commands:",
      "  ls music          — list your music directory",
      "  git blame last.fm — find out who is responsible",
      "  ping daft_punk    — check connectivity",
      "  cat feelings.txt  — read your feelings",
      "  whoami            — existential check",
      "  date              — current timestamp",
      "  clear             — clear terminal",
      "  exit              — close this window",
      "  sudo shutdown now — you will regret this",
    ];
  }
  return [`bash: ${cmd.trim()}: command not found  (try 'help')`];
}

/* ============================== TERMINAL MODAL ============================== */
function TerminalModal({ onClose, onShutdown }) {
  const [lines, setLines] = useState([
    "> waveform.fm terminal v2.6.0",
    "> type 'help' for available commands",
    "",
  ]);
  const [input, setInput] = useState("");
  const [hist, setHist] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lines]);

  const submit = () => {
    const out = runTerminalCommand(input);
    if (out[0] === "__EXIT__") { onClose(); return; }
    if (out[0] === "__SHUTDOWN__") { onShutdown(); return; }
    if (out[0] === "__CLEAR__") { setLines(["> waveform.fm terminal v2.6.0", ""]); setInput(""); return; }
    setLines(l => [...l, `$ ${input}`, ...out, ""]);
    if (input.trim()) setHist(h => [input.trim(), ...h.slice(0, 19)]);
    setHistIdx(-1);
    setInput("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); submit(); return; }
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); const ni = Math.min(histIdx + 1, hist.length - 1); setHistIdx(ni); setInput(hist[ni] ?? ""); }
    if (e.key === "ArrowDown") { e.preventDefault(); const ni = Math.max(histIdx - 1, -1); setHistIdx(ni); setInput(ni === -1 ? "" : hist[ni]); }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: "100%", maxWidth: "44rem", maxHeight: "72vh", background: "#0a0a0a", border: "1px solid #3a3a3a", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.875rem", borderBottom: "1px solid #3a3a3a", background: "#111" }}>
          <span style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: "#8A8F88", letterSpacing: "0.15em", textTransform: "uppercase" }}>waveform.fm — terminal</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8A8F88", cursor: "pointer", fontFamily: '"Space Mono", monospace', fontSize: 18, lineHeight: 1, padding: "0 0.25rem" }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", fontFamily: '"Space Mono", monospace', fontSize: 13, lineHeight: 1.8 }}>
          {lines.map((l, i) => (
            <div key={i} style={{
              color: l.startsWith("$") ? "#F5A623"
                : l.startsWith(">") ? "#F2EFE9"
                : (l.includes("Permission denied") || l.includes("Error") || l.startsWith("bash:") || l.startsWith("rm:")) ? "#D4001A"
                : "#8A8F88"
            }}>{l || " "}</div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", borderTop: "1px solid #3a3a3a" }}>
          <span style={{ color: "#D4001A", fontFamily: '"Space Mono", monospace', fontSize: 13, flexShrink: 0 }}>$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            spellCheck={false}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: '"Space Mono", monospace', fontSize: 13, color: "#F2EFE9" }}
          />
          <span className="blink" style={{ color: "#D4001A", fontFamily: '"Space Mono", monospace', fontSize: 13 }}>█</span>
        </div>
      </div>
    </div>
  );
}

/* ============================== SHUFFLE OVERLAY ============================== */
function ShuffleOverlay({ onDone }) {
  const [displayed, setDisplayed] = useState("...");
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const all = GENRE_CATEGORIES.flatMap(c => c.genres);
    const chosen = all[Math.floor(Math.random() * all.length)];
    let step = 0;
    const total = 30;
    const tick = () => {
      step++;
      const progress = step / total;
      const delay = 45 + progress * progress * 380;
      if (step < total) {
        setDisplayed(all[Math.floor(Math.random() * all.length)]);
        setTimeout(tick, delay);
      } else {
        setDisplayed(chosen);
        setSettled(true);
        setTimeout(() => onDone(chosen), 1000);
      }
    };
    setTimeout(tick, 40);
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200, background: "rgba(23,23,23,0.97)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.25rem"
    }}>
      <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: "#D4001A", textTransform: "uppercase", letterSpacing: "0.3em" }}>
        // shuffle
      </div>
      <div style={{
        fontFamily: '"Playfair Display", serif', fontWeight: 900,
        fontSize: "clamp(2rem, 8vw, 4.5rem)",
        color: settled ? "#F5A623" : "#F2EFE9",
        letterSpacing: "-0.02em", textTransform: "uppercase",
        transition: settled ? "color 0.4s" : "none",
        animation: settled ? "none" : "slot-flash 0.12s linear infinite",
        textAlign: "center", padding: "0 2rem",
      }}>
        {displayed}
      </div>
      {settled && (
        <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 11, color: "#8A8F88" }}>navigating →</div>
      )}
    </div>
  );
}

/* ============================== SEARCH ============================== */
function HomeSearch({ onSelectArtist }) {
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const [results, setResults] = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const debounce = useRef(null);

  const onChange = (e) => {
    const val = e.target.value;
    setQ(val);
    clearTimeout(debounce.current);
    if (val.trim().length < 2) { setResults([]); setShowDrop(false); return; }
    debounce.current = setTimeout(async () => {
      const res = await searchArtist(val);
      setResults(res);
      setShowDrop(true);
    }, 350);
  };

  const onSelect = (name) => { setQ(name); setShowDrop(false); onSelectArtist(name); };

  return (
    <div style={{ flex: 1, maxWidth: "28rem", margin: "0 auto", position: "relative" }}>
      <div style={{
        position: "relative", display: "flex", alignItems: "center", gap: "0.5rem",
        padding: "0 0.75rem", height: "2.25rem", background: "#171717",
        border: `1px solid ${focus ? "#D4001A" : "#3a3a3a"}`, transition: "border-color 0.15s"
      }}>
        <span style={{ color: "#D4001A", fontSize: "0.875rem", userSelect: "none" }}>&gt;</span>
        <input
          value={q} onChange={onChange}
          onFocus={() => setFocus(true)}
          onBlur={() => setTimeout(() => setShowDrop(false), 150)}
          placeholder="search artists, albums…"
          spellCheck="false"
          style={{ width: "100%", background: "transparent", outline: "none", border: "none", fontFamily: '"Space Mono", monospace', fontSize: 13, color: "#F2EFE9" }}
        />
      </div>
      {showDrop && results.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#232325", border: "1px solid #3a3a3a", zIndex: 200, maxHeight: 280, overflowY: "auto" }}>
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
      )}
    </div>
  );
}

/* ============================== HEADER ============================== */
function Header({ onSelectArtist }) {
  const navigate = useNavigate();
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
      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 2.5rem", height: "4rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "baseline", gap: "2px", flexShrink: 0, background: "none", border: "none", padding: 0, cursor: "pointer" }}>
          <span style={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, color: "#F2EFE9", fontSize: "1.125rem", letterSpacing: "-0.02em" }}>waveform</span>
          <span style={{ fontFamily: '"Space Mono", monospace', color: "#D4001A", fontSize: "1.125rem" }}>.fm</span>
          <span className="blink" style={{ fontFamily: '"Space Mono", monospace', color: "#D4001A", fontSize: "1.125rem" }}>_</span>
        </button>
        <HomeSearch onSelectArtist={onSelectArtist} />
      </div>
    </header>
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

/* ============================== TOP ARTISTS CARD ============================== */
function ArtistCard({ a, rank, onClick }) {
  const [hov, setHov] = useState(false);
  const [scratched, setScratched] = useState(false);
  const [scratchDir, setScratchDir] = useState(1);
  const dragRef = useRef({ x: 0, down: false, moved: false, t: 0 });

  const img = a._thumb
    || a.image?.find(i => i.size === "extralarge")?.["#text"]
    || a.image?.find(i => i.size === "large")?.["#text"]
    || null;
  const isDefaultImg = !img || img.includes("2a96cbd8b46e442fc41c2b86b821562f");

  const handlePointerDown = (e) => {
    dragRef.current = { x: e.clientX, down: true, moved: false, t: Date.now() };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e) => {
    if (!dragRef.current.down || dragRef.current.moved) return;
    const dx = e.clientX - dragRef.current.x;
    if (Math.abs(dx) > 38 && Date.now() - dragRef.current.t < 450) {
      const dir = dx > 0 ? 1 : -1;
      dragRef.current.moved = true;
      setScratchDir(dir);
      playScratch(dir);
      setScratched(true);
      setTimeout(() => setScratched(false), 380);
    }
  };
  const handlePointerUp = () => {
    if (!dragRef.current.moved) onClick();
    dragRef.current.down = false;
    dragRef.current.moved = false;
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        cursor: "pointer", userSelect: "none",
        transition: "transform 0.2s",
        transform: scratched
          ? `translateY(-3px) rotate(${scratchDir * 4}deg)`
          : hov ? "translateY(-4px)" : "none"
      }}
    >
      <div style={{ position: "relative", aspectRatio: "1", overflow: "hidden", border: "1px solid #3a3a3a" }}>
        {!isDefaultImg
          ? <img src={img} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: hov ? 0.8 : 0.65, transition: "opacity 0.2s", pointerEvents: "none" }} />
          : <div style={{ width: "100%", height: "100%", background: "radial-gradient(circle at 30% 30%, #3a0a10, #171717)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: '"Playfair Display", serif', fontSize: "3rem", color: "rgba(212,0,26,0.3)" }}>{a.name?.[0] ?? "?"}</span>
            </div>
        }
        <div style={{ position: "absolute", top: 8, left: 8, fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: "1.5rem", color: "rgba(242,239,233,0.5)", fontVariantNumeric: "tabular-nums" }}>
          {String(rank).padStart(2, "0")}
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(23,23,23,0.9))", opacity: hov ? 1 : 0, transition: "opacity 0.2s", display: "flex", alignItems: "flex-end", padding: "0.75rem" }}>
          <span style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: "#F5A623", textTransform: "uppercase", letterSpacing: "0.12em" }}>view profile →</span>
        </div>
        {scratched && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(212,0,26,0.35)", animation: "scratch-flash 0.38s ease forwards", pointerEvents: "none" }} />
        )}
      </div>
      <div style={{ marginTop: "0.75rem" }}>
        <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 13, color: hov ? "#D4001A" : "#F2EFE9", transition: "color 0.15s", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
        {a.listeners && <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 11, color: "#8A8F88", marginTop: 2 }}>{fmt(a.listeners)} listeners</div>}
      </div>
    </div>
  );
}

/* ============================== GENRE CARD ============================== */
function GenreCard({ name, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "rgba(212,0,26,0.12)" : "rgba(40,40,42,0.5)",
        border: `1px solid ${hov ? "#D4001A" : "#3a3a3a"}`,
        color: hov ? "#F2EFE9" : "#C0BCB4",
        fontFamily: '"Space Mono", monospace',
        fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em",
        padding: "0.625rem 1rem",
        cursor: "pointer", transition: "all 0.15s",
        textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
      }}
    >
      {name}
    </button>
  );
}

/* ============================== HOME PAGE ============================== */
export default function HomePage() {
  const navigate = useNavigate();

  // Inject global CSS once — this page loads first so it owns the full stylesheet
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

  const discoRef = useRef(false);
  const [booting, setBooting] = useState(() => !sessionStorage.getItem("waveform_booted"));
  const [topArtists, setTopArtists] = useState([]);
  const [loadingArtists, setLoadingArtists] = useState(true);

  // Easter egg state
  const [showTerminal, setShowTerminal] = useState(false);
  const [showShuffle, setShowShuffle] = useState(false);
  const [loveMode, setLoveMode] = useState(false);
  const [loveToast, setLoveToast] = useState(false);
  const [shuttingDown, setShuttingDown] = useState(false);
  const typingBufRef = useRef("");
  const footerTapRef = useRef({ count: 0, last: 0 });
  const drawPathRef = useRef([]);
  const drawingRef = useRef(false);
  const loveModeRef = useRef(false);
  const loveModeTimerRef = useRef(null);
  const shakeTimesRef = useRef([]);
  const lastShakeMagRef = useRef(0);
  const showShuffleRef = useRef(false);

  useEffect(() => { loveModeRef.current = loveMode; }, [loveMode]);
  useEffect(() => { showShuffleRef.current = showShuffle; }, [showShuffle]);

  // Keyboard: type "sudo" anywhere → terminal | hold "s" for 2s → shuffle
  useEffect(() => {
    let sTimer = null;
    const onKeyDown = (e) => {
      const active = document.activeElement;
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        typingBufRef.current = (typingBufRef.current + e.key.toLowerCase()).slice(-4);
        if (typingBufRef.current === "sudo") { typingBufRef.current = ""; setShowTerminal(true); }
      }
      if (e.key.toLowerCase() === "s" && !e.repeat && !e.ctrlKey && !e.metaKey) {
        sTimer = setTimeout(() => { if (!showShuffleRef.current) setShowShuffle(true); }, 2000);
      }
      if (e.key === "Escape") { setShowTerminal(false); setShowShuffle(false); }
    };
    const onKeyUp = (e) => { if (e.key.toLowerCase() === "s") clearTimeout(sTimer); };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); clearTimeout(sTimer); };
  }, []);

  // Pointer: hold and draw a closed loop → toggle love mode (#5)
  useEffect(() => {
    const onDown = (e) => {
      drawingRef.current = true;
      drawPathRef.current = [{ x: e.clientX, y: e.clientY }];
    };
    const onMove = (e) => {
      if (!drawingRef.current || e.buttons === 0) return;
      drawPathRef.current.push({ x: e.clientX, y: e.clientY });
      if (drawPathRef.current.length > 250) drawPathRef.current.shift();
    };
    const onUp = () => {
      if (drawingRef.current && detectClosedLoop(drawPathRef.current)) {
        if (loveModeRef.current) {
          clearTimeout(loveModeTimerRef.current);
          setLoveMode(false);
        } else {
          setLoveMode(true);
          setLoveToast(true);
          loveModeTimerRef.current = setTimeout(() => setLoveMode(false), 20000);
          setTimeout(() => setLoveToast(false), 4500);
        }
      }
      drawingRef.current = false;
      drawPathRef.current = [];
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  // Device motion: shake phone → shuffle (#2 mobile)
  useEffect(() => {
    const onMotion = (e) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2);
      const delta = Math.abs(mag - lastShakeMagRef.current);
      lastShakeMagRef.current = mag;
      if (delta > 18) {
        const now = Date.now();
        shakeTimesRef.current = shakeTimesRef.current.filter(t => now - t < 1800).concat(now);
        if (shakeTimesRef.current.length >= 4 && !showShuffleRef.current) {
          shakeTimesRef.current = [];
          setShowShuffle(true);
        }
      }
    };
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, []);

  const handleShutdown = () => {
    setShowTerminal(false);
    setShuttingDown(true);
    sessionStorage.removeItem("waveform_booted");
    setTimeout(() => { setShuttingDown(false); setBooting(true); }, 1600);
  };

  const handleShuffleDone = (genre) => {
    setShowShuffle(false);
    navigate(`/genre/${encodeURIComponent(genre)}`);
  };

  const onFooterTap = () => {
    const now = Date.now();
    const { count, last } = footerTapRef.current;
    if (now - last < 700) {
      const nc = count + 1;
      if (nc >= 3) { footerTapRef.current = { count: 0, last: 0 }; setShowTerminal(true); }
      else footerTapRef.current = { count: nc, last: now };
    } else {
      footerTapRef.current = { count: 1, last: now };
    }
  };

  // Start fetching data immediately in the background — ready by the time boot finishes
  useEffect(() => {
    getTopArtists()
      .then(async (data) => {
        setLoadingArtists(false);
        setTopArtists(data);
        // Last.fm removed artist images in 2019 — enrich from TheAudioDB (free, key "2")
        const enriched = await Promise.all(
          data.map(async (a) => {
            try {
              const thumb = await getArtistImage(a.name);
              return thumb ? { ...a, _thumb: thumb } : a;
            } catch { return a; }
          })
        );
        setTopArtists(enriched);
      })
      .catch(() => setLoadingArtists(false));
  }, []);

  const goToArtist = (name) => navigate("/artist", { state: { artist: name } });
  const goToGenre = (tag) => navigate(`/genre/${encodeURIComponent(tag)}`);

  return (
    <div className={loveMode ? "love-mode" : ""} style={{ background: "#171717", minHeight: "100vh" }}>
      {showTerminal && <TerminalModal key={String(showTerminal)} onClose={() => setShowTerminal(false)} onShutdown={handleShutdown} />}
      {showShuffle && <ShuffleOverlay onDone={handleShuffleDone} />}
      {shuttingDown && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", animation: "shutdown-in 0.3s ease forwards" }}>
          <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 13, color: "#D4001A", letterSpacing: "0.15em" }}>shutting down...</div>
        </div>
      )}
      {loveToast && (
        <div style={{
          position: "fixed", bottom: "2rem", right: "1.5rem", zIndex: 90,
          background: "#0a0a0a", border: "1px solid rgba(255,105,180,0.5)",
          padding: "0.875rem 1.25rem", maxWidth: 260,
          fontFamily: '"Space Mono", monospace', fontSize: 12, color: "#FF69B4",
          animation: "love-toast-in 0.4s ease forwards"
        }}>
          ♥ love mode active
          <div style={{ fontSize: 10, color: "rgba(255,105,180,0.45)", marginTop: 4 }}>draw another loop to deactivate</div>
        </div>
      )}
      <Particles discoRef={discoRef} />
      {booting && <BootSequence onDone={() => { sessionStorage.setItem("waveform_booted", "1"); setBooting(false); }} />}

      <Header onSelectArtist={goToArtist} />

      {/* Hero Banner */}
      <div style={{
        position: "relative", padding: "5rem 2.5rem 4rem",
        borderBottom: "1px solid #3a3a3a",
        background: "radial-gradient(120% 80% at 60% 0%, rgba(212,0,26,0.12), transparent 55%), radial-gradient(80% 60% at 10% 100%, rgba(245,166,35,0.06), transparent 50%)"
      }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 11, color: "#D4001A", textTransform: "uppercase", letterSpacing: "0.3em", marginBottom: "1rem" }}>
            // waveform.fm
          </div>
          <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 900, color: "#F2EFE9", fontSize: "clamp(2.5rem,7vw,5.5rem)", letterSpacing: "-0.03em", lineHeight: 0.95, margin: "0 0 1.5rem" }}>
            Discover<br /><span style={{ color: "#D4001A" }}>Music.</span>
          </h1>
          <p style={{ fontFamily: '"Space Mono", monospace', color: "#8A8F88", fontSize: "0.8rem", maxWidth: "42ch", lineHeight: 1.8, margin: 0 }}>
            Explore genres, artists, and the sounds shaping the charts right now.
          </p>
        </div>
      </div>

      {/* Top Artists This Month */}
      <section style={{ maxWidth: "72rem", margin: "0 auto", padding: "5rem 2.5rem" }}>
        <SectionTitle k="// most listened this month">Top Artists</SectionTitle>
        {loadingArtists ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1.25rem" }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i}>
                <div className="skel" style={{ aspectRatio: "1", borderRadius: 0 }} />
                <div className="skel" style={{ height: 12, marginTop: 10, width: "70%", borderRadius: 2 }} />
                <div className="skel" style={{ height: 10, marginTop: 6, width: "50%", borderRadius: 2 }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1.25rem" }}>
            {topArtists.slice(0, 20).map((a, i) => (
              <ArtistCard key={a.name} a={a} rank={i + 1} onClick={() => goToArtist(a.name)} />
            ))}
          </div>
        )}
      </section>

      <div style={{ height: 1, background: "#3a3a3a", maxWidth: "72rem", margin: "0 auto" }} />

      {/* Genre Catalog */}
      <section style={{ maxWidth: "72rem", margin: "0 auto", padding: "5rem 2.5rem" }}>
        <SectionTitle k="// explore by genre">Genre Catalog</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          {GENRE_CATEGORIES.map(({ label, genres }) => (
            <div key={label}>
              <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 11, color: "#F5A623", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "0.875rem" }}>
                {label}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {genres.map(g => <GenreCard key={g} name={g} onClick={() => goToGenre(g)} />)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer onClick={onFooterTap} style={{ maxWidth: "72rem", margin: "0 auto", padding: "3rem 2.5rem", borderTop: "1px solid #3a3a3a", cursor: "default" }}>
        <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 12, color: "rgba(138,143,136,0.5)", textAlign: "center" }}>
          waveform<span style={{ color: "#D4001A" }}>.fm</span> · a remake that remembers
        </div>
      </footer>
    </div>
  );
}
