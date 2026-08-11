"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "gsap";
import SpaceCanvas from "./SpaceCanvas";
import { GalaxyDustProvider, useGalaxyDustSettings } from "./GalaxyDustSettings";

const sectionLinks = [
  { id: "home", label: "主页" },
  { id: "blog", label: "博客" },
  { id: "about", label: "关于" },
];

function markSessionEntered() {
  window.sessionStorage.setItem("twinz-entered", "true");
}

export function ArticleTransitionLink({ href, className = "", children, onClick, ...props }) {

  const handleClick = (event) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    markSessionEntered();
    window.dispatchEvent(new CustomEvent("twinz:navigate", { detail: { href } }));
  };

  return <a href={href} className={className} onClick={handleClick} {...props}>{children}</a>;
}

export function HomeLink({ href = "/#home", className = "", children, onClick, ...props }) {
  const handleClick = (event) => {
    markSessionEntered();
    onClick?.(event);
  };

  return <a href={href} className={className} onClick={handleClick} {...props}>{children}</a>;
}

function SiteHeader() {
  const pathname = usePathname();
  const activeRef = useRef("home");
  const headerRef = useRef(null);
  const isArticlePage = pathname.startsWith("/blog/");

  useEffect(() => {
    if (pathname !== "/") return undefined;

    const links = headerRef.current?.querySelectorAll("[data-section-link]") || [];
    const setActive = (id) => {
      if (activeRef.current === id) return;
      activeRef.current = id;
      links.forEach((link) => link.toggleAttribute("data-active", link.dataset.sectionLink === id));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (current) setActive(current.target.id);
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: [0, 0.1, 0.5] },
    );

    sectionLinks.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [pathname]);

  const scrollToSection = (event, id) => {
    if (pathname !== "/") return;
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
  };

  return (
    <header className="site-header" ref={headerRef}>
      <HomeLink href={isArticlePage ? "/#blog" : "/#home"} className="brand-tag" aria-label={isArticlePage ? "Return to blog index" : "Return to home"}>
        <span className="brand-dot" /> TWINZ / 1998
      </HomeLink>
      <nav className="header-links" aria-label="主要导航">
        {sectionLinks.map(({ id, label }) => (
          <a
            href={pathname === "/" ? `#${id}` : `/#${id}`}
            key={id}
            data-section-link={id}
            data-active={id === "home" ? "" : undefined}
            onClick={(event) => scrollToSection(event, id)}
          >
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}

function RouteTransitionLayer() {
  const router = useRouter();
  const pathname = usePathname();
  const layerRef = useRef(null);
  const planeRef = useRef(null);
  const progressRef = useRef(null);
  const pendingHref = useRef(null);
  const timelineRef = useRef(null);

  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const navigate = (event) => {
      const href = event.detail?.href;
      if (!href || pendingHref.current) return;
      if (reducedMotion()) {
        router.push(href);
        return;
      }

      pendingHref.current = href;
      timelineRef.current?.kill();
      timelineRef.current = gsap.timeline({ defaults: { ease: "power4.inOut" } });
      timelineRef.current
        .set(layerRef.current, { autoAlpha: 1, pointerEvents: "auto" })
        .set(planeRef.current, { scaleY: 0, transformOrigin: "50% 100%" })
        .set(progressRef.current, { scaleX: 0, transformOrigin: "0% 50%" })
        .to(planeRef.current, { scaleY: 1, duration: 0.38, ease: "power4.in" })
        .to(progressRef.current, { scaleX: 1, duration: 0.28, ease: "power2.out" }, "<0.08")
        .add(() => router.push(href));
    };

    window.addEventListener("twinz:navigate", navigate);
    return () => {
      window.removeEventListener("twinz:navigate", navigate);
      timelineRef.current?.kill();
    };
  }, [router]);

  useEffect(() => {
    if (!pendingHref.current || reducedMotion()) return;

    const reveal = window.requestAnimationFrame(() => {
      timelineRef.current?.kill();
      timelineRef.current = gsap.timeline({ defaults: { ease: "power3.out" } });
      timelineRef.current
        .set(planeRef.current, { transformOrigin: "50% 0%" })
        .to(progressRef.current, { scaleX: 0, duration: 0.22, ease: "power2.in" })
        .to(planeRef.current, { scaleY: 0, duration: 0.44 }, "<0.04")
        .set(layerRef.current, { autoAlpha: 0, pointerEvents: "none" })
        .add(() => { pendingHref.current = null; });
    });

    return () => window.cancelAnimationFrame(reveal);
  }, [pathname]);

  return (
    <div className="route-scanner" ref={layerRef} aria-hidden="true">
      <div className="route-scanner-plane" ref={planeRef} />
      <div className="route-scanner-progress" ref={progressRef} />
    </div>
  );
}

function ExperienceChromeContent({ children }) {
  const pathname = usePathname();
  const { dustCount } = useGalaxyDustSettings();

  return (
    <>
      {pathname !== "/" && <SpaceCanvas mode="home" className="persistent-space-canvas" dustCountOverride={dustCount} />}
      <div className="site-vignette" />
      <SiteHeader />
      {children}
      <RouteTransitionLayer />
    </>
  );
}

export default function ExperienceChrome({ children }) {
  return <GalaxyDustProvider><ExperienceChromeContent>{children}</ExperienceChromeContent></GalaxyDustProvider>;
}
