import auditData from "@/lib/data/auditData.json";
import { UI, DEFAULT_LOCALE, type Locale } from "@/lib/config";

type Report = {
  name: string;
  auditor: string;
  auditorlink?: string;
  date: string;
  findings?: Record<string, number | string>;
  link?: string;
  status?: string;
  description?: string;
};
type ZerodevSet = { name: string; description?: string; reports: Report[] };

const { BLOKCaudits, zerodevAudits } = auditData as {
  BLOKCaudits: Report[];
  zerodevAudits: ZerodevSet[];
};

/**
 * Per-severity finding counts are deliberately NOT rendered.
 *
 * Publishing "2 high, 12 major…" against a live protocol advertises an attack
 * surface and invites probing for anything that looks unpatched, while telling
 * a reader nothing they can act on. The trust signal that matters — who audited
 * it, when, that it passed, and the full report to read for themselves — is all
 * here, and the linked PDF carries the detail for anyone who wants it.
 */
function AuditCard({
  report,
  t,
}: {
  report: Report;
  t: (typeof UI)[Locale];
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-ink/10 bg-paper-warm p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="display text-[18px] text-ink">{report.name}</h3>
        {report.status && (
          <span className="shrink-0 rounded-full bg-moss/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-moss-deep">
            {report.status}
          </span>
        )}
      </div>

      <dl className="mt-2 space-y-0.5 text-[13.5px]">
        <div className="flex gap-1.5">
          <dt className="font-medium text-ink">{t.audits.auditor}:</dt>
          <dd className="text-ink-muted">
            {report.auditorlink ? (
              <a
                href={report.auditorlink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-moss-deep underline decoration-clay/50 underline-offset-2 hover:decoration-clay"
              >
                {report.auditor}
              </a>
            ) : (
              report.auditor
            )}
          </dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="font-medium text-ink">{t.audits.date}:</dt>
          <dd className="text-ink-muted">{report.date}</dd>
        </div>
      </dl>

      {report.link && (
        <a
          href={report.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-[32px] items-center gap-1 text-[13px] font-medium text-clay-deep transition-colors hover:text-ink"
        >
          {t.audits.viewReport}
          <span aria-hidden>→</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
    </div>
  );
}

/** Security-audit report cards (replaces the Docusaurus <Audit/>). */
export function AuditReports({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = UI[locale];
  return (
    <div className="not-prose my-8">
      <p className="eyebrow text-moss">{t.audits.heading}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {BLOKCaudits.map((r, i) => (
          <AuditCard key={`blok-${i}`} report={r} t={t} />
        ))}
      </div>

      {zerodevAudits.map((set, i) => (
        <div key={`set-${i}`} className="mt-10">
          <p className="eyebrow text-moss">{set.name}</p>
          {set.description && (
            <p className="mt-2 max-w-2xl text-[14px] text-ink-muted">{set.description}</p>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {set.reports.map((r, j) => (
              <AuditCard key={`zd-${i}-${j}`} report={r} t={t} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
