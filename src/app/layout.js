import "../styles.css";
import "katex/dist/katex.min.css";
import ExperienceChrome from "../components/ExperienceChrome";

export const metadata = {
  title: "TWINZ - Learn to swim in waves",
  description: "A personal archive of interfaces, moving images, and the currents between attention and play.",
  icons: {
    icon: "/img/final-single-circle.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ExperienceChrome>{children}</ExperienceChrome>
      </body>
    </html>
  );
}
