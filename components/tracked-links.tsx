"use client";

import { track } from "@/lib/tracking";
import type { ReactNode } from "react";

export function TrackedPhoneLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={href} onClick={() => track("call_click")} className={className}>
      {children}
    </a>
  );
}

export function TrackedDirectionsLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={() => track("directions_click")}
      className={className}
    >
      {children}
    </a>
  );
}
