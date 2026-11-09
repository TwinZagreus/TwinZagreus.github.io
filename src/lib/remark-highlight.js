const HIGHLIGHT_PATTERN = /==((?:[^=\r\n]|=(?!=))+?)==/g;
const SKIP_TYPES = new Set(["code", "inlineCode", "math", "inlineMath", "html", "yaml"]);

function textNode(value) {
  return { type: "text", value };
}

function highlightNode(value) {
  return {
    type: "highlight",
    data: {
      hName: "mark",
      hProperties: { className: "md-highlight" },
    },
    children: [textNode(value)],
  };
}

function splitText(value) {
  const parts = [];
  let lastIndex = 0;

  for (const match of value.matchAll(HIGHLIGHT_PATTERN)) {
    if (match.index > lastIndex) parts.push(textNode(value.slice(lastIndex, match.index)));
    parts.push(highlightNode(match[1]));
    lastIndex = match.index + match[0].length;
  }

  if (!parts.length) return null;
  if (lastIndex < value.length) parts.push(textNode(value.slice(lastIndex)));
  return parts;
}

function transformChildren(node) {
  if (!node.children) return;

  const next = [];

  for (const child of node.children) {
    if (child.type === "text") {
      const parts = splitText(child.value);

      if (parts) next.push(...parts);
      else next.push(child);
      continue;
    }

    if (!SKIP_TYPES.has(child.type)) transformChildren(child);
    next.push(child);
  }

  node.children = next;
}

export default function remarkHighlight() {
  return (tree) => {
    transformChildren(tree);
  };
}
