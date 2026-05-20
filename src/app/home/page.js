import dynamic from "next/dynamic";

const HomePage = dynamic(() => import("@/features/visual-labs/pages/HomePage"), { ssr: false });

export default function Page() {
  return <HomePage />;
}
