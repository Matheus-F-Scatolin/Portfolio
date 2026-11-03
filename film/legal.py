"""Chapter 02, Judicial report pipeline.

Improving card (handoff from 01) -> falls and becomes a sheet on the case pile
-> CNJ validation deals every case into passes_pipeline or one of three reject
trays -> passing cases fan out into eight LLM slots gated by a semaphore (four
lit at a time) -> analysed documents stack into a paper bar chart -> the bars
condense into the report page (handoff to 03).

Run with:
  Blender -b --factory-startup --python film/legal.py -- --out film/out/02-legal [--frames all|a:b:step] [--pct 50] [--samples 64]
"""

import math
import os
import sys

import bpy
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib  # noqa: E402

FRAMES = 200
P_CARD = (0.0, 0.0, 1.43)   # card handoff point: chapter 01 keeps the card at AXIS_Z + CARD_DZ
P_PAGE = (10.0, 0.35, 0.0)   # report page handoff point

SHEET = (0.5, 0.65, 0.006)  # a case document
PAPER = "#F4F4F2"
DIM = 0.82                  # rejected sheets are tinted to this

PILE_C = (0.0, 0.72)
N_PILE = 32
GATE_X, GATE_Y = 1.45, 0.55
PASS_TRAY = (2.8, 0.75)
REJECT_TRAYS = {"invalid_format": (2.15, -0.5), "not_in_any_customer": (2.75, -0.5), "no_decision": (3.35, -0.5)}
REJECT_N = {"invalid_format": 6, "not_in_any_customer": 5, "no_decision": 6}
REJECT_S = 0.62             # reject sheets shrink to fit the small trays

SLOT_X = 4.75
SLOT_Y = [0.5 + (i - 3.5) * 0.36 for i in range(8)]
SLOT = (0.44, 0.3, 0.22)
LANE_S = 0.36               # sheets shrink to this on the lanes
BATCHES = [[0, 2, 4, 6], [1, 3, 5, 7]]  # the semaphore admits four at a time
SEM_START = [92, 101, 110, 119]
PROC = 8                    # frames a sheet spends inside a slot

BAR_X0, BAR_DX, BAR_Y = 6.2, 0.44, 0.6
FUNNEL = (BAR_X0 - 0.5, BAR_Y - 0.1, 0.22)  # analysed documents converge here on their way to the chart
BUNDLE = (0.36, 0.46, 0.04)
BARS = [7, 11, 16, 13, 9, 18, 24, 31]   # bundles per bar
ORANGE = (7, range(17, 21))             # bar 7, bundles 17..20 are signal orange
BAR_OF_SLOT = lambda s: 7 - s  # noqa: E731

rng = np.random.default_rng(11)


# ------------------------------------------------------------------ small maths

def clamp(v, a=0.0, b=1.0):
    return min(b, max(a, v))


def ease(u):
    u = clamp(u)
    return 0.5 - 0.5 * math.cos(math.pi * u)


def ease_out(u):
    u = clamp(u)
    return 1 - (1 - u) ** 2


def lerp(a, b, u):
    return tuple(float(x) for x in np.add(np.multiply(a, 1 - u), np.multiply(b, u)))


def bez(p0, p1, p2, p3, u):
    p0, p1, p2, p3 = map(np.asarray, (p0, p1, p2, p3))
    return tuple(float(x) for x in (1 - u) ** 3 * p0 + 3 * (1 - u) ** 2 * u * p1 + 3 * (1 - u) * u ** 2 * p2 + u ** 3 * p3)


def rad(*deg):
    return tuple(math.radians(d) for d in deg)


# ------------------------------------------------------------------ keying

def pose(ob, f, loc=None, rot=None, scale=None):
    if loc is not None:
        lib.key(ob, "location", f, loc)
    if rot is not None:
        lib.key(ob, "rotation_euler", f, rot)
    if scale is not None:
        lib.key(ob, "scale", f, scale)


def show(ob, f, visible):
    lib.key(ob, "hide_render", f, not visible)


def hidden_until(ob, f):
    show(ob, f - 1, False)
    show(ob, f, True)


def gone_from(ob, f):
    show(ob, f - 1, True)
    show(ob, f, False)


# ------------------------------------------------------------------ materials

def _math(nt, op, a, b=None):
    n = nt.nodes.new("ShaderNodeMath")
    n.operation = op
    for i, v in enumerate((a, b)):
        if v is None:
            continue
        if isinstance(v, (int, float)):
            n.inputs[i].default_value = v
        else:
            nt.links.new(v, n.inputs[i])
    return n.outputs[0]


def _mix(nt, fac, a, b, blend="MIX"):
    n = nt.nodes.new("ShaderNodeMix")
    n.data_type = "RGBA"
    n.blend_type = blend
    if isinstance(fac, (int, float)):
        n.inputs["Factor"].default_value = fac
    else:
        nt.links.new(fac, n.inputs["Factor"])
    for name, v in (("A", a), ("B", b)):
        s = lib._socket(n.inputs, name, "RGBA")
        if isinstance(v, tuple):
            s.default_value = v
        else:
            nt.links.new(v, s)
    return lib._socket(n.outputs, "Result", "RGBA")


def paper(name, hx, hy, sides=False):
    """Paper with grey printed rows on its top face; tinted by the object colour.

    hx, hy: half size of the sheet in object space, so the rows fit any sheet.
    sides: thin sheet-edge lines on the sides, for bundles of many sheets.
    """
    m, nt, out = lib._new_material(name)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs[0])
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    sn = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(geo.outputs["Normal"], sn.inputs[0])
    x = _math(nt, "DIVIDE", sep.outputs["X"], hx)
    y = _math(nt, "DIVIDE", sep.outputs["Y"], hy)
    p = 0.085
    row = _math(nt, "LESS_THAN", _math(nt, "FRACT", _math(nt, "DIVIDE", y, p)), 0.34)
    in_y = _math(nt, "MULTIPLY", _math(nt, "GREATER_THAN", y, -0.82), _math(nt, "LESS_THAN", y, 0.5))
    wn = nt.nodes.new("ShaderNodeTexWhiteNoise")
    wn.noise_dimensions = "1D"
    nt.links.new(_math(nt, "FLOOR", _math(nt, "DIVIDE", y, p)), wn.inputs["W"])
    xmax = _math(nt, "SUBTRACT", 0.7, _math(nt, "MULTIPLY", _math(nt, "MAXIMUM", _math(nt, "SUBTRACT", wn.outputs["Value"], 0.55), 0.0), 2.4))
    in_x = _math(nt, "MULTIPLY", _math(nt, "GREATER_THAN", x, -0.7), _math(nt, "LESS_THAN", x, xmax))
    rows = _math(nt, "MULTIPLY", _math(nt, "MULTIPLY", row, in_y), in_x)
    head = _math(nt, "MULTIPLY", _math(nt, "MULTIPLY", _math(nt, "GREATER_THAN", y, 0.62), _math(nt, "LESS_THAN", y, 0.74)),
                 _math(nt, "MULTIPLY", _math(nt, "GREATER_THAN", x, -0.7), _math(nt, "LESS_THAN", x, 0.05)))
    top = _math(nt, "GREATER_THAN", sn.outputs["Z"], 0.5)
    mask = _math(nt, "MULTIPLY", _math(nt, "MINIMUM", _math(nt, "ADD", _math(nt, "MULTIPLY", rows, 0.55), head), 1.0), top)
    col = _mix(nt, mask, (*lib.lin(PAPER), 1), (*lib.lin("#9EA0A3"), 1))
    if sides:
        st = _math(nt, "LESS_THAN", _math(nt, "FRACT", _math(nt, "DIVIDE", sep.outputs["Z"], 0.01)), 0.3)
        side = _math(nt, "LESS_THAN", _math(nt, "ABSOLUTE", sn.outputs["Z"]), 0.5)
        col = _mix(nt, _math(nt, "MULTIPLY", st, side), col, (*lib.lin("#AEB0AD"), 1))
    info = nt.nodes.new("ShaderNodeObjectInfo")
    col = _mix(nt, 1.0, col, info.outputs["Color"], "MULTIPLY")
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Roughness"].default_value = 0.55
    nt.links.new(col, b.inputs["Base Color"])
    nt.links.new(b.outputs[0], out.inputs["Surface"])
    return m


def materials():
    return {
        "plastic": lib.principled("plastic", "#F2F2F0", rough=0.32),
        "plastic_dim": lib.principled("plastic_dim", "#C9CAC7", rough=0.45),
        "dark": lib.principled("slot_mouth", "#3A3C40", rough=0.5),
        "signal": lib.principled("signal", lib.SIGNAL, rough=0.35, emit=lib.SIGNAL, emit_strength=0.5),
        "sheet": paper("sheet", SHEET[0] / 2, SHEET[1] / 2),
        "bundle": paper("bundle", BUNDLE[0] / 2, BUNDLE[1] / 2, sides=True),
        "ink": lib.flat("ink", lib.INK),
    }


def lamp(name):
    return lib.principled(name, "#C9CAC7", rough=0.4, emit=lib.SIGNAL, emit_strength=0.0)


def lamp_key(m, f, on):
    b = m.node_tree.nodes["Principled BSDF"].inputs
    lib.key(b["Base Color"], "default_value", f, (*lib.lin(lib.SIGNAL if on else "#C9CAC7"), 1))
    lib.key(b["Emission Strength"], "default_value", f, 0.6 if on else 0.0)


# ------------------------------------------------------------------ build

def sheet(name, loc, rot, mat):
    ob = lib.box(name, SHEET, loc, mat, 0.0)
    ob.rotation_euler = rot
    return ob


def tray(name, ix, iy, xy, mat, wall=0.035, h=0.07):
    x, y = xy
    parts = [lib.box(f"{name}_base", (ix + 2 * wall, iy + 2 * wall, 0.022), (x, y, 0.011), mat, 0.008)]
    for s in (-1, 1):
        parts.append(lib.box(f"{name}_wy{s}", (ix + 2 * wall, wall, h), (x, y + s * (iy / 2 + wall / 2), h / 2), mat, 0.012))
        parts.append(lib.box(f"{name}_wx{s}", (wall, iy, h), (x + s * (ix / 2 + wall / 2), y, h / 2), mat, 0.012))
    return parts


def build_pile(M):
    """A messy heap: sheets dropped one by one onto whatever is under them."""
    placed = []
    for i in range(N_PILE):
        a, r = rng.uniform(0, 2 * math.pi), 0.34 * math.sqrt(rng.uniform(0, 1))
        cx, cy = PILE_C[0] + r * math.cos(a) * 1.25, PILE_C[1] + r * math.sin(a) * 0.8
        z = 0.004
        for (px, py, pz) in placed:
            if math.hypot(cx - px, cy - py) < 0.42:
                z = max(z, pz + 0.0085)
        placed.append((cx, cy, z))
    out = []
    for i, (cx, cy, z) in enumerate(placed):
        rot = rad(rng.uniform(-2.5, 2.5), rng.uniform(-2.5, 2.5), rng.uniform(-40, 40))
        out.append(dict(ob=sheet(f"case_{i:02d}", (cx, cy, z), rot, M["sheet"]), loc=(cx, cy, z), rot=rot))
    return out


def build(M):
    H = dict(M=M)
    card, card_m = lib.improving_card(P_CARD)
    H["card"], H["card_m"] = card, card_m
    H["pile"] = build_pile(M)
    H["pile_top"] = max(s["loc"][2] for s in H["pile"])

    # CNJ validation gate: an upright frame the cases fly through
    gate = []
    gz, gw = 0.82, 0.86
    groot = H["gate_root"] = lib.empty("gate_root")  # at the origin: scaling z raises the gate out of the ground
    for s in (-1, 1):
        gate.append(lib.box(f"gate_post{s}", (0.07, 0.07, gz), (GATE_X, GATE_Y + s * gw / 2, gz / 2), M["plastic"], 0.02, groot))
        gate.append(lib.box(f"gate_foot{s}", (0.26, 0.11, 0.035), (GATE_X, GATE_Y + s * gw / 2, 0.0175), M["plastic"], 0.012, groot))
    gate.append(lib.box("gate_top", (0.07, gw + 0.07, 0.07), (GATE_X, GATE_Y, gz), M["plastic"], 0.02, groot))
    H["gate_lamp"] = lamp("gate_lamp")
    gate.append(lib.box("gate_lamp", (0.03, 0.22, 0.03), (GATE_X - 0.035, GATE_Y, gz), H["gate_lamp"], 0.008, groot))
    H["gate"] = gate

    trays = tray("tray_pass", 0.6, 0.76, PASS_TRAY, M["plastic"])
    for k, xy in REJECT_TRAYS.items():
        trays += tray(f"tray_{k}", 0.36, 0.46, xy, M["plastic_dim"], wall=0.03, h=0.055)
    H["trays"] = trays

    # LLM slots, one lamp each; the lamps are the semaphore's permits
    slots, lamps = [], []
    for i, y in enumerate(SLOT_Y):
        slots.append(lib.box(f"slot{i}", SLOT, (SLOT_X, y, SLOT[2] / 2), M["plastic"], 0.035))
        for s in (-1, 1):
            slots.append(lib.box(f"slot{i}_mouth{s}", (0.006, 0.24, 0.045), (SLOT_X + s * (SLOT[0] / 2 + 0.002), y, 0.085), M["dark"], 0.0))
        lm = lamp(f"slot{i}_lamp")
        lamps.append(lm)
        slots.append(lib.box(f"slot{i}_lamp", (0.13, 0.06, 0.014), (SLOT_X + 0.07, y, SLOT[2] + 0.004), lm, 0.005))
    H["slots"], H["lamps"] = slots, lamps

    # paper bar chart: bundles of sheets, one mesh shared by all of them
    me = lib.box("bundle_mesh_src", BUNDLE, (0, 0, 0), None, 0.0).data
    bpy.data.objects.remove(bpy.data.objects["bundle_mesh_src"])
    bars = []
    for b, n in enumerate(BARS):
        bx = BAR_X0 + b * BAR_DX
        col = []
        for j in range(n):
            ob = lib.link(bpy.data.objects.new(f"bar{b}_{j:02d}", me))
            orange = b == ORANGE[0] and j in ORANGE[1]
            # the mesh is shared, so the material sits on the object: orange ones swap it
            if not ob.material_slots:
                ob.data.materials.append(M["bundle"])
            ob.material_slots[0].link = "OBJECT"
            ob.material_slots[0].material = M["signal"] if orange else M["bundle"]
            lib.bevel(ob, 0.004, segments=2)
            loc = (bx + rng.uniform(-0.012, 0.012), BAR_Y + rng.uniform(-0.012, 0.012), BUNDLE[2] / 2 + 0.001 + j * BUNDLE[2])
            rot = rad(0, 0, rng.uniform(-3, 3))
            ob.location, ob.rotation_euler = loc, rot
            col.append(dict(ob=ob, loc=loc, rot=rot))
        bars.append(col)
    H["bars"] = bars

    H["report"] = lib.report_page(P_PAGE)

    # ink: dashed flows drawn on as each stage starts
    dash = dict(dash=0.04, gap=0.028)
    flows = {}

    def flow(name, pts, **kw):
        mat, val = lib.reveal_ink(f"flow_{name}", lib.INK)
        ob = lib.ink_path(f"flow_{name}", pts, mat, **kw)
        flows[name] = (ob, val)

    gzc = 0.4
    flow("pile_gate", [(0.62, GATE_Y, gzc), (GATE_X - 0.12, GATE_Y, gzc)], **dash)
    flow("gate_pass", lib.bezier((GATE_X + 0.1, GATE_Y, gzc), (GATE_X + 0.55, GATE_Y, gzc), (PASS_TRAY[0] - 0.6, PASS_TRAY[1], 0.3),
                                 (PASS_TRAY[0] - 0.4, PASS_TRAY[1], 0.2)), **dash)
    for k, (x, y) in REJECT_TRAYS.items():
        flow(f"gate_{k}", lib.bezier((GATE_X + 0.1, GATE_Y - 0.1, gzc - 0.05), (GATE_X + 0.4, GATE_Y - 0.4, gzc - 0.05),
                                     (x - 0.1, y + 0.35, 0.3), (x, y + 0.08, 0.12)), **dash)
    lane_start = (PASS_TRAY[0] + 0.36, PASS_TRAY[1])
    H["lanes"] = []
    for i, y in enumerate(SLOT_Y):
        P = lib.bezier((*lane_start, 0.004), (lane_start[0] + 0.45, lane_start[1], 0.004), (SLOT_X - 1.0, y, 0.004), (SLOT_X - 0.36, y, 0.004))
        H["lanes"].append(P)
        flow(f"lane{i}", P, r=0.004)
    for s, y in enumerate(SLOT_Y):
        b = BAR_OF_SLOT(s)
        bx = BAR_X0 + b * BAR_DX
        flow(f"slot_bar{s}", lib.bezier((SLOT_X + 0.3, y, 0.09), (SLOT_X + 0.65, y, 0.09), (FUNNEL[0] - 0.35, FUNNEL[1], FUNNEL[2]), FUNNEL), **dash)
    H["flows"] = flows

    A = {}

    def anchor(name, loc, parent=None):
        A[name] = lib.empty(f"anchor:{name}", loc, parent)

    w = lib.CARD[0] / 2
    anchor("improving", (0, -0.06, 0), card)
    anchor("improving_l", (-w, -0.06, 0), card)
    anchor("improving_r", (w, -0.06, 0), card)
    anchor("case_pile", (PILE_C[0] - 0.42, PILE_C[1] - 0.15, H["pile_top"] * 0.8))
    anchor("cnj", (GATE_X, GATE_Y, gz + 0.06))
    for k, (x, y) in REJECT_TRAYS.items():
        anchor(k, (x, y - 0.26, 0.0))
    anchor("passes_pipeline", (PASS_TRAY[0], PASS_TRAY[1] + 0.2, 0.16))
    anchor("analyze", (SLOT_X, SLOT_Y[-1], SLOT[2] + 0.04))
    anchor("semaphore", (SLOT_X + 0.07, SLOT_Y[0], SLOT[2] + 0.01))
    top = max(BARS) * BUNDLE[2] + 0.1
    anchor("compile_l", (BAR_X0 - BUNDLE[0] / 2, BAR_Y, top))
    anchor("compile_r", (BAR_X0 + 7 * BAR_DX + BUNDLE[0] / 2, BAR_Y, top))
    anchor("report", (P_PAGE[0] - lib.PAGE[0] / 2 + 0.05, P_PAGE[1] + lib.PAGE[1] / 2 - 0.05, lib.PAGE[2]))
    return A, H


# ------------------------------------------------------------------ animation

CAMERA = [
    lib.handoff_key(1, "card", P_CARD),
    lib.handoff_key(3, "card", P_CARD),
    (30, (-0.6, -3.5, 2.55), (0.15, 0.55, 0.32), 42),
    (48, (0.2, -4.1, 3.0), (1.2, 0.4, 0.28), 38),
    (72, (1.2, -4.5, 3.3), (2.2, 0.3, 0.22), 37),
    (98, (2.9, -4.8, 3.7), (3.8, 0.45, 0.3), 40),
    (124, (5.1, -5.2, 3.6), (6.0, 0.55, 0.4), 38),
    (150, (6.9, -5.6, 3.3), (7.75, 0.6, 0.6), 37),
    (176, (9.3, -3.7, 3.2), (9.5, 0.4, 0.3), 43),
    lib.handoff_key(196, "page", P_PAGE),
    lib.handoff_key(FRAMES, "page", P_PAGE),
]

LABELS = [
    {"type": "card", "t": "Improving", "k": "improving", "cls": "good"},
    {"type": "point", "t": "Case pile", "k": "case_pile", "dx": -5, "dy": -9},
    {"type": "point", "t": "CNJ validation", "k": "cnj", "dx": -2, "dy": -7},
    {"type": "point", "t": "invalid_format", "k": "invalid_format", "dx": -3, "dy": 6},
    {"type": "point", "t": "not_in_any_customer", "k": "not_in_any_customer", "dx": 0, "dy": 9},
    {"type": "point", "t": "no_decision", "k": "no_decision", "dx": 3, "dy": 6},
    {"type": "point", "t": "passes_pipeline", "k": "passes_pipeline", "dx": 0, "dy": -8},
    {"type": "point", "t": "Analyze · LLM fan-out", "k": "analyze", "dx": 0, "dy": -8},
    {"type": "point", "t": "Semaphore · 4 at a time", "k": "semaphore", "dx": 6, "dy": 7},
    {"type": "span", "t": "Compile", "a": "compile_l", "b": "compile_r", "show": "compile"},
    {"type": "point", "t": "Report", "k": "report", "dx": -6, "dy": -7},
]
APPEAR = {"improving": 1, "case_pile": 28, "cnj": 40, "invalid_format": 58, "not_in_any_customer": 60, "no_decision": 62,
          "passes_pipeline": 54, "analyze": 86, "semaphore": 96, "compile": 134, "report": 182}
VANISH = {"improving": 12, "case_pile": 66, "cnj": 92, "invalid_format": 96, "not_in_any_customer": 96, "no_decision": 96,
          "passes_pipeline": 96, "analyze": 140, "semaphore": 134, "compile": 176, "report": 195}


def draw(val, f0, f1):
    lib.key(val, "default_value", f0, 0.0)
    lib.key(val, "default_value", f1, 1.0)


def animate_card(H):
    """Frames 3-28: the card tips back, falls and turns into a blank sheet on the pile."""
    card, b = H["card"], H["card_m"].node_tree.nodes["Principled BSDF"].inputs
    land = (PILE_C[0] + 0.04, PILE_C[1] + 0.02, H["pile_top"] + 0.012)
    sheet_scale = (SHEET[0] / lib.CARD[0], SHEET[2] / lib.CARD[1], SHEET[1] / lib.CARD[2])
    H["card_land"], H["card_scale"] = land, sheet_scale
    yaw = 7.0
    pose(card, 1, P_CARD, (0, 0, 0), (1, 1, 1))
    for f in range(3, 29):
        u = (f - 3) / 25
        tip = ease(u / 0.8)
        fall = ease((u - 0.08) / 0.92) ** 1.15
        sway = math.sin(math.pi * 1.6 * u) * (1 - u)
        loc = (P_CARD[0] + 0.04 * ease(u) + 0.12 * sway,
               P_CARD[1] + (land[1] - P_CARD[1]) * ease(u * 1.1),
               P_CARD[2] + (land[2] - P_CARD[2]) * fall)
        rot = rad(-90 * tip, 9 * sway, yaw * ease(u) - 10 * sway)
        s = ease((u - 0.1) / 0.62)
        pose(card, f, loc, rot, lerp((1, 1, 1), sheet_scale, s))
        c = ease((u - 0.3) / 0.22)  # brief: orange to white passes through peach
        lib.key(b["Base Color"], "default_value", f, (*lerp(lib.lin(lib.SIGNAL), lib.lin(PAPER), c), 1))
        lib.key(b["Emission Strength"], "default_value", f, 0.5 * (1 - c))
    H["card_rot"] = rad(-90, 0, yaw)


def animate_validation(H):
    """Frames 34-80: every case is dealt through the gate into a tray."""
    order = [dict(ob=H["card"], loc=H["card_land"], rot=H["card_rot"], scale=H["card_scale"], card=True)]
    order += sorted(H["pile"], key=lambda s: -s["loc"][2])
    dest = ["passes_pipeline"] * 15 + [k for k, n in REJECT_N.items() for _ in range(n)]
    rng.shuffle(dest)
    dest = ["passes_pipeline"] + dest
    counts = {k: 0 for k in ["passes_pipeline", *REJECT_TRAYS]}
    passing = []
    d0, step, dur = 34, 1.0, 12
    for k, (s, d) in enumerate(zip(order, dest)):
        ob = s["ob"]
        base_scale = s.get("scale", (1, 1, 1))
        rot0 = s["rot"]
        n = counts[d]
        counts[d] += 1
        if d == "passes_pipeline":
            tx, ty, tz0, th = PASS_TRAY[0], PASS_TRAY[1], 0.022, SHEET[2] + 0.0015
            sc = 1.0
        else:
            tx, ty = REJECT_TRAYS[d]
            tz0, th, sc = 0.022, SHEET[2] * REJECT_S + 0.0012, REJECT_S
        E = (tx + rng.uniform(-0.01, 0.01), ty + rng.uniform(-0.01, 0.01), tz0 + (n + 0.5) * th)
        yaw1 = math.radians(rng.uniform(-3, 3))
        rot1 = (rot0[0], 0.0, yaw1) if s.get("card") else (0.0, 0.0, yaw1)
        S = s["loc"]
        G = (GATE_X, GATE_Y + rng.uniform(-0.1, 0.1), 0.4)
        f0 = int(round(d0 + k * step))
        pose(ob, f0, S, rot0, base_scale)
        if not s.get("card"):
            lib.key(ob, "color", 1, (1, 1, 1, 1))
        for f in range(f0 + 1, f0 + dur + 1):
            u = ease((f - f0) / dur)
            if u < 0.5:
                p = bez(S, np.add(S, (0.1, 0, 0.42)), (G[0] - 0.45, G[1], G[2]), G, u / 0.5)
            else:
                p = bez(G, (G[0] + 0.45, G[1], G[2]), np.add(E, (0, 0, 0.38)), E, (u - 0.5) / 0.5)
            r = lerp(rot0, rot1, u)
            g = ease((u - 0.5) / 0.3)
            pose(ob, f, p, r, tuple(v * (1 + (sc - 1) * g) for v in base_scale))
            if d != "passes_pipeline":
                lib.key(ob, "color", f, (*lerp((1, 1, 1), (DIM, DIM, DIM * 0.995), g), 1))
        if d == "passes_pipeline":
            passing.append(dict(ob=ob, loc=E, rot=rot1, scale=base_scale, n=n, t=f0 + dur))
    groot = H["gate_root"]
    pose(groot, 1, None, None, (1, 1, 0.001))
    for ob in H["gate"]:
        hidden_until(ob, 23)
    for f in range(22, 33):
        pose(groot, f, None, None, (1, 1, max(ease_out((f - 22) / 10), 0.001)))
    lamp_key(H["gate_lamp"], d0 - 2, False)
    lamp_key(H["gate_lamp"], d0, True)
    lamp_key(H["gate_lamp"], d0 + len(order) * step + 4, True)
    lamp_key(H["gate_lamp"], d0 + len(order) * step + 7, False)
    fl = H["flows"]
    draw(fl["pile_gate"][1], 33, 39)
    draw(fl["gate_pass"][1], 38, 46)
    for i, k in enumerate(REJECT_TRAYS):
        draw(fl[f"gate_{k}"][1], 40 + 2 * i, 48 + 2 * i)
    return sorted(passing, key=lambda s: -s["n"])  # top of the tray first


def lane_point(P, u, z):
    P = np.asarray(P)
    seg = np.linalg.norm(np.diff(P, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    t = u * s[-1]
    return (float(np.interp(t, s, P[:, 0])), float(np.interp(t, s, P[:, 1])), z)


def animate_analyze(H, passing):
    """Frames 80-140: sheets fan out along eight lanes; the semaphore lets four slots work at once."""
    lit = {i: [] for i in range(8)}
    arrivals = {b: [] for b in range(8)}
    deps = [80 + k for k in range(8)] + [94 + k for k in range(4)] + [103 + k for k in range(4)]
    zl = 0.085
    for k, s in enumerate(passing):
        ob, base = s["ob"], s["scale"]
        b = k // 4
        slot = BATCHES[b % 2][k % 4]
        y = SLOT_Y[slot]
        P = H["lanes"][slot]
        dep = deps[k]
        a_end = dep + 4
        l_end = a_end + 9
        enter = max(l_end + 1, SEM_START[b] + (k % 4))
        inside = enter + 4
        out0 = enter + PROC
        out1 = out0 + 4
        rot0, rot1 = s["rot"], (s["rot"][0], 0.0, 0.0)
        S = s["loc"]
        L0 = (*P[0][:2], zl)
        pose(ob, dep, S, rot0, base)
        for f in range(dep + 1, a_end + 1):  # lift off the tray onto the lane
            u = ease((f - dep) / (a_end - dep))
            p = bez(S, np.add(S, (0, 0, 0.12)), np.add(L0, (-0.15, 0, 0.05)), L0, u)
            pose(ob, f, p, lerp(rot0, rot1, u), tuple(v * (1 + (LANE_S - 1) * 0.5 * u) for v in base))
        sl = tuple(v * LANE_S for v in base)
        for f in range(a_end + 1, l_end + 1):  # along the lane to the queue in front of the slot
            u = ease((f - a_end) / (l_end - a_end))
            sc = 1 + (LANE_S - 1) * (0.5 + 0.5 * u)
            pose(ob, f, lane_point(P, u, zl), rot1, tuple(v * sc for v in base))
        Q = (*P[-1][:2], zl)
        pose(ob, enter, Q, rot1, sl)
        pose(ob, inside, (SLOT_X - 0.04, y, zl), rot1, sl)
        show(ob, 1, True)
        show(ob, inside, False)
        show(ob, out0, True)
        pose(ob, out0, (SLOT_X + 0.02, y, zl), rot1, sl)
        O = (SLOT_X + 0.42, y, zl)
        for f in range(out0 + 1, out1 + 1):
            u = ease_out((f - out0) / (out1 - out0))
            pose(ob, f, lerp((SLOT_X + 0.02, y, zl), O, u), rot1, sl)
        bar = BAR_OF_SLOT(slot)
        bx = BAR_X0 + bar * BAR_DX
        T = (bx, BAR_Y, 0.3)
        fly1 = out1 + 12
        for f in range(out1 + 1, fly1 + 1):  # along its dashed line into the funnel, then a hop onto its bar
            u = ease((f - out1) / (fly1 - out1))
            if u < 0.5:
                p = bez(O, (O[0] + 0.25, O[1], zl), (FUNNEL[0] - 0.35, FUNNEL[1], FUNNEL[2]), FUNNEL, u / 0.5)
            else:
                p = bez(FUNNEL, (FUNNEL[0] + 0.35, FUNNEL[1], FUNNEL[2] + 0.05), (T[0], T[1], T[2] + 0.4), T, (u - 0.5) / 0.5)
            pose(ob, f, p, rot1, tuple(v * (1 - 0.9 * ease((u - 0.5) / 0.5)) for v in sl))
        show(ob, fly1, False)
        lit[slot].append((enter, out0))
        arrivals[bar].append(fly1)
    for i, m in enumerate(H["lamps"]):
        lamp_key(m, 1, False)
        for a, b in lit[i]:
            lamp_key(m, a, False)
            lamp_key(m, a + 2, True)
            lamp_key(m, b, True)
            lamp_key(m, b + 1, False)
    fl = H["flows"]
    for i in range(8):
        draw(fl[f"lane{i}"][1], 76 + i, 84 + i)
        draw(fl[f"slot_bar{i}"][1], 96 + i, 104 + i)
    return arrivals


def animate_compile(H, arrivals):
    """Bundles drop onto each bar as its documents arrive; the chart is complete by frame 154."""
    for b, col in enumerate(H["bars"]):
        t0 = min(arrivals[b]) - 2
        t1 = min(max(arrivals[b]) + 12, 154)
        n = len(col)
        for j, s in enumerate(col):
            ob, loc, rot = s["ob"], s["loc"], s["rot"]
            f0 = int(round(t0 + (t1 - t0) * j / max(n - 1, 1)))
            hidden_until(ob, f0)
            for f in range(f0, f0 + 5):
                u = ease_out((f - f0) / 4)
                pose(ob, f, (loc[0], loc[1], loc[2] + 0.14 * (1 - u)), rot)


def animate_synthesize(H):
    """Frames 158-188: the page grows in place, then the bars slide onto it and squash into it."""
    rep = H["report"]["root"]
    px, py = P_PAGE[0], P_PAGE[1]
    hidden_until(rep, 158)
    for f in range(158, 171):
        s = max(ease((f - 158) / 12), 0.001)
        pose(rep, f, (px * (1 - s), py * (1 - s), 0), None, (s, s, s))
    final = (1.0, 1.0, 0.04)
    for b, col in enumerate(H["bars"]):
        c0 = int(round(164 + (7 - b) * 1.6))
        dur = 12
        for j, s in enumerate(col):
            ob, loc, rot = s["ob"], s["loc"], s["rot"]
            pose(ob, c0, loc, rot, (1, 1, 1))
            for f in range(c0 + 1, c0 + dur + 1):
                u = ease((f - c0) / dur)
                g = ease((f - c0 - dur * 0.35) / (dur * 0.65))
                x = loc[0] + (px - loc[0]) * u
                y = loc[1] + (py - loc[1]) * u
                z = 0.006 + (loc[2] - 0.006) * (1 - u) ** 1.3
                pose(ob, f, (x, y, z), lerp(rot, (0, 0, 0), u), lerp((1, 1, 1), final, g))
            show(ob, c0 + dur + 1, False)


def cleanup(H, passing):
    """Everything upstream leaves the render once the camera has moved past it."""
    obs = H["gate"] + H["trays"] + H["slots"] + [ob for ob, _ in H["flows"].values()]
    keep = {s["ob"].name for s in passing}
    obs += [s["ob"] for s in H["pile"] if s["ob"].name not in keep]  # rejects stay in their trays
    for ob in obs:
        gone_from(ob, 178)


def main():
    args = lib.film_args(FRAMES)
    scene = lib.reset()
    lib.studio(scene, args.samples, args.pct)
    M = materials()
    A, H = build(M)
    cam = lib.film_camera(scene, CAMERA)
    bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"
    animate_card(H)
    passing = animate_validation(H)
    arrivals = animate_analyze(H, passing)
    animate_compile(H, arrivals)
    animate_synthesize(H)
    cleanup(H, passing)
    lib.render_film(scene, cam, A, FRAMES, args, LABELS, APPEAR, VANISH)


main()
