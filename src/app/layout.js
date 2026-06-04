import "../styles.css";
import ClientProviders from "../components/ClientProviders";

export const metadata = {
  title: "Motorsport Background Demo",
  description: "Next.js playground for motorsport-inspired shaders, Three.js motion, and visual experiments.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <div
          aria-hidden="true"
          id="initial-loading-shell"
          suppressHydrationWarning
          style={{
            backgroundColor: "#FFEBF5",
            inset: 0,
            position: "fixed",
            zIndex: 2147483646,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              try {
                const shell = document.getElementById("initial-loading-shell");
                if (!shell) return;
                const surfaces = {
                  0: "#FFF9EB",
                  1: "#EBFFEF",
                  2: "#EBF5FF",
                  3: "#FFEBEB",
                  4: "#FFEBF5"
                };
                const themeIndex = window.localStorage.getItem("project-theme-index");
                shell.style.backgroundColor = surfaces[themeIndex] || surfaces[4];
              } catch {
              }
            })();`,
          }}
        />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
