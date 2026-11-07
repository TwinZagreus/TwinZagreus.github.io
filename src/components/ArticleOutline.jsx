"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function buildTree(headings) {
  const roots = [];
  const stack = [];

  for (const heading of headings) {
    const node = {
      ...heading,
      children: [],
      parentId: null,
    };

    while (stack.length && stack[stack.length - 1].depth >= heading.depth) {
      stack.pop();
    }

    node.parentId = stack.length ? stack[stack.length - 1].id : null;

    if (stack.length) stack[stack.length - 1].children.push(node);
    else roots.push(node);

    stack.push(node);
  }

  return roots;
}

function HeadingTree({ nodes, activeId, collapsedIds, onSelect, onToggle }) {
  return (
    <ol className="article-outline-tree">
      {nodes.map((node) => {
        const hasChildren = node.children.length > 0;
        const isCollapsed = collapsedIds.has(node.id);
        const isActive = node.id === activeId;

        return (
          <li key={node.id}>
            <div className={isActive ? "article-outline-row is-active" : "article-outline-row"}>
              {hasChildren ? (
                <button
                  type="button"
                  className="article-outline-toggle"
                  aria-expanded={!isCollapsed}
                  aria-label={`${isCollapsed ? "展开" : "折叠"} ${node.text}`}
                  onClick={() => onToggle(node.id)}
                >
                  <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5 6.5 5 3 8.5" /></svg>
                </button>
              ) : (
                <span className="article-outline-spacer" aria-hidden="true" />
              )}
              <a
                href={`#${node.id}`}
                data-heading-id={node.id}
                className={isActive ? "is-active" : undefined}
                aria-current={isActive ? "location" : undefined}
                onClick={(event) => onSelect(event, node.id)}
              >
                {node.text}
              </a>
            </div>
            {hasChildren && !isCollapsed && (
              <div className="article-outline-branch">
                <HeadingTree
                  nodes={node.children}
                  activeId={activeId}
                  collapsedIds={collapsedIds}
                  onSelect={onSelect}
                  onToggle={onToggle}
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default function ArticleOutline({ headings }) {
  const tree = useMemo(() => buildTree(headings), [headings]);
  const nodeById = useMemo(() => {
    const map = new Map();

    const walk = (nodes) => {
      nodes.forEach((node) => {
        map.set(node.id, node);
        walk(node.children);
      });
    };

    walk(tree);
    return map;
  }, [tree]);
  const parentIds = useMemo(
    () => new Set([...nodeById.values()].filter((node) => node.children.length > 0).map((node) => node.id)),
    [nodeById],
  );
  const [activeId, setActiveId] = useState(headings[0]?.id ?? "");
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());
  const scrollRef = useRef(null);
  const collapseAllScrollRef = useRef(0);
  const restoreCollapseScrollRef = useRef(false);

  const jumpToHeading = (event, id) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();

    const target = document.getElementById(id);
    if (!target) return;

    target.scrollIntoView({ behavior: "instant", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
    setActiveId(id);
  };

  const toggleNode = (id) => {
    setCollapsedIds((current) => {
      const next = new Set(current);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });
  };

  const toggleAll = () => {
    const panel = scrollRef.current;
    if (!panel) return;

    if (collapsedIds.size) {
      const restoreScrollTop = restoreCollapseScrollRef.current
        ? collapseAllScrollRef.current
        : panel.scrollTop;

      restoreCollapseScrollRef.current = false;
      setCollapsedIds(new Set());

      window.requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = restoreScrollTop;
      });
      return;
    }

    collapseAllScrollRef.current = panel.scrollTop;
    restoreCollapseScrollRef.current = true;
    setCollapsedIds(new Set(parentIds));
  };

  useEffect(() => {
    if (!headings.length) return undefined;

    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter(Boolean);

    if (!elements.length) return undefined;

    let frame = 0;

    const updateActiveHeading = () => {
      frame = 0;
      const marker = window.innerHeight * 0.22;
      let current = elements[0].id;

      for (const element of elements) {
        if (element.getBoundingClientRect().top <= marker) current = element.id;
        else break;
      }

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = elements[elements.length - 1].id;
      }

      setActiveId((previous) => (previous === current ? previous : current));
    };

    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActiveHeading);
    };

    updateActiveHeading();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [headings]);

  useEffect(() => {
    if (!activeId) return undefined;

    const ancestorIds = [];
    let node = nodeById.get(activeId);

    while (node?.parentId) {
      ancestorIds.push(node.parentId);
      node = nodeById.get(node.parentId);
    }

    if (ancestorIds.length) {
      setCollapsedIds((current) => {
        if (!ancestorIds.some((id) => current.has(id))) return current;

        const next = new Set(current);
        ancestorIds.forEach((id) => next.delete(id));
        return next;
      });
    }

    const frame = window.requestAnimationFrame(() => {
      const panel = scrollRef.current;
      if (!panel) return;

      const item = panel.querySelector(`[data-heading-id="${CSS.escape(activeId)}"]`);
      if (!item) return;

      const itemRect = item.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const margin = 20;

      if (itemRect.top < panelRect.top + margin || itemRect.bottom > panelRect.bottom - margin) {
        const nextScrollTop = panel.scrollTop
          + itemRect.top
          - panelRect.top
          - (panel.clientHeight - itemRect.height) / 2;

        panel.scrollTop = Math.max(0, nextScrollTop);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeId, nodeById]);

  if (!headings.length) return null;

  return (
    <div className="article-outline-root">
      <details className="article-outline-mobile">
        <summary>
          <span>CONTENTS</span>
          <span>{String(headings.length).padStart(2, "0")}</span>
        </summary>
        <div className="article-outline-mobile-scroll">
          <HeadingTree
            nodes={tree}
            activeId={activeId}
            collapsedIds={collapsedIds}
            onSelect={jumpToHeading}
            onToggle={toggleNode}
          />
        </div>
      </details>

      <nav className="article-outline" aria-label="文章目录">
        <div className="article-outline-head">
          <span>ON THIS PAGE</span>
          <div className="article-outline-head-actions">
            <span>{String(headings.length).padStart(2, "0")}</span>
            <button
              type="button"
              className="article-outline-all"
              onClick={toggleAll}
              aria-label={collapsedIds.size ? "展开全部标题" : "折叠全部标题"}
            >
              {collapsedIds.size ? "EXPAND" : "COLLAPSE"}
            </button>
          </div>
        </div>
        <div className="article-outline-scroll" ref={scrollRef}>
          <HeadingTree
            nodes={tree}
            activeId={activeId}
            collapsedIds={collapsedIds}
            onSelect={jumpToHeading}
            onToggle={toggleNode}
          />
        </div>
      </nav>
    </div>
  );
}
