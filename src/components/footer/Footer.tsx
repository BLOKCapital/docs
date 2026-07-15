import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { EXTERNAL, UI, type Locale } from "@/lib/config";

const YEAR = new Date().getFullYear();

export function Footer({ locale }: { locale: Locale }) {
  const f = UI[locale].footer;
  return (
    <footer className="paper relative border-t border-ink/10 bg-paper">
      <div className="relative z-10 mx-auto max-w-screen-2xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="script mt-2 text-[20px] leading-none text-clay">
              {f.tagline}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              {f.blurb}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-12 gap-y-6 text-[13.5px]">
            <div>
              <p className="eyebrow text-moss">{f.protocol}</p>
              <ul className="mt-3 space-y-2">
                <li><FooterLink href={EXTERNAL.site}>{f.website}</FooterLink></li>
                <li><FooterLink href={EXTERNAL.whitepaper}>{f.whitepaper}</FooterLink></li>
                <li><FooterLink href={EXTERNAL.github}>GitHub</FooterLink></li>
              </ul>
            </div>
            <div>
              <p className="eyebrow text-moss">{f.community}</p>
              <ul className="mt-3 space-y-2">
                <li><FooterLink href={EXTERNAL.discord}>Discord</FooterLink></li>
                <li><FooterLink href={EXTERNAL.telegram}>Telegram</FooterLink></li>
                <li><FooterLink href={EXTERNAL.x}>X (Twitter)</FooterLink></li>
              </ul>
            </div>
          </div>
        </div>

        <div aria-hidden className="rule-hand mt-10" />
        <p className="mt-5 text-center text-[12.5px] text-ink-subtle">
          © {YEAR} BLOK Capital DAO LLC
        </p>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = /^https?:\/\//.test(href);
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="text-ink-muted transition-colors hover:text-ink"
    >
      {children}
    </Link>
  );
}
