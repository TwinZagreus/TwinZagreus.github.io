import "../styles.css";
import ClientProviders from "../components/ClientProviders";

export const metadata = {
  title: "Motorsport Background Demo",
  description: "Next.js rebuild of the motorsport shader and blog playground.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}

