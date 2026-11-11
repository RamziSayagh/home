"use client";

import type { ReactNode } from "react";

export function RoomMenu({ children }: { children: ReactNode }) {
  return (
    <details
      className="site-menu"
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest(".menu-panel a")) {
          event.currentTarget.open = false;
        }
      }}
    >
      {children}
    </details>
  );
}
