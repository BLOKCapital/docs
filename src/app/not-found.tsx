import Link from "next/link";
import { DEFAULT_LOCALE } from "@/lib/config";

export default function NotFound() {
  return (
    <div className="paper relative isolate flex min-h-[70vh] items-center justify-center px-6 text-center">
      <div>
        <p className="eyebrow text-moss">404</p>
        <h1 className="display mt-3 text-[40px] text-ink">Page not found</h1>
        <p className="mt-3 text-ink-muted">
          This page may have moved or doesn&apos;t exist in this language.
        </p>
        <Link
          href={`/${DEFAULT_LOCALE}`}
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-moss px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-moss-deep"
        >
          ← Back to docs home
        </Link>
      </div>
    </div>
  );
}
