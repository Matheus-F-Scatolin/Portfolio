'use client';

import { cubicBezier, motion, useMotionValue, useTransform, type MotionValue } from 'framer-motion';
import { useEffect, useId } from 'react';
import { ease } from '@/lib/motion';
import {
  EXCERPTS,
  LAYOUTS,
  TIMELINE,
  TRACE,
  colX,
  edgeLabelGeometry,
  edgeLitStep,
  edgeWindow,
  edges,
  excerptKeyOf,
  labelGeometry,
  mentions,
  nodeAppearAt,
  nodeById,
  nodeLitAt,
  nodeRadius,
  nodes,
  rowBaseline,
  type ExcerptKey,
  type GraphEdge,
  type GraphNode,
  type LayoutKey,
  type Mention,
  type TraceStep,
} from './data';

// One figure for every state of the Graph of Work. `progress` is the scroll
// progress (0..1) and `trace` the chapter 3 traversal position (0..TRACE.end). Pass
// motion values for the pinned version or fixed numbers for static figures:
// the same transforms run either way, so a static figure is exactly the end
// state of its chapter.

const easeInOut = cubicBezier(...ease.inOut);
const easeOut = cubicBezier(...ease.out);
const linear = (t: number) => t;
const DIM_WINDOW = [...TIMELINE.textDim];
// Highlight tint. It stays at this alpha through the morph: full-strength
// signal is kept for the chapter 3 path to the current work.
const HIGHLIGHT_ALPHA = 0.28;

type MV = MotionValue<number>;

function useMotionInput(value: number | MV): MV {
  const local = useMotionValue(typeof value === 'number' ? value : 0);
  useEffect(() => {
    if (typeof value === 'number') local.set(value);
  }, [value, local]);
  return typeof value === 'number' ? local : value;
}

export type GraphFigureProps = {
  progress: number | MV;
  trace?: number | MV;
  layout?: LayoutKey;
  edgeLabels?: 'all' | 'primary';
  title: string;
  desc: string;
  className?: string;
};

export default function GraphFigure({
  progress,
  trace = 0,
  layout = 'wide',
  edgeLabels = 'all',
  title,
  desc,
  className,
}: GraphFigureProps) {
  const p = useMotionInput(progress);
  const tr = useMotionInput(trace);
  const L = LAYOUTS[layout];
  const id = useId();
  const dim = useTransform(tr, [0, TRACE.dim], [1, 0.2]);
  const mentionFade = useTransform(p, DIM_WINDOW, [1, 0]);
  const xk = excerptKeyOf(layout);

  return (
    <svg
      viewBox={`0 0 ${L.w} ${L.h}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-labelledby={`${id}-title ${id}-desc`}
      className={className}
    >
      <title id={`${id}-title`}>{title}</title>
      <desc id={`${id}-desc`}>{desc}</desc>

      {xk ? <ExcerptRows p={p} xk={xk} /> : null}

      <g>
        {edges.map((edge, i) => (
          <Edge key={`${edge.from}-${edge.to}`} edge={edge} index={i} layout={layout} p={p} dim={dim} trace={tr} />
        ))}
      </g>
      <g>
        {edges.map((edge, i) =>
          edgeLabels === 'all' || edge.primary ? (
            <EdgeLabel
              key={`${edge.from}-${edge.to}`}
              edge={edge}
              index={i}
              layout={layout}
              p={p}
              dim={dim}
              trace={tr}
            />
          ) : null
        )}
      </g>
      <g>
        {nodes.map((node) => (
          <Node key={node.id} node={node} layout={layout} p={p} dim={dim} trace={tr} />
        ))}
      </g>
      <SelfRing layout={layout} trace={tr} />

      {xk ? (
        <>
          <g>
            {mentions.map((m) => (
              <MentionMark key={m.index} m={m} p={p} layout={layout} xk={xk} />
            ))}
          </g>
          <g className="font-mono" fontSize={EXCERPTS[xk].fontSize}>
            {mentions.map((m) => (
              <MentionText key={m.index} m={m} p={p} fade={mentionFade} xk={xk} />
            ))}
          </g>
        </>
      ) : null}
    </svg>
  );
}

// ------------------------------------------------------------------
// Chapter 1: the excerpt and its highlights
// ------------------------------------------------------------------

function ExcerptRows({ p, xk }: { p: MV; xk: ExcerptKey }) {
  const X = EXCERPTS[xk];
  const opacity = useTransform(
    p,
    [DIM_WINDOW[0], DIM_WINDOW[1], TIMELINE.textClear[0], TIMELINE.textClear[1]],
    [1, TIMELINE.textDimTo, TIMELINE.textDimTo, 0]
  );
  return (
    <motion.g className="font-mono" fontSize={X.fontSize} style={{ opacity }}>
      {X.rows.map((row, i) => (
        <g key={i}>
          {row.line !== undefined ? (
            <text x={X.numX} y={rowBaseline(xk, i)} textAnchor="end" className="fill-stage-muted">
              {row.line}
            </text>
          ) : null}
          <text
            x={X.x}
            y={rowBaseline(xk, i)}
            textLength={row.text.length * X.charW}
            lengthAdjust="spacing"
            className="fill-stage-label"
          >
            {row.text}
          </text>
        </g>
      ))}
    </motion.g>
  );
}

// The highlight behind a mention. In chapter 2 the same rect shrinks and
// travels to its node at the same tint, then crossfades into the node mark.
function MentionMark({ m, p, layout, xk }: { m: Mention; p: MV; layout: LayoutKey; xk: ExcerptKey }) {
  const X = EXCERPTS[xk];
  const node = nodeById[m.node];
  const dest = node[layout];
  const r = nodeRadius(node.kind, LAYOUTS[layout]);
  const { row, col } = m.at[xk];
  const bx = colX(xk, col) - X.mark.padX;
  const by = rowBaseline(xk, row) - X.mark.top;
  const bw = m.text.length * X.charW + 2 * X.mark.padX;
  const bh = X.mark.h;
  const d = r * 2;
  const [h0, h1] = m.highlight;
  const [m0, m1] = m.morph;

  const width = useTransform(p, [h0, h1, m0, m1], [0, bw, bw, d], { ease: [easeOut, linear, easeInOut] });
  const x = useTransform(p, [m0, m1], [bx, dest.x - r], { ease: easeInOut });
  const y = useTransform(p, [m0, m1], [by, dest.y - r], { ease: easeInOut });
  const height = useTransform(p, [m0, m1], [bh, d], { ease: easeInOut });
  const rx = useTransform(p, [m0, m1], [3, r], { ease: easeInOut });
  const opacity = useTransform(p, [m1 - TIMELINE.swap, m1 + TIMELINE.swap], [1, 0]);

  return (
    <motion.rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={rx}
      className="fill-signal"
      fillOpacity={HIGHLIGHT_ALPHA}
      style={{ opacity }}
    />
  );
}

// The mention text in stage-ink, laid exactly over the base row.
function MentionText({ m, p, fade, xk }: { m: Mention; p: MV; fade: MV; xk: ExcerptKey }) {
  const on = useTransform(p, m.highlight, [0, 1]);
  const opacity = useTransform([on, fade], ([a, b]: number[]) => a * b);
  const { row, col } = m.at[xk];
  return (
    <motion.text
      x={colX(xk, col)}
      y={rowBaseline(xk, row)}
      textLength={m.text.length * EXCERPTS[xk].charW}
      lengthAdjust="spacing"
      className="fill-stage-ink"
      style={{ opacity }}
    >
      {m.text}
    </motion.text>
  );
}

// ------------------------------------------------------------------
// Chapter 2: nodes and relations
// ------------------------------------------------------------------

type PartProps = { layout: LayoutKey; p: MV; dim: MV; trace: MV };

function Node({ node, layout, p, dim, trace }: PartProps & { node: GraphNode }) {
  const L = LAYOUTS[layout];
  const { x, y } = node[layout];
  const r = nodeRadius(node.kind, L);
  const label = labelGeometry(node, layout);
  const t0 = nodeAppearAt[node.id];
  const litAt = nodeLitAt[node.id];

  const appear = useTransform(p, [t0 - TIMELINE.swap, t0 + TIMELINE.swap], [0, 1]);
  const labelIn = useTransform(p, [t0, t0 + 0.012], [0, 1]);
  const lit = useTransform(trace, litAt === undefined ? [0, 1] : [litAt - 0.1, litAt], litAt === undefined ? [0, 0] : [0, 1]);
  const shapeOpacity = useTransform([appear, dim, lit], ([a, d, l]: number[]) => a * (d + (1 - d) * l));
  const labelOpacity = useTransform([labelIn, dim, lit], ([a, d, l]: number[]) => a * (d + (1 - d) * l));
  const litLabelOpacity = useTransform([labelIn, lit], ([a, l]: number[]) => a * l);

  const self = node.kind === 'self';
  const lines = label.lines.map((line, i) => (
    <tspan key={i} x={label.x} dy={i === 0 ? undefined : label.lineH}>
      {line}
    </tspan>
  ));

  return (
    <g>
      <motion.circle
        cx={x}
        cy={y}
        r={r}
        className={node.kind === 'topic' ? 'fill-stage stroke-stage-ink' : 'fill-stage-ink'}
        strokeWidth={node.kind === 'topic' ? L.topicStroke : undefined}
        style={{ opacity: shapeOpacity }}
      />
      <motion.text
        x={label.x}
        y={label.y}
        textAnchor={label.anchor}
        fontSize={label.fontSize}
        fontWeight={self ? 500 : undefined}
        className={`font-mono stroke-stage ${self ? 'fill-stage-ink' : 'fill-stage-label'}`}
        strokeWidth={L.halo}
        strokeLinejoin="round"
        paintOrder="stroke"
        style={{ opacity: labelOpacity }}
      >
        {lines}
      </motion.text>
      {litAt !== undefined && !self ? (
        <motion.text
          x={label.x}
          y={label.y}
          textAnchor={label.anchor}
          fontSize={label.fontSize}
          className="font-mono fill-stage-ink"
          style={{ opacity: litLabelOpacity }}
        >
          {lines}
        </motion.text>
      ) : null}
    </g>
  );
}

function Edge({ edge, index, layout, p, dim, trace }: PartProps & { edge: GraphEdge; index: number }) {
  const L = LAYOUTS[layout];
  const a = nodeById[edge.from][layout];
  const b = nodeById[edge.to][layout];
  const [e0, e1] = edgeWindow(index);
  const pathLength = useTransform(p, [e0, e1], [0, 1]);
  const shown = useTransform(p, [e0, e0 + 0.002], [0, 1]);
  const opacity = useTransform([shown, dim], ([s, d]: number[]) => s * d);
  const step = edgeLitStep[index];

  return (
    <>
      <motion.line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        className="stroke-stage-ink/[0.22]"
        strokeWidth={L.stroke}
        style={{ pathLength, opacity }}
      />
      {step ? <LitEdge step={step} layout={layout} trace={trace} /> : null}
    </>
  );
}

// The traversal: drawn in signal over the base line, in walk direction.
function LitEdge({ step, layout, trace }: { step: TraceStep; layout: LayoutKey; trace: MV }) {
  const L = LAYOUTS[layout];
  const a = nodeById[step.from][layout];
  const b = nodeById[step.to][layout];
  const [s0, s1] = step.window;
  const pathLength = useTransform(trace, [s0, s1], [0, 1], { ease: easeOut });
  const opacity = useTransform(trace, [s0, s0 + 0.01], [0, 1]);
  return (
    <motion.line
      x1={a.x}
      y1={a.y}
      x2={b.x}
      y2={b.y}
      className="stroke-signal"
      strokeWidth={L.litStroke}
      style={{ pathLength, opacity }}
    />
  );
}

function EdgeLabel({ edge, index, layout, p, dim, trace }: PartProps & { edge: GraphEdge; index: number }) {
  const g = edgeLabelGeometry(edge, layout);
  const [, e1] = edgeWindow(index);
  const step = edgeLitStep[index];
  const appear = useTransform(p, [e1 - 0.004, e1 + 0.012], [0, 1]);
  const lit = useTransform(
    trace,
    step ? [step.window[1] - 0.1, step.window[1]] : [0, 1],
    step ? [0, 1] : [0, 0]
  );
  const opacity = useTransform([appear, dim, lit], ([a, d, l]: number[]) => a * (d + (1 - d) * l));

  return (
    <motion.g style={{ opacity }}>
      {/* Knockout so the line never runs through the predicate. */}
      <rect
        x={g.box.x0}
        y={g.box.y0}
        width={g.box.x1 - g.box.x0}
        height={g.box.y1 - g.box.y0}
        className="fill-stage"
      />
      <text x={g.x} y={g.y} textAnchor="middle" fontSize={g.fontSize} className="font-mono fill-stage-muted">
        {edge.predicate}
      </text>
    </motion.g>
  );
}

// ------------------------------------------------------------------
// Chapter 3: the start of the walk
// ------------------------------------------------------------------

function SelfRing({ layout, trace }: { layout: LayoutKey; trace: MV }) {
  const L = LAYOUTS[layout];
  const me = nodeById.me[layout];
  const opacity = useTransform(trace, [TRACE.stepStart, TRACE.stepStart + TRACE.stepDur], [0, 1]);
  return (
    <motion.circle
      cx={me.x}
      cy={me.y}
      r={L.selfR + L.ringGap}
      className="fill-none stroke-signal"
      strokeWidth={L.topicStroke}
      style={{ opacity }}
    />
  );
}
