import "../styles.css";
import "katex/dist/katex.min.css";

export const metadata = {
  title: "Astral Notes — a visual notebook in motion",
  description: "A personal blog about interfaces, creative code, and the quiet geometry of making things feel alive.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
