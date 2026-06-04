"use client";

import Link from "next/link";
import { useRouteTransition } from "@/components/RouteTransitionProvider";

export default function TransitionLink({
  children,
  className,
  href,
  label,
  onClick,
  style,
  ...props
}) {
  const { startTransition } = useRouteTransition();

  return (
    <Link
      className={className}
      href={href}
      onClick={(event) => {
        onClick?.(event);

        if (
          event.defaultPrevented ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.currentTarget.target === "_blank"
        ) {
          return;
        }

        event.preventDefault();
        startTransition(href, label);
      }}
      style={style}
      {...props}
    >
      {children}
    </Link>
  );
}
