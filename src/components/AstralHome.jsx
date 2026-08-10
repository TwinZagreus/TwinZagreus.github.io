"use client";

import { useEffect, useState } from "react";
import SpaceCanvas from "./SpaceCanvas";
import BlogIndex from "./BlogIndex";
import AboutTimeline from "./AboutTimeline";

const Arrow = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
);

function LoadingGate({ ready, entering, onEnter }) {
  return (
    <section className={`loading-gate ${entering ? "is-entering" : ""}`} aria-label="Astral Notes loading screen">
      <SpaceCanvas mode="loading" />
      <div className="loading-content">
        <button className={`enter-button ${ready ? "is-ready" : ""}`} onClick={onEnter} disabled={!ready} type="button" aria-label="Enter the orbit">
          Enter
        </button>
      </div>
      <div className="loading-progress"><span className={ready ? "is-complete" : ""} /></div>
    </section>
  );
}

function TopTag() {
  return (
    <nav className="top-tag" aria-label="Section navigation">
      <a className="brand-tag" href="#home"><span className="brand-dot" /> AN / 01</a>
      <div className="tag-links"><a href="#blog">Archive</a><a href="#about">About</a></div>
    </nav>
  );
}

function HomeExperience({ posts }) {
  return (
    <div className="home-shell">
      <div className="site-vignette" />
      <TopTag />
      <main>
        <section className="hero-section" id="home">
          <SpaceCanvas mode="home" className="hero-space-canvas" />
          <div className="hero-grid" />
          <div className="hero-copy">
            <p className="eyebrow reveal-up"><span>01</span> A NOTEBOOK IN MOTION</p>
            <h2 className="hero-title reveal-up">I collect<br /><em>small signals</em><br />from the dark.</h2>
            <p className="hero-description reveal-up">Astral Notes is a personal blog about interfaces, creative code, and the quiet geometry of making things feel alive.</p>
            <a href="#blog" className="hero-link reveal-up">Explore the archive <Arrow /></a>
          </div>
          <div className="hero-orbit-label"><span className="pulse-ring" /> LAT 34.0522 / LONG 118.2437<br /><small>STATION ONLINE</small></div>
          <div className="scroll-cue"><span /> Scroll to descend</div>
        </section>
        <BlogIndex posts={posts} compact />
        <AboutTimeline />
      </main>
      <footer className="site-footer"><span>ASTRAL NOTES © 2026</span><span>BUILT BETWEEN SIGNALS</span><a href="#home">Return to top ↑</a></footer>
    </div>
  );
}

export default function AstralHome({ posts }) {
  const [ready, setReady] = useState(false);
  const [entering, setEntering] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 1550);
    return () => window.clearTimeout(timer);
  }, []);

  const enter = () => {
    if (!ready) return;
    setEntering(true);
    window.setTimeout(() => setEntered(true), 820);
  };

  return (
    <div className={`astral-app ${entered ? "is-entered" : ""} ${entering ? "is-entering" : ""}`}>
      <HomeExperience posts={posts} />
      {!entered && <LoadingGate ready={ready} entering={entering} onEnter={enter} />}
    </div>
  );
}
