import dynamic from "next/dynamic";

const HomeRoutePage = dynamic(() => import("../../components/HomeRoutePage"), { ssr: false });

export default function Page() {
  return <HomeRoutePage />;
}

