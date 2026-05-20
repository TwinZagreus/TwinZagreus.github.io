import dynamic from "next/dynamic";

const PerlinContoursPage = dynamic(() => import("@/features/visual-labs/pages/PerlinContoursPage"), { ssr: false });

export default function Page() {
  return <PerlinContoursPage />;
}
