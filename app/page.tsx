export default function Home() {
  return (
    <main className="av-main">
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <p className="sub">
          <span className="neon-cyan">INSERT COIN</span>{" "}
          <span className="blink neon-yellow">_</span>
        </p>
        <div className="detail-actions" style={{ justifyContent: "center", marginTop: 32 }}>
          <a className="btn" href="#">
            Jugar ahora
          </a>
          <a className="btn ghost" href="#">
            Salón de la fama
          </a>
        </div>
      </section>
    </main>
  );
}
