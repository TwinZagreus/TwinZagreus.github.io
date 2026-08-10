import AboutTimeline from "../../components/AboutTimeline";
import SpaceCanvas from "../../components/SpaceCanvas";

export default function AboutPage() {
  return (
    <main className="subpage-shell">
      <SpaceCanvas mode="loading" />
      <div className="site-vignette" />
      <nav className="subpage-nav"><a href="/" className="brand-tag"><span className="brand-dot" /> AN / 01</a><a href="/">Back to orbit ↗</a></nav>
      <AboutTimeline standalone />
    </main>
  );
}
