import dynamic from "next/dynamic";

const PerlinContoursRoute = dynamic(() => import("../../routes/PerlinContoursRoute"), { ssr: false });

export default function Page() {
  return <PerlinContoursRoute />;
}

