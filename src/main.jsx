import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

function LegacyViteNotice() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f3ec] px-6 text-[#2d241f]">
      <div className="max-w-xl rounded-3xl border border-[#dfd6ca] bg-white p-8 shadow-[0_24px_60px_rgba(62,41,27,0.08)]">
        <div className="text-[11px] uppercase tracking-[0.28em] text-[#8f8478]">
          Runtime Mismatch
        </div>
        <h1 className="mt-4 font-['Trebuchet_MS','Segoe_UI',sans-serif] text-3xl uppercase tracking-[0.06em] text-[#3b3029]">
          This app now runs on Next.js
        </h1>
        <p className="mt-4 text-sm leading-7 text-[#6e6258]">
          The old Vite entry is kept only to avoid `next/link` and `next/navigation`
          crashing in a non-Next runtime.
        </p>
        <div className="mt-6 rounded-2xl bg-[#f7f2eb] p-4 text-sm leading-7 text-[#5f544c]">
          Start or open the app with:
          <br />
          <code className="mt-2 inline-block rounded bg-white px-3 py-1 text-[#3b3029]">
            npm run dev
          </code>
          <br />
          then visit
          {" "}
          <code className="rounded bg-white px-2 py-1 text-[#3b3029]">
            http://localhost:3000
          </code>
        </div>
      </div>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LegacyViteNotice />
  </React.StrictMode>,
);
