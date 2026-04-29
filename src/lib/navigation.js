"use client";

import NextLink from "next/link";
import { usePathname, useRouter, useParams as useNextParams } from "next/navigation";
import { forwardRef, useEffect } from "react";

export const Link = forwardRef(function Link({ to, href, replace, ...props }, ref) {
  return <NextLink href={href ?? to} ref={ref} replace={replace} {...props} />;
});

export function NavLink({ to, href, className, children, ...props }) {
  const pathname = usePathname();
  const target = href ?? to;
  const isActive = pathname === target;
  const resolvedClassName = typeof className === "function" ? className({ isActive }) : className;

  return (
    <Link className={resolvedClassName} href={target} {...props}>
      {typeof children === "function" ? children({ isActive }) : children}
    </Link>
  );
}

export function Navigate({ to, replace = false }) {
  const router = useRouter();

  useEffect(() => {
    if (replace) {
      router.replace(to);
      return;
    }

    router.push(to);
  }, [replace, router, to]);

  return null;
}

export function useNavigate() {
  const router = useRouter();

  return (to, options = {}) => {
    if (options.replace) {
      router.replace(to);
      return;
    }

    router.push(to);
  };
}

export function useLocation() {
  const pathname = usePathname();
  return { pathname };
}

export function useParams() {
  return useNextParams();
}

