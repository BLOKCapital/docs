import auditData from "@/lib/data/auditData.json";

type Findings = Record<string, number | string>;
type Report = {
  name: string;
  auditor: string;
  auditorlink?: string;
  date: string;
  findings?: Findings;
  link?: string;
  status?: string;
  description?: string;
};
type ZerodevSet = { name: string; description?: string; reports: Report[] };

const FINDING_ORDER = [
  "critical", "high", "major", "medium", "minor",
  "low", "informational", "tips",
];

const { BLOKCaudits, zerodevAudits } = auditData as {
  BLOKCaudits: Report[];
  zerodevAudits: ZerodevSet[];
};

function AuditCard({ report, showStatus }: { report: Report; showStatus?: boolean }) {
  return (
    <div className="flex flex-col rounded-2xl border border-ink/10 bg-paper-warm p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="display text-[18px] text-ink">{report.name}</h3>
        {showStatus && report.status && (
          <span className="shrink-0 rounded-full bg-moss/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-moss-deep">
            {report.status}
          </span>
        )}
      </div>
      <p className="mt-2 text-[13.5px] text-ink-muted">
        <span className="font-medium text-ink">Auditor:</span>{" "}
        {report.auditorlink ? (
          <a href={report.auditorlink} target="_blank" rel="noopener noreferrer" className="text-moss-deep underline decoration-clay/50 underline-offset-2">
            {report.auditor}
          </a>
        ) : (
          report.auditor
        )}
      </p>
      <p className="text-[13.5px] text-ink-subtle">
        <span className="font-medium text-ink">Date:</span> {report.date}
      </p>
      {report.findings && (
        <ul className="mt-3 space-y-1 border-t border-ink/8 pt-3">
          {FINDING_ORDER.filter((k) => report.findings![k] !== undefined).map((k) => (
            <li key={k} className="flex items-center justify-between text-[13px]">
              <span className="capitalize text-ink-muted">{k}</span>
              <span className="mono text-ink">
                {report.findings![k] === "-" || report.findings![k] === 0
                  ? "—"
                  : `${report.findings![k]} fixed`}
              </span>
            </li>
          ))}
        </ul>
      )}
      {report.link && (
        <a
          href={report.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-clay-deep hover:text-clay"
        >
          View audit report →
        </a>
      )}
    </div>
  );
}

/** Renders the security-audit report cards (replaces the Docusaurus <Audit/>). */
export function AuditReports() {
  return (
    <div className="not-prose my-8">
      <p className="eyebrow text-moss">BLOK Capital audits</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {BLOKCaudits.map((r, i) => (
          <AuditCard key={`blok-${i}`} report={r} showStatus />
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
              <AuditCard key={`zd-${i}-${j}`} report={r} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
