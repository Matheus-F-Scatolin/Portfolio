// Graph of Work: every string, coordinate and timing lives here, so the
// scroll-driven figure and the static figures are built from one source.
// Excerpt rows are verbatim from public/llms.txt (markdown ** removed).

// ------------------------------------------------------------------
// Excerpt (chapter 1)
// ------------------------------------------------------------------

export const EXCERPT = {
  x: 110, // text column
  numX: 84, // line numbers, right-aligned
  y0: 110, // first baseline
  rowH: 27,
  fontSize: 15,
  charW: 9, // 0.6em mono advance at 15 units
} as const;

export type Row = { line?: number; text: string };

// A row without `line` is a soft-wrapped continuation of the row above.
export const rows: Row[] = [
  { line: 1, text: '# Matheus Ferracciú Scatolin' },
  { line: 5, text: 'AI Engineer @ Valor Capital Group | Computer' },
  { text: 'Engineering @ Unicamp (Ranked 1st of 102) |' },
  { text: "Fellow Estudar '25 | Published AI Researcher" },
  { line: 26, text: '- 2nd place, Itaú Asset Quant AI Challenge 2025,' },
  { text: 'among ~1,000 teams and 2,500+ participants' },
  { line: 27, text: '- Best Team Award, MBZUAI UGRIP 2025 (selected in' },
  { text: 'the top 3% of 2,000+ international applicants)' },
  { line: 81, text: '- Day-to-day work spans agentic AI pipelines,' },
  { text: 'knowledge graphs, and MCP-based tooling' },
  { line: 83, text: '### Instituto Kunumi (kunuminst COLABS) | AI Researcher' },
  { line: 86, text: '- Research on the automatic generation of' },
  { text: 'Knowledge Graphs and new techniques for' },
  { text: 'Graph-RAG systems' },
  { line: 89, text: '### Enter | AI Fellow | Mar 2026 - Jun 2026' },
  { line: 112, text: '### Semantix AI | Research Fellow / AI Researcher' },
  { line: 114, text: '- Designed, developed, and led STELLAR' },
];

export const rowBaseline = (row: number) => EXCERPT.y0 + row * EXCERPT.rowH;
export const colX = (col: number) => EXCERPT.x + col * EXCERPT.charW;

// Logical lines (continuations joined), for the HTML excerpt on phones.
export type ExcerptLine = { line: number; text: string; rowStarts: number[]; rowIndexes: number[] };
export const excerptLines: ExcerptLine[] = rows.reduce<ExcerptLine[]>((acc, row, i) => {
  if (row.line !== undefined) {
    acc.push({ line: row.line, text: row.text, rowStarts: [0], rowIndexes: [i] });
  } else {
    const last = acc[acc.length - 1];
    last.rowStarts.push(last.text.length + 1);
    last.rowIndexes.push(i);
    last.text = `${last.text} ${row.text}`;
  }
  return acc;
}, []);

// ------------------------------------------------------------------
// Scroll timeline (fractions of the pinned section's scroll progress)
// ------------------------------------------------------------------

export const TIMELINE = {
  chapter2: 0.34, // "Connect" starts
  chapter3: 0.68, // "Now" starts
  highlightStart: 0.02,
  highlightStep: 0.25 / 15,
  highlightDur: 0.03,
  morphStart: 0.36,
  morphStep: 0.008,
  morphDur: 0.06,
  swap: 0.005, // rect-to-node crossfade half window
  textDim: [0.36, 0.45] as const,
  textDimTo: 0.07,
  // After the ghosted text has carried the eye through the morph, it clears
  // completely so the finished graph reads without text behind it.
  textClear: [0.5, 0.58] as const,
  edgeStart: 0.5,
  edgeStep: 0.008,
  edgeDur: 0.04,
  // Chapter 3, in order: the heading types over typeScroll, the path from
  // Matheus is drawn over traceScroll, then the sentence under the heading
  // fades in over nowBody.
  typeScroll: [0.685, 0.8] as const,
  traceScroll: [0.805, 0.95] as const,
  nowBody: [0.945, 0.98] as const,
} as const;

// Fixed progress for the static figures: each equals its chapter's end state.
export const STATIC_PROGRESS = { extract: 0.34, connect: 0.68, now: 1 } as const;

// Where the chapter rail lands: the point where that chapter's figure is complete.
export const RAIL_TARGETS = [0.31, 0.676, 0.98] as const;

export const chapterAt = (p: number) => (p < TIMELINE.chapter2 ? 0 : p < TIMELINE.chapter3 ? 1 : 2);

// Chapter 3 traversal, in trace units from 0 to TRACE.end. The pinned
// version maps TIMELINE.traceScroll onto this range; static figures pass end.
export const TRACE = {
  dim: 0.4,
  stepStart: 0.4,
  stepGap: 0.18,
  stepDur: 0.25,
  end: 0.4 + 0.18 * 5 + 0.25,
} as const;

// ------------------------------------------------------------------
// Graph
// ------------------------------------------------------------------

export type NodeId =
  | 'me'
  | 'valor'
  | 'kunumi'
  | 'kg'
  | 'graphrag'
  | 'agentic'
  | 'mcp'
  | 'enter'
  | 'itau'
  | 'mbzuai'
  | 'bestteam'
  | 'stellar'
  | 'semantix'
  | 'unicamp'
  | 'estudar';

export type NodeKind = 'self' | 'entity' | 'topic';
export type Side = 'left' | 'right' | 'above' | 'below';
export type Anchor = 'start' | 'middle' | 'end';
export type LabelSpec = { side: Side; align?: Anchor; dx?: number; dy?: number; lines?: string[] };
export type Place = { x: number; y: number; label: LabelSpec };
export type LayoutKey = 'wide' | 'tall';

export type GraphNode = {
  id: NodeId;
  label: string;
  kind: NodeKind;
  wide: Place;
  tall: Place;
};

export const nodes: GraphNode[] = [
  {
    id: 'me',
    label: 'Matheus',
    kind: 'self',
    wide: { x: 500, y: 320, label: { side: 'above', dy: -21 } },
    tall: { x: 320, y: 490, label: { side: 'right', dx: 6, dy: -24 } },
  },
  {
    id: 'valor',
    label: 'Valor Capital Group',
    kind: 'entity',
    wide: { x: 680, y: 190, label: { side: 'below', align: 'start' } },
    tall: { x: 440, y: 280, label: { side: 'left', dx: -6, lines: ['Valor Capital', 'Group'] } },
  },
  {
    id: 'kunumi',
    label: 'Instituto Kunumi',
    kind: 'entity',
    wide: { x: 320, y: 190, label: { side: 'below', align: 'end' } },
    tall: { x: 200, y: 290, label: { side: 'left', lines: ['Instituto', 'Kunumi'] } },
  },
  {
    id: 'kg',
    label: 'knowledge graphs',
    kind: 'topic',
    wide: { x: 500, y: 80, label: { side: 'above' } },
    tall: { x: 330, y: 95, label: { side: 'above' } },
  },
  {
    id: 'graphrag',
    label: 'Graph-RAG',
    kind: 'topic',
    wide: { x: 230, y: 85, label: { side: 'left' } },
    tall: { x: 170, y: 150, label: { side: 'left' } },
  },
  {
    id: 'agentic',
    label: 'agentic AI pipelines',
    kind: 'topic',
    wide: { x: 780, y: 75, label: { side: 'right' } },
    tall: { x: 548, y: 160, label: { side: 'above', lines: ['agentic AI', 'pipelines'] } },
  },
  {
    id: 'mcp',
    label: 'MCP-based tooling',
    kind: 'topic',
    wide: { x: 870, y: 150, label: { side: 'above' } },
    tall: { x: 556, y: 370, label: { side: 'below', lines: ['MCP-based', 'tooling'] } },
  },
  {
    id: 'enter',
    label: 'Enter',
    kind: 'entity',
    wide: { x: 830, y: 330, label: { side: 'right' } },
    tall: { x: 556, y: 520, label: { side: 'above' } },
  },
  {
    id: 'itau',
    label: 'Itaú Asset Quant AI Challenge',
    kind: 'entity',
    wide: { x: 720, y: 465, label: { side: 'right' } },
    tall: { x: 508, y: 648, label: { side: 'below', dy: 6, lines: ['Itaú Asset Quant', 'AI Challenge'] } },
  },
  {
    id: 'mbzuai',
    label: 'MBZUAI UGRIP',
    kind: 'entity',
    wide: { x: 540, y: 520, label: { side: 'left' } },
    tall: { x: 370, y: 752, label: { side: 'right', dx: 6 } },
  },
  {
    id: 'bestteam',
    label: 'Best Team Award',
    kind: 'entity',
    wide: { x: 700, y: 590, label: { side: 'right' } },
    tall: { x: 490, y: 870, label: { side: 'left', dy: 6 } },
  },
  {
    id: 'stellar',
    label: 'STELLAR',
    kind: 'entity',
    wide: { x: 330, y: 540, label: { side: 'below' } },
    tall: { x: 230, y: 712, label: { side: 'right' } },
  },
  {
    id: 'semantix',
    label: 'Semantix AI',
    kind: 'entity',
    wide: { x: 170, y: 480, label: { side: 'left' } },
    tall: { x: 100, y: 842, label: { side: 'right', dx: 6 } },
  },
  {
    id: 'unicamp',
    label: 'Unicamp',
    kind: 'entity',
    wide: { x: 180, y: 300, label: { side: 'left' } },
    tall: { x: 80, y: 420, label: { side: 'above' } },
  },
  {
    id: 'estudar',
    label: 'Fundação Estudar',
    kind: 'entity',
    wide: { x: 250, y: 400, label: { side: 'left' } },
    tall: { x: 120, y: 620, label: { side: 'below', lines: ['Fundação', 'Estudar'] } },
  },
];

export const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n])) as Record<NodeId, GraphNode>;

export type GraphEdge = {
  from: NodeId;
  to: NodeId;
  predicate: string;
  // Where the predicate label sits along the edge (0 = from, 1 = to).
  t?: { wide?: number; tall?: number };
  // The only predicate labels kept on the phone figure.
  primary?: boolean;
};

export const edges: GraphEdge[] = [
  { from: 'me', to: 'valor', predicate: 'engineer_at', primary: true },
  { from: 'me', to: 'unicamp', predicate: 'ranked_1st_of_102', t: { tall: 0.6 }, primary: true },
  { from: 'me', to: 'estudar', predicate: 'fellow_of' },
  { from: 'me', to: 'itau', predicate: 'placed_2nd', primary: true },
  { from: 'me', to: 'mbzuai', predicate: 'researched_at', t: { tall: 0.6 }, primary: true },
  { from: 'mbzuai', to: 'bestteam', predicate: 'awarded' },
  { from: 'valor', to: 'agentic', predicate: 'works_on' },
  { from: 'valor', to: 'kg', predicate: 'works_on' },
  { from: 'valor', to: 'mcp', predicate: 'works_on' },
  { from: 'me', to: 'kunumi', predicate: 'researched_at' },
  { from: 'kunumi', to: 'kg', predicate: 'generates' },
  { from: 'kunumi', to: 'graphrag', predicate: 'researches' },
  { from: 'graphrag', to: 'kg', predicate: 'retrieves_over' },
  { from: 'me', to: 'enter', predicate: 'was_fellow_at' },
  { from: 'me', to: 'stellar', predicate: 'led' },
  { from: 'stellar', to: 'semantix', predicate: 'built_at' },
];

// ------------------------------------------------------------------
// Mentions: highlighted spans in the excerpt, each resolving to a node.
// Columns are computed from the row text so they are always exact.
// ------------------------------------------------------------------

const mentionSpecs: [row: number, text: string, node: NodeId][] = [
  [0, 'Matheus Ferracciú Scatolin', 'me'],
  [1, 'Valor Capital Group', 'valor'],
  [2, 'Unicamp', 'unicamp'],
  [3, "Fellow Estudar '25", 'estudar'],
  [4, 'Itaú Asset Quant AI Challenge 2025', 'itau'],
  [6, 'Best Team Award', 'bestteam'],
  [6, 'MBZUAI UGRIP 2025', 'mbzuai'],
  [8, 'agentic AI pipelines', 'agentic'],
  [9, 'knowledge graphs', 'kg'],
  [9, 'MCP-based tooling', 'mcp'],
  [10, 'Instituto Kunumi', 'kunumi'],
  [12, 'Knowledge Graphs', 'kg'], // same node: entity resolution
  [13, 'Graph-RAG', 'graphrag'],
  [14, 'Enter', 'enter'],
  [15, 'Semantix AI', 'semantix'],
  [16, 'STELLAR', 'stellar'],
];

export type Mention = {
  index: number;
  row: number;
  col: number;
  text: string;
  node: NodeId;
  highlight: [number, number];
  morph: [number, number];
};

export const mentions: Mention[] = mentionSpecs.map(([row, text, node], index) => {
  const col = rows[row].text.indexOf(text);
  if (col < 0) throw new Error(`Mention "${text}" not found in row ${row}`);
  const h0 = TIMELINE.highlightStart + index * TIMELINE.highlightStep;
  const m0 = TIMELINE.morphStart + index * TIMELINE.morphStep;
  return {
    index,
    row,
    col,
    text,
    node,
    highlight: [h0, h0 + TIMELINE.highlightDur],
    morph: [m0, m0 + TIMELINE.morphDur],
  };
});

// A node appears when its first mention lands on it.
export const nodeAppearAt = Object.fromEntries(
  nodes.map((n) => [n.id, Math.min(...mentions.filter((m) => m.node === n.id).map((m) => m.morph[1]))])
) as Record<NodeId, number>;

export const edgeWindow = (i: number): [number, number] => {
  const e0 = TIMELINE.edgeStart + i * TIMELINE.edgeStep;
  return [e0, e0 + TIMELINE.edgeDur];
};

// ------------------------------------------------------------------
// Copy
// ------------------------------------------------------------------

export const CHAPTERS = [
  {
    verb: 'Extract',
    title: 'Every graph starts as text.',
    body: 'This is my profile, the same file I give to AI agents. First, pull out the entities.',
  },
  {
    verb: 'Connect',
    title: 'Then connect them.',
    body: 'Entities become nodes and sentences become relations. The two mentions of knowledge graphs resolve to one node.',
  },
  {
    verb: 'Now',
    title: 'What am I working on now?',
    body: 'Agentic AI pipelines, knowledge graphs and MCP-based tooling at Valor Capital Group, after Graph-RAG research at Instituto Kunumi (2025-2026).',
  },
] as const;

export const FIGURE_TEXT = {
  pinned: {
    title: 'Graph of work',
    desc: 'Selected lines of llms.txt with the entity mentions highlighted. As the page scrolls, the mentions become the nodes of a knowledge graph and the relations between them are drawn. The relations are listed after the figure.',
  },
  extract: {
    title: 'Selected lines of llms.txt',
    desc: 'Selected lines of llms.txt with sixteen entity mentions highlighted.',
  },
  connect: {
    title: 'Knowledge graph built from the mentions',
    desc: "Fifteen nodes and sixteen relations. Both mentions of knowledge graphs resolve to one node. Matheus links to Valor Capital Group, Instituto Kunumi, Unicamp, Fundação Estudar, Itaú Asset Quant AI Challenge, MBZUAI UGRIP, Enter and STELLAR.",
  },
  now: {
    title: 'What I am working on now',
    desc: 'From Matheus to Valor Capital Group, then to agentic AI pipelines, knowledge graphs and MCP-based tooling. From knowledge graphs to Instituto Kunumi, then to Graph-RAG.',
  },
} as const;

// ------------------------------------------------------------------
// Chapter 3: the current work, traced from Matheus
// ------------------------------------------------------------------

// Walk order. Each step lights one edge, drawn from `from` to `to`.
const walk: [NodeId, NodeId][] = [
  ['me', 'valor'],
  ['valor', 'agentic'],
  ['valor', 'kg'],
  ['valor', 'mcp'],
  ['kg', 'kunumi'],
  ['kunumi', 'graphrag'],
];

export type TraceStep = { edge: number; from: NodeId; to: NodeId; window: [number, number] };

export const traceSteps: TraceStep[] = walk.map(([from, to], k) => {
  const edge = edges.findIndex((e) => (e.from === from && e.to === to) || (e.from === to && e.to === from));
  if (edge < 0) throw new Error(`No edge between ${from} and ${to}`);
  const s = TRACE.stepStart + k * TRACE.stepGap;
  return { edge, from, to, window: [s, s + TRACE.stepDur] };
});

// When each node on the path is reached (in trace units). The start
// node is lit from the beginning: the path starts from Matheus.
export const nodeLitAt: Partial<Record<NodeId, number>> = traceSteps.reduce<Partial<Record<NodeId, number>>>(
  (acc, step, k) => {
    if (k === 0) acc[step.from] = 0;
    if (acc[step.to] === undefined) acc[step.to] = step.window[1];
    return acc;
  },
  {}
);

export const edgeLitStep: Partial<Record<number, TraceStep>> = Object.fromEntries(
  traceSteps.map((s) => [s.edge, s])
);

// Plain-language triples for screen readers.
export const triples = edges.map(
  (e) => `${nodeById[e.from].label}, ${e.predicate.replace(/_/g, ' ')}, ${nodeById[e.to].label}`
);

// ------------------------------------------------------------------
// Geometry shared by the figure and the layout checks
// ------------------------------------------------------------------

export const LAYOUTS = {
  wide: {
    w: 1000,
    h: 640,
    label: 14,
    selfLabel: 16,
    edgeLabel: 12,
    lineH: 17,
    r: 5,
    selfR: 8,
    topicR: 6,
    gap: 8,
    stroke: 1,
    topicStroke: 1.25,
    litStroke: 1.75,
    ringGap: 5,
    halo: 4,
  },
  tall: {
    w: 640,
    h: 940,
    label: 22,
    selfLabel: 26,
    edgeLabel: 19,
    lineH: 26,
    r: 8,
    selfR: 12,
    topicR: 9,
    gap: 12,
    stroke: 1.8,
    topicStroke: 2.2,
    litStroke: 3.2,
    ringGap: 8,
    halo: 6,
  },
} as const;

export type Layout = (typeof LAYOUTS)[LayoutKey];

const MONO_ADVANCE = 0.6;

export type Box = { x0: number; y0: number; x1: number; y1: number };

export const nodeRadius = (kind: NodeKind, L: Layout) =>
  kind === 'self' ? L.selfR : kind === 'topic' ? L.topicR : L.r;

export type LabelGeometry = {
  x: number;
  y: number; // first baseline
  anchor: Anchor;
  lines: string[];
  fontSize: number;
  lineH: number;
  box: Box;
};

export function labelGeometry(node: GraphNode, key: LayoutKey): LabelGeometry {
  const L = LAYOUTS[key];
  const place = node[key];
  const spec = place.label;
  const fontSize = node.kind === 'self' ? L.selfLabel : L.label;
  const lineH = node.kind === 'self' ? Math.round(fontSize * 1.2) : L.lineH;
  const lines = spec.lines ?? [node.label];
  const width = Math.max(...lines.map((l) => l.length)) * fontSize * MONO_ADVANCE;
  const blockH = (lines.length - 1) * lineH;
  const r = nodeRadius(node.kind, L);
  const center = fontSize * 0.34; // baseline offset that centers mixed-case text on a point

  let x = place.x;
  let y = place.y;
  let anchor: Anchor;
  switch (spec.side) {
    case 'right':
      anchor = 'start';
      x = place.x + r + L.gap;
      y = place.y + center - blockH / 2;
      break;
    case 'left':
      anchor = 'end';
      x = place.x - r - L.gap;
      y = place.y + center - blockH / 2;
      break;
    case 'above':
      anchor = spec.align ?? 'middle';
      y = place.y - r - L.gap - blockH;
      break;
    case 'below':
    default:
      anchor = spec.align ?? 'middle';
      y = place.y + r + L.gap + fontSize * 0.72;
      break;
  }
  x += spec.dx ?? 0;
  y += spec.dy ?? 0;

  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - width / 2 : x - width;
  return {
    x,
    y,
    anchor,
    lines,
    fontSize,
    lineH,
    box: { x0, y0: y - fontSize * 0.74, x1: x0 + width, y1: y + blockH + fontSize * 0.24 },
  };
}

export type EdgeLabelGeometry = { x: number; y: number; fontSize: number; box: Box };

export function edgeLabelGeometry(edge: GraphEdge, key: LayoutKey): EdgeLabelGeometry {
  const L = LAYOUTS[key];
  const a = nodeById[edge.from][key];
  const b = nodeById[edge.to][key];
  const t = edge.t?.[key] ?? 0.5;
  const px = a.x + (b.x - a.x) * t;
  const py = a.y + (b.y - a.y) * t;
  const fontSize = L.edgeLabel;
  const w = edge.predicate.length * fontSize * MONO_ADVANCE;
  const h = fontSize + 4;
  return {
    x: px,
    y: py + fontSize * 0.34,
    fontSize,
    box: { x0: px - w / 2 - 4, y0: py - h / 2, x1: px + w / 2 + 4, y1: py + h / 2 },
  };
}
