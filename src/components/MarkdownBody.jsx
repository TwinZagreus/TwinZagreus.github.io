"use client";

import { useEffect, useId, useRef } from "react";

const MERMAID_SELECTOR = "pre > code.language-mermaid";

function readVariable(styles, name, fallback) {
  return styles.getPropertyValue(name).trim() || fallback;
}

function createDiagram() {
  const figure = document.createElement("figure");
  figure.className = "mermaid-diagram";
  figure.dataset.diagram = "mermaid";

  const caption = document.createElement("figcaption");
  caption.textContent = "Mermaid 逻辑图";

  const stage = document.createElement("div");
  stage.className = "mermaid-diagram-stage";

  figure.append(caption, stage);
  return { figure, stage };
}

function showFallback(figure, stage, source) {
  stage.remove();

  const note = document.createElement("p");
  note.className = "mermaid-error";
  note.textContent = "图表渲染失败，已显示原始代码。";

  const fallback = document.createElement("pre");
  fallback.className = "mermaid-fallback";

  const code = document.createElement("code");
  code.textContent = source;

  fallback.append(code);
  figure.append(note, fallback);
  figure.classList.add("is-error");
}

export default function MarkdownBody({ html }) {
  const rootRef = useRef(null);
  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, "") || "diagram";

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const blocks = Array.from(root.querySelectorAll(MERMAID_SELECTOR));
    if (!blocks.length) return undefined;

    let cancelled = false;

    const renderDiagrams = async () => {
      let mermaid;

      try {
        mermaid = (await import("mermaid")).default;
      } catch (error) {
        console.error("[markdown] Failed to load Mermaid.", error);
        return;
      }

      if (cancelled) return;

      const styles = getComputedStyle(document.documentElement);
      const ink = readVariable(styles, "--ink", "#f3f5ff");
      const muted = readVariable(styles, "--muted", "#8991ad");
      const bg = readVariable(styles, "--bg", "#040612");
      const cyan = readVariable(styles, "--cyan", "#5ad7ed");
      const purple = readVariable(styles, "--purple", "#ac93ff");
      const line = readVariable(styles, "--line", "rgba(179, 193, 255, 0.17)");
      const sans = readVariable(styles, "--sans", "Manrope, system-ui, sans-serif");
      const fontFamily = `${sans.replace(/,\s*sans-serif\s*$/i, "")}, "PingFang SC", "Microsoft YaHei", sans-serif`;

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        suppressErrorRendering: true,
        theme: "base",
        fontFamily,
        themeVariables: {
          darkMode: true,
          background: bg,
          fontFamily,
          fontSize: "15px",
          primaryColor: "#0e132a",
          primaryTextColor: ink,
          primaryBorderColor: cyan,
          secondaryColor: "#151b3d",
          tertiaryColor: bg,
          textColor: ink,
          lineColor: muted,
          defaultLinkColor: cyan,
          edgeLabelBackground: bg,
          clusterBkg: "rgba(14, 19, 42, 0.55)",
          clusterBorder: line,
          nodeBorder: cyan,
          mainBkg: "#0e132a",
          noteBkgColor: "#151b3d",
          noteTextColor: ink,
          noteBorderColor: purple,
          titleColor: ink,
        },
        flowchart: {
          curve: "basis",
          htmlLabels: true,
          useMaxWidth: true,
          padding: 18,
          nodeSpacing: 45,
          rankSpacing: 55,
          wrappingWidth: 240,
        },
      });

      if (document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch {
          // Font loading is best-effort; render with the fallback stack.
        }
      }

      if (cancelled) return;

      for (let index = 0; index < blocks.length; index += 1) {
        if (cancelled) return;

        const code = blocks[index];
        const pre = code.parentElement;
        if (!pre || pre.tagName !== "PRE" || !pre.parentElement) continue;

        const source = code.textContent ?? "";
        if (!source.trim()) continue;

        const { figure, stage } = createDiagram();
        pre.replaceWith(figure);

        try {
          const { svg } = await mermaid.render(`mermaid-${safeId}-${index}`, source);
          if (cancelled) return;

          stage.innerHTML = svg;
          figure.classList.add("is-ready");
          if (stage.scrollWidth > stage.clientWidth + 1) figure.classList.add("is-scrollable");
        } catch (error) {
          if (cancelled) return;

          console.error("[markdown] Failed to render Mermaid diagram.", error);
          showFallback(figure, stage, source);
        }
      }
    };

    renderDiagrams();

    return () => {
      cancelled = true;
    };
  }, [html, safeId]);

  return <div className="markdown-body" ref={rootRef} dangerouslySetInnerHTML={{ __html: html }} />;
}
