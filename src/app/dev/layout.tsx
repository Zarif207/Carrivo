import { notFound } from "next/navigation";

// TEMPORARY (Phase 1): component gallery for visual checks. Delete src/app/dev before submission.
export default function DevLayout({ children }: LayoutProps<"/dev">) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
