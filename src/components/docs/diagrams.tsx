/**
 * Named diagram components, referenced by `<TagName />` in MDX across all
 * locales so each diagram has a single source of truth (no per-locale image
 * duplication). Flows/graphs use the themed <Mermaid> renderer; the two
 * signature architecture diagrams are hand-authored inline SVG (crisp, tiny,
 * fully on-palette). Replaces the former /img/*.png|jpg raster diagrams.
 */
import { Mermaid } from "./Mermaid";
import { Figure } from "./Figure";

// --- Concepts --------------------------------------------------------------

/** concepts/user-journey: onboarding to managed garden. */
export function UserJourneyDiagram() {
  return (
    <Mermaid
      caption="The investor journey, from sign-in to an actively managed garden."
      chart={`
flowchart TD
  A["1 · Sign in &amp; create Smart Wallet (SWA)"] --> B["2 · Referral code → mint Soulbound Pass"]
  B --> C["3 · Choose collection &amp; create Garden"]
  C --> D["4 · Fund the Garden from your SWA"]
  D --> E{"5 · How to manage?"}
  E -->|Automatic| F["Index Garden<br/>follows an on-chain index"]
  E -->|Manual| G["Self-Managed Garden<br/>you swap, lend, borrow"]
  F --> H["6 · Rebalance &amp; monitor on-chain"]
  G --> H
`}
    />
  );
}

/** concepts/protocol-concepts/account-abstraction: ERC-4337 flow. */
export function AccountAbstractionDiagram() {
  return (
    <Mermaid
      caption="ERC-4337 flow: the investor signs once; bundlers and the EntryPoint route a UserOperation to the Smart Wallet Account, with gas optionally sponsored by a Paymaster."
      chart={`
flowchart LR
  U["Investor<br/>(signs once)"] --> OP["UserOperation"]
  OP --> MP["AA mempool"]
  MP --> BN["Bundler<br/>aggregate + simulate"]
  BN --> EP["EntryPoint"]
  EP --> SWA["Smart Wallet Account<br/>validate + execute"]
  PM["Paymaster<br/>sponsors gas / ERC-20"] -.-> EP
  SWA --> G["Garden &amp; protocol calls"]
`}
    />
  );
}

/** concepts/protocol-concepts/proxy-contracts: proxy/implementation split. */
export function ProxyContractDiagram() {
  return (
    <Mermaid
      caption="The proxy keeps the stable address and all state; it forwards calls via delegatecall to an interchangeable implementation that holds only logic."
      chart={`
flowchart LR
  U["User"] --> P["Proxy contract<br/>stable address + state"]
  P -->|delegatecall| I["Implementation<br/>logic only"]
  I -. executes in proxy context .-> P
`}
    />
  );
}

/** concepts/protocol-concepts/decentralised-oracle-network: Chainlink CRE/DON. */
export function OracleNetworkDiagram() {
  return (
    <Mermaid
      caption="Atomic asynchronous execution: gardens emit events, the Chainlink Runtime Environment feeds, normalizes, computes and reaches consensus, then signed results return on-chain for verified execution."
      chart={`
flowchart TB
  subgraph C1["Contract layer · signal emission"]
    G["Garden contracts<br/>state · assets · events"]
  end
  subgraph CRE["CRE · Chainlink Runtime Environment"]
    F["Feeders<br/>chain + market data"] --> T["Trigger / batch<br/>normalize data"]
    T --> D["DON<br/>compute · validate · consensus"]
  end
  subgraph C2["Contract layer · execution"]
    X["Verify DON signature<br/>→ execute"]
  end
  G -->|emit event| F
  D -->|signed result + proof| X
  X -->|update state| G
`}
    />
  );
}

/** concepts/protocol-concepts/wealth-management: two garden modes. */
export function WealthManagementDiagram() {
  return (
    <Mermaid
      caption="Structured management is optional: assets stay non-custodial in your wallet while you choose automated index rules or full self-management."
      chart={`
flowchart TB
  U["Investor wallet<br/>(non-custodial)"] --> Q{"Garden type"}
  Q -->|Indexed| I["Indexed Garden<br/>auto-rebalance to on-chain index"]
  Q -->|Self-managed| S["Self-Managed Garden<br/>manual swaps · lend · borrow"]
  I --> C["Smart contracts execute<br/>assets never leave your wallet"]
  S --> C
  DAO["BLOK Capital DAO"] -. governs params + upgrades .-> C
`}
    />
  );
}

/** concepts/index-garden: Garden protocol architecture. */
export function IndexGardenDiagram() {
  return (
    <Mermaid
      caption="Every garden is deployed by the Garden Factory and routes index logic through approved facets; weights are computed by the Index Calculation Registry from oracle data."
      chart={`
flowchart TB
  GF["Garden Factory<br/>(only deployer)"] --> G["Garden<br/>Index or Yield"]
  G --> FR["Facet Registry<br/>approved facets only"]
  FR --> IM["Index Module<br/>Index Facets"]
  IM --> IDX["Indices<br/>Block C2 · C5 · C10"]
  ICR["Index Calculation Registry<br/>oracle data → weights"] --> IM
  IDX --> ICR
  G -->|deposit| ALLOC["Allocate by weights<br/>e.g. 80% BTC / 20% ETH"]
`}
    />
  );
}

// --- Smart contracts / builders -------------------------------------------

/** builders/blok-capital-v1: protocol architecture V1. */
export function ProtocolV1Diagram() {
  return (
    <Mermaid
      caption="BLOK Capital V1: a smart-wallet layer on top of factory-deployed gardens, with DAO-governed registries gating community-verified DeFi integrations."
      chart={`
flowchart TB
  subgraph WALLET["Wallet infrastructure"]
    W["Web3Auth MPC · Smart Wallet (AA)"]
  end
  subgraph PROTO["Protocol infrastructure"]
    GF["GardenFactory"] --> GA["Gardens<br/>(user portfolios)"]
    GA --> ADM["Garden Administration"]
    ADM --> REG["Protocol Registries<br/>DAO-governed"]
    ADM --> INT["DeFi integration contracts"]
  end
  subgraph GOV["Data + governance"]
    SG["The Graph subgraphs"]
    DAO["Aragon DAO"]
  end
  subgraph DEFI["DeFi integrations"]
    AAVE["Lending · AAVE"]
    UNI["DEX · Uniswap"]
  end
  W --> GA
  REG --> DEFI
  DAO --> REG
  SG -. indexes events .-> DAO
`}
    />
  );
}

/** builders/dao-governance/blokc-proposal: Aragon proposal flow. */
export function DaoProposalDiagram() {
  return (
    <Mermaid
      caption="The BLOK Capital proposal system on Aragon OSx: members propose, the community votes, and passing proposals execute on-chain actions."
      chart={`
flowchart LR
  M["DAO member"] --> P["Create proposal<br/>(Aragon OSx)"]
  P --> V{"Community vote"}
  V -->|passed| E["Execute on-chain"]
  V -->|rejected| X["No change"]
  E --> A1["Upgrade smart contracts"]
  E --> A2["Add DEX / liquidity pool"]
  E --> A3["Update registries"]
`}
    />
  );
}

/** builders/smart-contracts/gardens-and-diamonds: diamond proxy call flow. */
export function ProxyFlowDiagram() {
  return (
    <Mermaid
      caption="A call hits the Diamond (Garden.sol), which looks up the function selector and delegatecalls into the facet that implements it."
      chart={`
flowchart LR
  U["Caller"] --> D["Diamond · Garden.sol<br/>selector → facet map"]
  D -->|delegatecall| F1["Facet A"]
  D -->|delegatecall| F2["Facet B"]
  D -->|delegatecall| F3["Facet C"]
`}
    />
  );
}

/** builders/smart-contracts/gardens-and-diamonds: selector → facet routing. */
export function DelegationDiagram() {
  return (
    <Mermaid
      caption="The Diamond maintains a mapping of function selectors to facet addresses, delegating each call to the facet that owns it."
      chart={`
flowchart LR
  S1["transfer() selector"] --> D["Diamond"]
  S2["diamondCut() selector"] --> D
  S3["facets() selector"] --> D
  D --> MAP["Selector → facet mapping"]
  MAP --> FA["TokenFacet"]
  MAP --> FB["DiamondCutFacet"]
  MAP --> FC["DiamondLoupeFacet"]
`}
    />
  );
}

/** builders/smart-contracts/gardens-and-diamonds: key diamond components. */
export function DiamondComponentsDiagram() {
  return (
    <Mermaid
      caption="Key components: the Diamond entry point routes to upgrade, introspection and ownership facets, all bound by standard interfaces."
      chart={`
flowchart TB
  D["Diamond.sol<br/>entry point · fallback · diamondCut"]
  D --> CF["DiamondCutFacet<br/>upgrades"]
  D --> LF["DiamondLoupeFacet<br/>introspection"]
  D --> OF["OwnershipFacet"]
  IFACE["Interfaces<br/>IDiamondCut · IDiamondLoupe"] -. enforce consistency .-> D
`}
    />
  );
}

/** resources/garden-index: market-cap index rebalancing logic. */
export function GardenIndexDiagram() {
  return (
    <Mermaid
      caption="Proposed market-cap index architecture (WIP): target weights are computed from oracle data, then compared against current holdings; trades fire only when deviations exceed the tolerance threshold."
      chart={`
flowchart TB
  O["Oracle prices + market caps"] --> ICR["Index Calculation Registry<br/>compute target weights"]
  ICR --> CMP{"Deviation vs<br/>5% tolerance"}
  CMP -->|within tolerance| HOLD["No trade<br/>(avoid over-trading)"]
  CMP -->|exceeds tolerance| RB["Rebalance<br/>sell overweight · buy underweight"]
  RB --> G["Garden holdings updated"]
`}
    />
  );
}

// --- Hand-authored SVG heroes ---------------------------------------------

const NODE = {
  fill: "#F4EEE0",
  stroke: "#4F6F4F",
  accent: "#C67B5C",
  ink: "#1F1A14",
  ink2: "#473C30",
  sub: "#7A6C5A",
  paper: "#FAF7F0",
} as const;

/**
 * concepts/protocol-concepts/diamond:the signature Diamond architecture: one
 * stable address routing function selectors to independent facets over shared
 * storage.
 */
export function DiamondDiagram() {
  return (
    <Figure caption="The Diamond (Garden) is one permanent address: it routes function selectors to independent facets, all operating over a single shared storage layout.">
      <svg
        viewBox="0 0 760 360"
        role="img"
        aria-label="A single Diamond contract routes function-selector calls to Core, Index and DeFi facets, all sharing one storage layout."
        className="h-auto w-full"
        style={{ fontFamily: "var(--font-body), Inter, sans-serif" }}
      >
        <defs>
          <marker id="dia-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill={NODE.ink2} />
          </marker>
        </defs>

        {/* Caller */}
        <g>
          <rect x="16" y="150" width="120" height="60" rx="12" fill={NODE.paper} stroke={NODE.stroke} strokeWidth="1.5" />
          <text x="76" y="185" textAnchor="middle" fontSize="14" fill={NODE.ink}>Caller</text>
        </g>

        {/* Diamond hub */}
        <g>
          <rect x="250" y="120" width="180" height="120" rx="16" fill={NODE.fill} stroke={NODE.stroke} strokeWidth="2" />
          <text x="340" y="158" textAnchor="middle" fontSize="16" fontWeight="600" fill={NODE.ink}>Diamond</text>
          <text x="340" y="180" textAnchor="middle" fontSize="12.5" fill={NODE.ink2}>Garden.sol · one address</text>
          <text x="340" y="208" textAnchor="middle" fontSize="11.5" fill={NODE.sub}>selector → facet map</text>
          <text x="340" y="224" textAnchor="middle" fontSize="11.5" fill={NODE.sub}>fallback · diamondCut</text>
        </g>
        <path d="M138 180 L248 180" stroke={NODE.ink2} strokeWidth="1.5" markerEnd="url(#dia-arrow)" />

        {/* Facets */}
        {[
          { y: 28, t: "Core facets", s: "ownership · upgrades" },
          { y: 150, t: "Index facets", s: "weights · rebalance" },
          { y: 272, t: "DeFi facets", s: "DEX · GMX · pricing" },
        ].map((f) => (
          <g key={f.t}>
            <rect x="560" y={f.y} width="184" height="60" rx="12" fill={NODE.fill} stroke={NODE.accent} strokeWidth="1.5" />
            <text x="652" y={f.y + 27} textAnchor="middle" fontSize="13.5" fontWeight="600" fill={NODE.ink}>{f.t}</text>
            <text x="652" y={f.y + 44} textAnchor="middle" fontSize="11" fill={NODE.sub}>{f.s}</text>
          </g>
        ))}
        <path d="M432 150 C500 110, 510 80, 558 70" stroke={NODE.ink2} strokeWidth="1.5" fill="none" markerEnd="url(#dia-arrow)" />
        <path d="M432 180 L558 180" stroke={NODE.ink2} strokeWidth="1.5" markerEnd="url(#dia-arrow)" />
        <path d="M432 210 C500 250, 510 280, 558 290" stroke={NODE.ink2} strokeWidth="1.5" fill="none" markerEnd="url(#dia-arrow)" />
        <text x="495" y="172" textAnchor="middle" fontSize="10.5" fill={NODE.sub}>delegatecall</text>

        {/* Shared storage */}
        <g>
          <rect x="250" y="285" width="180" height="56" rx="12" fill={NODE.paper} stroke={NODE.stroke} strokeWidth="1.5" strokeDasharray="5 4" />
          <text x="340" y="310" textAnchor="middle" fontSize="13" fontWeight="600" fill={NODE.ink}>Shared storage</text>
          <text x="340" y="328" textAnchor="middle" fontSize="11" fill={NODE.sub}>one state, all facets</text>
        </g>
        <path d="M340 240 L340 283" stroke={NODE.ink2} strokeWidth="1.5" markerEnd="url(#dia-arrow)" />
      </svg>
    </Figure>
  );
}

/**
 * smart-contracts/introduction: a guided 7-step exploration of the repository
 * for new builders. The botanical icons (seed, sprout, plant, tree rings,
 * bricks, sun, bloom) mirror the original "Repository Exploration Journey"
 * diagram and lean into the Garden metaphor, recoloured into the Garden
 * Journal palette (moss for growth, ochre for substrate, clay for bloom).
 */
type IconKind = "seed" | "roots" | "sapling" | "rings" | "bricks" | "sun" | "bloom";

const TONES = {
  moss: "#4F6F4F",
  mossDeep: "#324E38",
  ochre: "#C49C47",
  clay: "#C67B5C",
  clayDeep: "#9A5B41",
} as const;

function StepIcon({ kind, cx, cy, color }: { kind: IconKind; cx: number; cy: number; color: string }) {
  const stroke = NODE.ink;
  const sw = 1.5;
  const common = { stroke, strokeWidth: sw, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const fillSoft = { fill: color, fillOpacity: 0.55, stroke, strokeWidth: sw, strokeLinejoin: "round" as const };
  switch (kind) {
    case "seed":
      // Bold solid almond seed with a single curl shoot — small + tight, the
      // tiniest icon in the journey.
      return (
        <g>
          <path
            d={`M${cx} ${cy - 12} C${cx - 9} ${cy - 4} ${cx - 9} ${cy + 6} ${cx} ${cy + 11} C${cx + 9} ${cy + 6} ${cx + 9} ${cy - 4} ${cx} ${cy - 12} Z`}
            fill={color}
            stroke={stroke}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <path
            d={`M${cx} ${cy - 12} C${cx + 5} ${cy - 16} ${cx + 9} ${cy - 17} ${cx + 6} ${cy - 20}`}
            {...common}
          />
        </g>
      );
    case "roots":
      // Sprout rising from a soil horizon: two opposed leaves at the top and
      // soil hatching below. Reads as "growing from a foundation".
      return (
        <g>
          {/* soil horizon + texture ticks */}
          <line x1={cx - 14} y1={cy + 5} x2={cx + 14} y2={cy + 5} {...common} />
          <line x1={cx - 10} y1={cy + 11} x2={cx - 7} y2={cy + 8} {...common} />
          <line x1={cx - 2} y1={cy + 11} x2={cx + 1} y2={cy + 8} {...common} />
          <line x1={cx + 6} y1={cy + 11} x2={cx + 9} y2={cy + 8} {...common} />
          {/* stem */}
          <line x1={cx} y1={cy + 5} x2={cx} y2={cy - 4} {...common} />
          {/* two leaves opening upward */}
          <path
            d={`M${cx} ${cy - 1} Q${cx - 9} ${cy - 3} ${cx - 8} ${cy - 11} Q${cx - 2} ${cy - 7} ${cx} ${cy - 1} Z`}
            {...fillSoft}
          />
          <path
            d={`M${cx} ${cy - 1} Q${cx + 9} ${cy - 3} ${cx + 8} ${cy - 11} Q${cx + 2} ${cy - 7} ${cx} ${cy - 1} Z`}
            {...fillSoft}
          />
        </g>
      );
    case "sapling":
      // A single, larger leaf with a clear central vein and side veins.
      // Visually a *different category* from the two-small-leaves sprout — a
      // mature plant form.
      return (
        <g>
          <path
            d={`M${cx} ${cy - 14} Q${cx - 11} ${cy - 4} ${cx} ${cy + 13} Q${cx + 11} ${cy - 4} ${cx} ${cy - 14} Z`}
            {...fillSoft}
          />
          <line x1={cx} y1={cy - 14} x2={cx} y2={cy + 13} {...common} />
          <line x1={cx} y1={cy - 6} x2={cx - 6} y2={cy - 2} {...common} />
          <line x1={cx} y1={cy - 6} x2={cx + 6} y2={cy - 2} {...common} />
          <line x1={cx} y1={cy + 2} x2={cx - 7} y2={cy + 6} {...common} />
          <line x1={cx} y1={cy + 2} x2={cx + 7} y2={cy + 6} {...common} />
        </g>
      );
    case "rings":
      // Concentric tree-ring cross-section. Thicker than before with a solid
      // colored heartwood at the center.
      return (
        <g>
          <circle cx={cx} cy={cy} r="14" fill="none" stroke={stroke} strokeWidth={sw} />
          <circle cx={cx} cy={cy} r="9" fill="none" stroke={stroke} strokeWidth={sw} />
          <circle cx={cx} cy={cy} r="4.5" fill={color} stroke={stroke} strokeWidth={sw} />
        </g>
      );
    case "bricks":
      // 3-row staggered brick wall with subtly larger bricks.
      return (
        <g {...common}>
          <rect x={cx - 14} y={cy - 12} width="13" height="7" />
          <rect x={cx + 1} y={cy - 12} width="13" height="7" />
          <rect x={cx - 7.5} y={cy - 4} width="15" height="7" />
          <rect x={cx - 14} y={cy + 4} width="13" height="7" />
          <rect x={cx + 1} y={cy + 4} width="13" height="7" />
        </g>
      );
    case "sun":
      // Larger sun disc with eight clear, longer rays — visually heftier.
      return (
        <g>
          <circle cx={cx} cy={cy} r="7.5" fill={color} stroke={stroke} strokeWidth={sw} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const r = (deg * Math.PI) / 180;
            return (
              <line
                key={deg}
                x1={cx + Math.cos(r) * 11}
                y1={cy + Math.sin(r) * 11}
                x2={cx + Math.cos(r) * 16}
                y2={cy + Math.sin(r) * 16}
                {...common}
              />
            );
          })}
        </g>
      );
    case "bloom":
      // Bigger flower head on a stem in a small pot — the most decorative,
      // "finished" form in the journey.
      return (
        <g>
          {/* pot */}
          <path
            d={`M${cx - 10} ${cy + 5} L${cx + 10} ${cy + 5} L${cx + 7.5} ${cy + 13} L${cx - 7.5} ${cy + 13} Z`}
            fill={color}
            fillOpacity="0.3"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <line x1={cx - 10} y1={cy + 5} x2={cx + 10} y2={cy + 5} {...common} />
          {/* stem */}
          <line x1={cx} y1={cy + 5} x2={cx} y2={cy - 6} {...common} />
          {/* 5 petals around the bloom center */}
          {[0, 72, 144, 216, 288].map((deg) => {
            const r = ((deg - 90) * Math.PI) / 180;
            return (
              <circle
                key={deg}
                cx={cx + Math.cos(r) * 5.5}
                cy={cy - 9 + Math.sin(r) * 5.5}
                r="3.5"
                fill={color}
                fillOpacity="0.65"
                stroke={stroke}
                strokeWidth={sw}
              />
            );
          })}
          <circle cx={cx} cy={cy - 9} r="2" fill={stroke} />
        </g>
      );
  }
}

export function SystemOverviewDiagram() {
  const STEPS: { title: string; desc: string; icon: IconKind; tone: keyof typeof TONES }[] = [
    { title: "Start at the entry point", desc: "Diamond · the main controller contract (Garden.sol)", icon: "seed", tone: "moss" },
    { title: "Explore base facets", desc: "ownership · upgrade · introspection", icon: "roots", tone: "moss" },
    { title: "Explore feature facets", desc: "index · utility · protocol integration", icon: "sapling", tone: "mossDeep" },
    { title: "Explore the domain layer", desc: "index · factory · registries", icon: "rings", tone: "ochre" },
    { title: "Explore storage layouts", desc: "shared Diamond storage · storage libraries", icon: "bricks", tone: "ochre" },
    { title: "Explore runtime & libraries", desc: "Diamond runtime · OpenZeppelin utilities", icon: "sun", tone: "clay" },
    { title: "Explore external integrations", desc: "DEXes · GMX · Chainlink · SBT modules", icon: "bloom", tone: "clayDeep" },
  ];

  const R = 28;
  const stepGap = 92;
  const yStart = 52;
  // Icon column is shifted inward so the journey reads as visually centered in
  // the frame rather than hugging the left edge: STEP label · icon · text are
  // grouped around the middle of a 720-wide viewBox.
  const cx = 230;
  const labelX = 188;
  const textX = 286;
  const W = 720;
  // Leave generous space below the last step so the terminal arrow can sit on
  // its own line with proper breathing room (previously it clipped right
  // beneath step 7's circle).
  const H = yStart + (STEPS.length - 1) * stepGap + R + 56;

  return (
    <Figure caption="A guided journey through the V1 repository for new builders: start at the Diamond entry point, then grow outward through facets, the domain layer, storage, runtime, and external integrations.">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="A seven-step repository exploration journey for new builders, from the Diamond entry point out to external integrations."
        className="mx-auto h-auto w-full max-w-2xl"
        style={{ fontFamily: "var(--font-body), Inter, sans-serif" }}
      >
        <defs>
          {/* Right-pointing triangle. orient="auto" rotates it to follow the
              line direction, so on a vertical line going down the tip ends up
              pointing down (a down-facing triangle in marker coords would get
              rotated 90 degrees and point sideways — that was the earlier bug). */}
          <marker id="sys-arrow" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="11" markerHeight="11" orient="auto">
            <path d="M0 0 L12 6 L0 12 z" fill={NODE.ink2} />
          </marker>
        </defs>

        {/* Dashed connector line between icons, then a terminal arrow that
            sits clearly *below* the last circle (not clipping its edge). */}
        <line
          x1={cx}
          y1={yStart + R}
          x2={cx}
          y2={yStart + (STEPS.length - 1) * stepGap - R}
          stroke={NODE.ink2}
          strokeOpacity="0.35"
          strokeWidth="1.5"
          strokeDasharray="2 5"
        />
        <line
          x1={cx}
          y1={yStart + (STEPS.length - 1) * stepGap + R + 10}
          x2={cx}
          y2={H - 18}
          stroke={NODE.ink2}
          strokeWidth="1.5"
          markerEnd="url(#sys-arrow)"
        />

        {STEPS.map((s, i) => {
          const cy = yStart + i * stepGap;
          const color = TONES[s.tone];
          return (
            <g key={s.title}>
              <text
                x={labelX}
                y={cy + 4}
                textAnchor="end"
                fontSize="10.5"
                fontWeight="600"
                fill={color}
                letterSpacing="2"
              >
                {`STEP ${i + 1}`}
              </text>
              <circle cx={cx} cy={cy} r={R} fill={NODE.fill} stroke={color} strokeWidth="1.75" />
              <StepIcon kind={s.icon} cx={cx} cy={cy} color={color} />
              <text x={textX} y={cy - 4} fontSize="14.5" fontWeight="600" fill={NODE.ink}>
                {s.title}
              </text>
              <text x={textX} y={cy + 16} fontSize="12" fill={NODE.sub}>
                {s.desc}
              </text>
            </g>
          );
        })}
      </svg>
    </Figure>
  );
}
