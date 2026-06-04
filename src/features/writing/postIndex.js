export const WRITING_POSTS = Object.freeze([
  {
    category: "Personal Log",
    date: "2026-06-04",
    excerpt: "一个中文博客文章示例，用来测试标题、段落、列表、标签和文章详情页的阅读效果。",
    slug: "chinese-blog-writing-sample",
    tags: ["中文", "markdown", "写作"],
    title: "用 Markdown 写一篇个人技术札记",
  },
  {
    category: "Motion Studies",
    date: "2026-06-04",
    excerpt: "Notes on turning a loading screen into a cinematic surface without losing interface calm.",
    slug: "slice-transitions-after-loading",
    tags: ["motion", "loading", "gsap"],
    title: "Slice transitions after loading",
  },
  {
    category: "Motion Studies",
    date: "2026-06-03",
    excerpt: "用一篇占位文章观察博客目录超过屏幕后，分类区块、文章标题和固定目录的滚动节奏。",
    slug: "interface-motion-scroll-test",
    tags: ["motion", "scroll", "test"],
    title: "滚动中的界面动效测试",
  },
  {
    category: "Motion Studies",
    date: "2026-06-03",
    excerpt: "How to make route changes feel designed without turning every click into a show.",
    slug: "route-transitions-without-losing-calm",
    tags: ["routing", "motion", "interface"],
    title: "Route transitions without losing calm",
  },
  {
    category: "Shader Notes",
    date: "2026-06-02",
    excerpt: "测试动态等高线背景与长列表内容共存时，文字层级是否仍然清楚。",
    slug: "contour-background-reading-density",
    tags: ["shader", "typography", "density"],
    title: "等高线背景下的阅读密度",
  },
  {
    category: "Shader Notes",
    date: "2026-06-02",
    excerpt: "A field note on using contour lines as a persistent layer instead of a static background image.",
    slug: "perlin-contours-interface-atmosphere",
    tags: ["shader", "perlin", "atmosphere"],
    title: "Perlin contours as interface atmosphere",
  },
  {
    category: "Motion Studies",
    date: "2026-06-01",
    excerpt: "路由动画不只是过场，它可以让文章详情像从当前空间里被切出来。",
    slug: "route-animation-as-spatial-cut",
    tags: ["route", "transition", "animation"],
    title: "把路由切换做成空间切口",
  },
  {
    category: "Design Systems",
    date: "2026-05-31",
    excerpt: "用主题色控制博客目录、文章详情和交互反馈，测试切换主题后的整体一致性。",
    slug: "theme-color-archive-notes",
    tags: ["theme", "color", "archive"],
    title: "主题色和归档气质",
  },
  {
    category: "Three.js Lab",
    date: "2026-05-30",
    excerpt: "记录鼠标轨迹、图片混合和 ping-pong buffer 在首页视觉里的角色。",
    slug: "webgl-reveal-layer-notes",
    tags: ["webgl", "reveal", "buffer"],
    title: "鼠标轨迹揭示层笔记",
  },
  {
    category: "Motion Studies",
    date: "2026-05-29",
    excerpt: "记录 TwinZ loading 从文字动画到切片下落的设计变化。",
    slug: "loading-overlay-design-diary",
    tags: ["loading", "logo", "timeline"],
    title: "Loading Overlay 设计日记",
  },
  {
    category: "Three.js Lab",
    date: "2026-05-28",
    excerpt: "Using a ping-pong buffer to make the cursor reveal a second image as a temporary memory layer.",
    slug: "mouse-trails-image-memory",
    tags: ["webgl", "reveal", "interaction"],
    title: "Mouse trails as image memory",
  },
  {
    category: "Personal Log",
    date: "2026-05-27",
    excerpt: "首页不是 landing page，而是一张能通向文章、实验和个人气质的地图。",
    slug: "personal-homepage-as-map",
    tags: ["homepage", "map", "identity"],
    title: "把个人首页当成一张地图",
  },
  {
    category: "Design Systems",
    date: "2026-05-26",
    excerpt: "当分类和文章都很多时，目录需要在完整展示和轻松扫读之间找到平衡。",
    slug: "article-directory-interaction",
    tags: ["directory", "interaction", "layout"],
    title: "文章目录的交互密度",
  },
  {
    category: "Design Systems",
    date: "2026-05-25",
    excerpt: "A small design-system note about letting one base color generate a complete visual mood.",
    slug: "theme-color-personal-identity",
    tags: ["theme", "color", "system"],
    title: "Theme color as personal identity",
  },
  {
    category: "Shader Notes",
    date: "2026-05-24",
    excerpt: "给 shader 类文章准备一种短笔记格式，适合记录参数、视觉变化和实现判断。",
    slug: "shader-field-note-format",
    tags: ["shader", "notes", "format"],
    title: "Shader Field Note 的写作格式",
  },
  {
    category: "Personal Log",
    date: "2026-05-23",
    excerpt: "记录右下角播放按钮、音量圆环和 setting 旋转之间的界面关系。",
    slug: "quiet-interface-audio-control",
    tags: ["audio", "control", "interface"],
    title: "安静界面里的音频控制",
  },
  {
    category: "Three.js Lab",
    date: "2026-05-20",
    excerpt: "A compact note on image scan effects, depth maps, and stable shader routes.",
    slug: "webgl-scan-effects-depth-maps",
    tags: ["webgl", "shader", "scan"],
    title: "WebGL scan effects with depth maps",
  },
  {
    category: "Personal Log",
    date: "2026-05-18",
    excerpt: "A note about organizing experiments as an archive rather than a linear blog.",
    slug: "building-visual-archive-experiments",
    tags: ["archive", "notes", "process"],
    title: "Building a visual archive for experiments",
  },
]);

export function getWritingCategories() {
  return WRITING_POSTS.reduce((groups, post) => {
    const existing = groups.find((group) => group.category === post.category);
    if (existing) {
      existing.posts.push(post);
      return groups;
    }

    groups.push({ category: post.category, posts: [post] });
    return groups;
  }, []);
}

export function getRecentWritingPosts(limit = 3) {
  return WRITING_POSTS.slice(0, limit);
}
