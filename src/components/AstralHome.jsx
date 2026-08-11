"use client";

import { useEffect, useState } from "react";
import BlogIndex from "./BlogIndex";
import AboutTimeline from "./AboutTimeline";
import SpaceCanvas from "./SpaceCanvas";
import { useGalaxyDustSettings } from "./GalaxyDustSettings";

const Arrow = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
);

const socialLinks = [
  { label: "Steam", href: "https://steamcommunity.com/id/543150640/", icon: "https://cdn.simpleicons.org/steam/F3F5FF" },
  { label: "GitHub", href: "https://github.com/TwinZagreus", icon: "https://cdn.simpleicons.org/github/F3F5FF" },
  { label: "Bilibili", href: "https://space.bilibili.com/69861123?spm_id_from=333.337.0.0", icon: "https://cdn.simpleicons.org/bilibili/F3F5FF" },
];

function LoadingGate({ progressComplete, ready, entering, onEnter }) {
  return (
    <section className={`loading-gate ${ready ? "is-ready" : ""} ${entering ? "is-entering" : ""}`} aria-label="Twinz loading screen">
      <div className="loading-indicator" aria-live="polite">
        <div className="loading-progress"><span className={progressComplete ? "is-complete" : ""} /></div>
        <p className="loading-status">Loading...</p>
      </div>
      <div className="loading-content">
        <span className="entry-beacon" aria-hidden="true" />
        <button className={`enter-button ${ready ? "is-ready" : ""}`} onClick={onEnter} disabled={!ready} type="button" aria-label="Enter Twinz's archive">
          Enter
        </button>
      </div>
    </section>
  );
}

function HomeExperience({ posts, age }) {
  const { dustCount } = useGalaxyDustSettings();

  return (
    <div className="home-shell">
      <main className="snap-main">
        <section className="hero-section" id="home">
          <SpaceCanvas mode="home" className="hero-space-canvas" pauseWhenOffscreen dustCountOverride={dustCount} />
          <div className="hero-grid" />
          <div className="hero-copy">
            <p className="eyebrow reveal-up"><span>01</span> PERSONAL SIGNAL / 1998</p>
            <h1 className="hero-title reveal-up">Learn to<br /><em>swim in waves.</em></h1>
            <div className="hero-socials reveal-up" aria-label="Twinz social profiles">
              {socialLinks.map(({ label, href, icon }) => <a href={href} key={label} target="_blank" rel="noreferrer"><img src={icon} alt="" aria-hidden="true" />{label}</a>)}
            </div>
            <a href="#blog" className="hero-link reveal-up">Explore the archive <Arrow /></a>
          </div>
          <dl className="hero-profile" aria-label="Twinz contact details">
            <div><dt>NAME</dt><dd>TWINZ</dd></div>
            <div><dt>EMAIL</dt><dd><a href="mailto:543150640@qq.com">543150640@qq.com</a></dd></div>
            <div><dt>PHONE</dt><dd><a href="tel:15886371859">15886371859</a></dd></div>
            <div><dt>AGE</dt><dd>{age}</dd></div>
          </dl>
          <div className="scroll-cue"><span /> Scroll to descend</div>
        </section>
        <BlogIndex posts={posts} />
        <AboutTimeline />
      </main>
    </div>
  );
}

export default function AstralHome({ posts }) {
  const [progressComplete, setProgressComplete] = useState(false);
  const [ready, setReady] = useState(false);
  const [entering, setEntering] = useState(false);
  const [entered, setEntered] = useState(null);
  const [age, setAge] = useState(2026 - 1998);

  useEffect(() => {
    let ageTimer;
    const updateAge = () => {
      const now = new Date();
      setAge(now.getFullYear() - 1998);
      const nextYear = new Date(now.getFullYear() + 1, 0, 1);
      ageTimer = window.setTimeout(updateAge, nextYear.getTime() - now.getTime() + 50);
    };

    updateAge();
    if (window.sessionStorage.getItem("twinz-entered") === "true") {
      setEntered(true);
      return () => window.clearTimeout(ageTimer);
    }

    setEntered(false);
    const progressTimer = window.setTimeout(() => setProgressComplete(true), 100);
    const readyTimer = window.setTimeout(() => setReady(true), 1500);
    return () => {
      window.clearTimeout(progressTimer);
      window.clearTimeout(readyTimer);
      window.clearTimeout(ageTimer);
    };
  }, []);

  const enter = () => {
    if (!ready) return;
    window.sessionStorage.setItem("twinz-entered", "true");
    setEntering(true);
    window.setTimeout(() => setEntered(true), 820);
  };

  return (
    <div className={`astral-app ${entered ? "is-entered" : ""} ${entering ? "is-entering" : ""}`}>
      <HomeExperience posts={posts} age={age} />
      {entered === false && <LoadingGate progressComplete={progressComplete} ready={ready} entering={entering} onEnter={enter} />}
    </div>
  );
}
