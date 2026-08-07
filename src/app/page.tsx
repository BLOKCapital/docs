import { redirect } from "next/navigation";
import { DEFAULT_LOCALE, SECTIONS } from "@/lib/config";
import { getSectionEntry } from "@/lib/content";

/**
 * Site root. Goes straight to the default locale's first doc rather than to
 * `/<locale>` — which only redirects again — so an inbound link to the bare
 * domain costs one hop instead of two.
 */
export default function RootPage() {
  redirect(getSectionEntry(DEFAULT_LOCALE, SECTIONS[0].slug));
}
