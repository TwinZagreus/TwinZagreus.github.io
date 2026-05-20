import dynamic from "next/dynamic";

const ScanEffectPage = dynamic(() => import("@/features/visual-labs/pages/ScanEffectPage"), { ssr: false });

export default function Page() {
  return <ScanEffectPage />;
}
