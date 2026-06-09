import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { searchArtist, getTagTopArtists } from "../services/lastfm";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,800;0,900;1,700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
  html, body { margin: 0; background: #171717; color: #F2EFE9; }
  body { font-family: "Space Mono", monospace; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
  ::selection { background: #D4001A; color: #F2EFE9; }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: #171717; }
  ::-webkit-scrollbar-thumb { background: #3a3a3a; border: 2px solid #171717; }
  ::-webkit-scrollbar-thumb:hover { background: #D4001A; }
  @keyframes blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
  .blink { animation: blink 1s steps(1) infinite; }
  @keyframes shimmer { 100% { transform: translateX(100%); } }
  .skel { position: relative; overflow: hidden; background: #232325; }
  .skel::after {
    content:""; position:absolute; inset:0; transform: translateX(-100%);
    background: linear-gradient(90deg, transparent, rgba(242,239,233,0.07), transparent);
    animation: shimmer 1.6s infinite;
  }
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
`;

const fmt = (n) => Number(n).toLocaleString("en-US");

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
          placeholder="search artists…"
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
      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.25rem", height: "4rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <button onClick={() => navigate("/home")} style={{ display: "flex", alignItems: "baseline", gap: "2px", flexShrink: 0, background: "none", border: "none", padding: 0, cursor: "pointer" }}>
          <span style={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, color: "#F2EFE9", fontSize: "1.125rem", letterSpacing: "-0.02em" }}>waveform</span>
          <span style={{ fontFamily: '"Space Mono", monospace', color: "#D4001A", fontSize: "1.125rem" }}>.fm</span>
          <span className="blink" style={{ fontFamily: '"Space Mono", monospace', color: "#D4001A", fontSize: "1.125rem" }}>_</span>
        </button>
        <HomeSearch onSelectArtist={onSelectArtist} />
        <button
          onClick={() => navigate("/home")}
          style={{ flexShrink: 0, background: "transparent", border: "1px solid #3a3a3a", color: "#8A8F88", fontFamily: '"Space Mono", monospace', fontSize: 11, padding: "0.4rem 0.875rem", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#D4001A"; e.currentTarget.style.color = "#F2EFE9"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#3a3a3a"; e.currentTarget.style.color = "#8A8F88"; }}
        >
          ← Home
        </button>
      </div>
    </header>
  );
}

/* ============================== ARTIST CARD ============================== */
function ArtistCard({ a, rank, onClick }) {
  const [hov, setHov] = useState(false);
  const img = a.image?.find(i => i.size === "extralarge")?.["#text"]
    || a.image?.find(i => i.size === "large")?.["#text"]
    || null;
  const isDefault = !img || img.includes("2a96cbd8b46e442fc41c2b86b821562f");

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ cursor: "pointer", transition: "transform 0.2s", transform: hov ? "translateY(-4px)" : "none" }}
    >
      <div style={{ position: "relative", aspectRatio: "1", overflow: "hidden", border: `1px solid ${hov ? "#D4001A" : "#3a3a3a"}`, transition: "border-color 0.15s" }}>
        {!isDefault
          ? <img src={img} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: hov ? 0.85 : 0.65, transition: "opacity 0.2s" }} />
          : <div style={{ width: "100%", height: "100%", background: `radial-gradient(circle at 30% 30%, #3a0a10, #171717)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: '"Playfair Display", serif', fontSize: "2.5rem", color: "rgba(212,0,26,0.35)" }}>{a.name?.[0] ?? "?"}</span>
            </div>
        }
        {rank && (
          <div style={{ position: "absolute", top: 6, left: 6, fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: "1.25rem", color: "rgba(242,239,233,0.45)", fontVariantNumeric: "tabular-nums" }}>
            {String(rank).padStart(2, "0")}
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(23,23,23,0.9))", opacity: hov ? 1 : 0, transition: "opacity 0.2s", display: "flex", alignItems: "flex-end", padding: "0.75rem" }}>
          <span style={{ fontFamily: '"Space Mono", monospace', fontSize: 10, color: "#F5A623", textTransform: "uppercase", letterSpacing: "0.12em" }}>view profile →</span>
        </div>
      </div>
      <div style={{ marginTop: "0.75rem" }}>
        <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 13, color: hov ? "#D4001A" : "#F2EFE9", transition: "color 0.15s", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
        {a.listeners && (
          <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 11, color: "#8A8F88", marginTop: 2 }}>{fmt(a.listeners)} listeners</div>
        )}
      </div>
    </div>
  );
}

/* ============================== GENRE PAGE ============================== */
export default function GenrePage() {
  const navigate = useNavigate();
  const { tag } = useParams();
  const decodedTag = decodeURIComponent(tag ?? "");

  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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

  useEffect(() => {
    if (!decodedTag) return;
    setLoading(true);
    setError(false);
    setArtists([]);
    getTagTopArtists(decodedTag, 50)
      .then(data => { setArtists(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [decodedTag]);

  const goToArtist = (name) => navigate("/artist", { state: { artist: name } });

  return (
    <div style={{ background: "#171717", minHeight: "100vh" }}>
      <Header onSelectArtist={goToArtist} />

      {/* Genre Hero */}
      <div style={{
        position: "relative", padding: "5rem 1.25rem 4rem",
        borderBottom: "1px solid #3a3a3a",
        background: "radial-gradient(120% 80% at 60% 0%, rgba(212,0,26,0.1), transparent 55%)"
      }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 11, color: "#D4001A", textTransform: "uppercase", letterSpacing: "0.3em", marginBottom: "1rem" }}>
            // genre
          </div>
          <h1 style={{
            fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 900,
            color: "#F2EFE9", fontSize: "clamp(2.5rem,7vw,5.5rem)",
            letterSpacing: "-0.03em", lineHeight: 0.95, margin: "0 0 1.25rem",
            textTransform: "capitalize"
          }}>
            {decodedTag}
          </h1>
          <p style={{ fontFamily: '"Space Mono", monospace', color: "#8A8F88", fontSize: "0.775rem", margin: 0 }}>
            Top artists for <span style={{ color: "#F5A623" }}>{decodedTag}</span> — sourced from Last.fm
          </p>
        </div>
      </div>

      {/* Artists Grid */}
      <section style={{ maxWidth: "72rem", margin: "0 auto", padding: "4rem 1.25rem" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "1.75rem" }}>
          <div>
            <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 11, color: "#D4001A", textTransform: "uppercase", letterSpacing: "0.3em", marginBottom: "0.5rem" }}>// artists</div>
            <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, color: "#F2EFE9", letterSpacing: "-0.02em", fontSize: "clamp(1.7rem,3.5vw,2.5rem)", margin: 0 }}>
              {loading ? "Loading…" : `${artists.length} Artists`}
            </h2>
          </div>
        </div>

        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "1.5rem" }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i}>
                <div className="skel" style={{ aspectRatio: "1" }} />
                <div className="skel" style={{ height: 12, marginTop: 10, width: "70%", borderRadius: 2 }} />
                <div className="skel" style={{ height: 10, marginTop: 6, width: "45%", borderRadius: 2 }} />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div style={{
            padding: "3rem", border: "1px solid #3a3a3a", textAlign: "center",
            fontFamily: '"Space Mono", monospace', fontSize: 13, color: "#8A8F88"
          }}>
            <div style={{ color: "#D4001A", marginBottom: "0.5rem" }}>// error</div>
            Could not load artists for "{decodedTag}". The tag may not exist on Last.fm.
          </div>
        )}

        {!loading && !error && artists.length === 0 && (
          <div style={{
            padding: "3rem", border: "1px solid #3a3a3a", textAlign: "center",
            fontFamily: '"Space Mono", monospace', fontSize: 13, color: "#8A8F88"
          }}>
            No artists found for "{decodedTag}".
          </div>
        )}

        {!loading && !error && artists.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "1.5rem" }}>
            {artists.map((a, i) => (
              <ArtistCard key={a.name} a={a} rank={i + 1} onClick={() => goToArtist(a.name)} />
            ))}
          </div>
        )}
      </section>

      <footer style={{ maxWidth: "72rem", margin: "0 auto", padding: "3rem 1.25rem", borderTop: "1px solid #3a3a3a" }}>
        <div style={{ fontFamily: '"Space Mono", monospace', fontSize: 12, color: "rgba(138,143,136,0.5)", textAlign: "center" }}>
          waveform<span style={{ color: "#D4001A" }}>.fm</span> · a remake that remembers
        </div>
      </footer>
    </div>
  );
}
