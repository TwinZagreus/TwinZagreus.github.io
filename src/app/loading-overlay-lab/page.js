import dynamic from "next/dynamic";

const LoadingOverlayLabRoute = dynamic(() => import("../../routes/LoadingOverlayLabRoute"), { ssr: false });

export default function Page() {
  return <LoadingOverlayLabRoute />;
}

