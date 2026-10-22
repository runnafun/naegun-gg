import type { ReactNode } from "react";
import "./scrim-console.css";
export default function ScrimAdminLayout({ children }: { children: ReactNode }) {
  return <div className="ng-scrim-module">{children}</div>;
}
