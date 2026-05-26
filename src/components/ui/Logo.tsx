import Image from "next/image";
import { cn } from "@/lib/utils";

/** BLOK Capital wordmark (382×75 native), rendered ~24px tall in nav contexts. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src="/brand/blokc-black.svg"
        alt="BLOK Capital"
        width={382}
        height={75}
        priority
        unoptimized
        className="h-[24px] w-auto select-none"
        draggable={false}
      />
    </span>
  );
}
