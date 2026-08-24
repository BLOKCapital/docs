/**
 * Dependency audit gate for CI.
 *
 * `npm audit --audit-level=high` is all-or-nothing: it fails on every open
 * advisory, so the only way to keep CI green while a fix waits on a
 * semver-major upgrade was `continue-on-error: true` — which also silently
 * swallowed anything *new*. The step existed but could never fail, which is
 * the worst of both worlds.
 *
 * This gate splits the two cases. Advisories listed in ACCEPTED below are
 * acknowledged with a reason and the upgrade that clears them; anything else
 * at high or critical severity fails the build. It also reports allowlist
 * entries that are no longer reported, so the list prunes itself rather than
 * quietly growing stale.
 *
 * Run: npm run audit:gate
 */
import { execFileSync } from "node:child_process";

/**
 * Known-open advisories, each with why it is tolerated and what clears it.
 * Removing an entry is the goal; adding one should be a deliberate decision
 * recorded in review, not a reflex to get CI green.
 */
const ACCEPTED: Record<string, string> = {
  next: "inherited via bundled postcss/sharp; cleared by next@16 (semver-major)",
  "next-mdx-remote":
    "GHSA-g4xw-jxrg-5f6m applies to untrusted MDX; content here is repo-authored and PR-reviewed. Cleared by next-mdx-remote@6 (semver-major)",
  postcss: "build-time only, not shipped to the browser; cleared by next@16",
  sharp: "build-time image pipeline only; cleared by next@16",
};

const BLOCKING = new Set(["high", "critical"]);

type Advisory = { severity?: string };
type Report = { vulnerabilities?: Record<string, Advisory> };

function runAudit(): Report {
  try {
    return JSON.parse(
      execFileSync("npm", ["audit", "--json"], {
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
      }),
    ) as Report;
  } catch (error) {
    // `npm audit` exits non-zero whenever it finds anything at all, but still
    // writes the full report to stdout — so a non-zero exit is expected here
    // and only a genuinely empty stdout is a real failure.
    const stdout = (error as { stdout?: string }).stdout;
    if (!stdout) throw error;
    return JSON.parse(stdout) as Report;
  }
}

const report = runAudit();
const blocking = Object.entries(report.vulnerabilities ?? {}).filter(([, v]) =>
  BLOCKING.has(v.severity ?? ""),
);

for (const [name, v] of blocking) {
  const reason = ACCEPTED[name];
  const tag = reason ? "known" : "NEW  ";
  console.log(
    `  ${tag}  ${(v.severity ?? "?").padEnd(8)} ${name}${reason ? `\n           ${reason}` : ""}`,
  );
}

const resolved = Object.keys(ACCEPTED).filter(
  (name) => !blocking.some(([reported]) => reported === name),
);
if (resolved.length) {
  console.log(
    `\nNo longer reported — remove from ACCEPTED in scripts/audit-gate.ts: ${resolved.join(", ")}`,
  );
}

const unexpected = blocking.filter(([name]) => !(name in ACCEPTED));
if (unexpected.length) {
  console.error(
    `\n${unexpected.length} new high/critical advisory/advisories: ${unexpected
      .map(([n]) => n)
      .join(", ")}\n` +
      "Upgrade the dependency, or add it to ACCEPTED in scripts/audit-gate.ts\n" +
      "with the reason and the upgrade that clears it.",
  );
  process.exit(1);
}

console.log(
  `\nOK — ${blocking.length} known high/critical advisory/advisories, 0 new.`,
);
