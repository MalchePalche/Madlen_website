import type { ReactNode } from "react";

/** Centered narrow column shared by the login / register / reset pages. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="gutter mx-auto flex min-h-[68vh] max-w-md flex-col justify-center py-16 lg:py-24">
      {children}
    </div>
  );
}
