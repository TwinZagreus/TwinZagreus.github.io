import dynamic from "next/dynamic";

const LoadingOverlayLabPage = dynamic(() => import("@/features/visual-labs/pages/LoadingOverlayLabPage"), { ssr: false });

export default function Page() {
  return <LoadingOverlayLabPage />;
}
