"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HashRedirect({ target }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(target);
  }, [router, target]);

  return <main className="redirect-shell" aria-live="polite">Returning to the orbit...</main>;
}
