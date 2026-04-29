import dynamic from "next/dynamic";

const ScanEffectRoute = dynamic(() => import("../../routes/ScanEffectRoute"), { ssr: false });

export default function Page() {
  return <ScanEffectRoute />;
}

