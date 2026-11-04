"""Chapter 04, STELLAR: a modular LLM customer-support pipeline.

Opens on the KernelNet graph from chapter 03 (lib.network at the "network"
handoff pose). The edges retract, the 13 nodes travel into a left-to-right
tree and morph into module blocks (rounded boxes; diamonds for the two
decision modules), the tree's ink arrows draw on, then one message travels a
single path through it, lighting each module and edge it passes in signal
orange. Run with:
  Blender -b --factory-startup --python film/stellar.py -- --out DIR [--frames all|between|a:b:step] [--pct 50] [--samples 64]
"""

import math
import os
import sys

import bpy
import numpy as np
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib  # noqa: E402

FRAMES = 160
P = (0.0, 0.0, lib.NODE_R)  # handoff point: the network rests around it
WHITE, DIM = "#F2F2F0", "#C9CAC7"
LIFT = 0.002  # blocks float a hair above the shadow catcher so the faces never coincide

# block shapes: half extents (x, y, z) and corner radius
BOX = (0.575, 0.30, 0.14, 0.06)
TERM = (0.575, 0.25, 0.11, 0.06)
DIAMOND = (0.74, 0.44, 0.14, 0.05)  # half diagonals (x, y), half height, radius
EDGE_Z = 0.14  # ink arrows and the message ride at mid-block height
GAP = 0.05  # arrow ends stop this far from a block

# ------------------------------------------------------------------ the tree
COLS = [-4.2, -2.1, 0.0, 2.1, 4.2]
YA, YB, YC = 1.3, 0.0, -2.2
YE, YF = YA + 1.25, YB - 1.12  # the two fail sinks, above branch a and below branch b

MODULES = {
    # key: (label, kind, x, y)
    "m1": ("Classification", "box", COLS[0], YB),
    "rag": ("RAG", "box", COLS[1], YA),
    "direct": ("Direct info", "box", COLS[1], YB),
    "sentiment": ("Sentiment", "box", COLS[1], YC),
    "comp_a": ("Compliance", "diamond", COLS[2], YA),
    "comp_b": ("Compliance", "diamond", COLS[2], YB),
    "human": ("Human escalation", "box", COLS[2], YC),
    "ver_a": ("Verification", "diamond", COLS[3], YA),
    "ver_b": ("Verification", "diamond", COLS[3], YB),
    "kb": ("KB improvement", "box", COLS[3], YC),
    "feedback": ("Feedback", "box", COLS[4], YB),
    "esc_path": ("Escalation path", "term", (COLS[2] + COLS[3]) / 2, YE),
    "faq_path": ("FAQ path", "term", (COLS[2] + COLS[3]) / 2, YF),
}
LAYER = {"m1": 0, "rag": 1, "direct": 1, "sentiment": 1, "comp_a": 2, "comp_b": 2, "human": 2,
         "esc_path": 3, "faq_path": 3, "ver_a": 3, "ver_b": 3, "kb": 3, "feedback": 4}
ROUTE = ["m1", "rag", "comp_a", "ver_a", "feedback"]  # the one path the message takes


def shape(kind):
    return {"box": BOX, "term": TERM, "diamond": DIAMOND}[kind]


def half_x(k):
    s = shape(MODULES[k][1])
    return s[0]


def half_z(k):
    return shape(MODULES[k][1])[2]


def xy(k):
    return np.array(MODULES[k][2:4], float)


# ------------------------------------------------------------------ block meshes
# Each node keeps one vertex set: a sphere (the KernelNet node) as the basis and
# the module block as a shape key, made by projecting the sphere's vertices
# radially onto the block's signed distance field.

def sd_box(p, hx, hy, hz, r):
    q = np.abs(p) - np.array([hx - r, hy - r, hz - r])
    return np.linalg.norm(np.maximum(q, 0), axis=1) + np.minimum(q.max(axis=1), 0) - r


def sd_rhombus_prism(p, a, b, hz, r):
    s = 1 - r * math.hypot(a, b) / (a * b)
    bx, by = a * s, b * s
    px, py = np.abs(p[:, 0]), np.abs(p[:, 1])
    h = np.clip(((bx - 2 * px) * bx - (by - 2 * py) * by) / (bx * bx + by * by), -1, 1)
    dx, dy = px - 0.5 * bx * (1 - h), py - 0.5 * by * (1 + h)
    d2 = np.hypot(dx, dy) * np.sign(px * by + py * bx - bx * by)
    w = np.stack([d2, np.abs(p[:, 2]) - (hz - r)], 1)
    return np.minimum(w.max(axis=1), 0) + np.linalg.norm(np.maximum(w, 0), axis=1) - r


def project_onto(dirs, sdf):
    lo, hi = np.zeros(len(dirs)), np.full(len(dirs), 3.0)
    for _ in range(40):
        mid = (lo + hi) / 2
        inside = sdf(dirs * mid[:, None]) < 0
        lo, hi = np.where(inside, mid, lo), np.where(inside, hi, mid)
    return dirs * ((lo + hi) / 2)[:, None]


def morph_mesh(name, kind):
    me, d = lib.ico(name, 6)
    lib.set_co(me, d * lib.NODE_R)
    s = shape(kind)
    if kind == "diamond":
        target = project_onto(d, lambda p: sd_rhombus_prism(p, *s))
    else:
        target = project_onto(d, lambda p: sd_box(p, *s))
    return me, target


# ------------------------------------------------------------------ materials

def materials():
    M = {
        "plastic": lib.principled("plastic", WHITE, rough=0.32),
        "token": lib.principled("token", lib.SIGNAL, rough=0.35, emit=lib.SIGNAL, emit_strength=0.6),
        "term": lib.principled("term", WHITE, rough=0.32),
    }
    for k in ROUTE:  # every module on the route lights on its own
        M[k] = lib.principled(f"mod_{k}", WHITE, rough=0.32, emit=lib.SIGNAL, emit_strength=0.0)
    # the driver starts orange exactly as chapter 03 left it and cools as it becomes the root
    b = M["m1"].node_tree.nodes["Principled BSDF"].inputs
    b["Base Color"].default_value = (*lib.lin(lib.SIGNAL), 1)
    b["Roughness"].default_value = 0.35
    b["Emission Strength"].default_value = 0.5
    return M


def bsdf(m):
    return m.node_tree.nodes["Principled BSDF"].inputs


# ------------------------------------------------------------------ assignment

def assign(start):
    """Node -> module slot. The driver becomes the root; the rest is a squared-
    distance optimal transport (pair swaps to a local optimum), so the straight
    paths the nodes travel do not cross."""
    tick = [t for t in lib.NETWORK if t != lib.DRIVER]
    slots = [k for k in MODULES if k != "m1"]
    cost = lambda t, k: float(np.sum((np.array(start[t][:2]) - xy(k)) ** 2))  # noqa: E731
    order = sorted(tick, key=lambda t: start[t][0])
    sl = sorted(slots, key=lambda k: (xy(k)[0], xy(k)[1]))
    a = dict(zip(order, sl))
    improved = True
    while improved:
        improved = False
        for i in range(len(tick)):
            for j in range(i + 1, len(tick)):
                t, u = tick[i], tick[j]
                if cost(t, a[u]) + cost(u, a[t]) < cost(t, a[t]) + cost(u, a[u]) - 1e-9:
                    a[t], a[u] = a[u], a[t]
                    improved = True
    a[lib.DRIVER] = "m1"
    return a


# ------------------------------------------------------------------ edges

def port(k, side, dy=0.0):
    x, y = xy(k)
    kind = MODULES[k][1]
    hx, hy = shape(kind)[:2]
    if side == "r":
        return np.array([x + hx + GAP, y + dy, EDGE_Z])
    if side == "l":
        return np.array([x - hx - GAP, y + dy, EDGE_Z])
    if side == "t":
        return np.array([x, y + hy + GAP, EDGE_Z])
    return np.array([x, y - hy - GAP, EDGE_Z])


def s_curve(p0, p3, n=96):
    k = 0.45 * abs(p3[0] - p0[0])
    if abs(p3[1] - p0[1]) < 1e-6:
        return np.array([p0, p3])
    return lib.bezier(p0, p0 + (k, 0, 0), p3 - (k, 0, 0), p3, n)


def elbow(p0, p3, n=96):
    """Leaves vertically (out of a diamond's top or bottom corner), arrives horizontally."""
    p1 = np.array([p0[0], p0[1] + 0.6 * (p3[1] - p0[1]), p0[2]])
    p2 = np.array([p0[0] + 0.45 * (p3[0] - p0[0]), p3[1], p3[2]])
    return lib.bezier(p0, p1, p2, p3, n)


ENTRY_X = COLS[0] - 1.45

EDGES = [
    # name, points, kind
    ("entry", lambda: np.array([(ENTRY_X, YB, EDGE_Z), port("m1", "l")]), "plain"),
    ("m1_rag", lambda: s_curve(port("m1", "r"), port("rag", "l")), "plain"),
    ("m1_direct", lambda: s_curve(port("m1", "r"), port("direct", "l")), "plain"),
    ("m1_sentiment", lambda: s_curve(port("m1", "r"), port("sentiment", "l")), "plain"),
    ("rag_comp_a", lambda: s_curve(port("rag", "r"), port("comp_a", "l")), "plain"),
    ("comp_a_ver_a", lambda: s_curve(port("comp_a", "r"), port("ver_a", "l")), "pass"),
    ("comp_a_esc", lambda: elbow(port("comp_a", "t"), port("esc_path", "l")), "fail"),
    ("ver_a_feedback", lambda: s_curve(port("ver_a", "r"), port("feedback", "l", 0.14)), "pass"),
    ("ver_a_esc", lambda: elbow(port("ver_a", "t"), port("esc_path", "r")), "fail"),
    ("direct_comp_b", lambda: s_curve(port("direct", "r"), port("comp_b", "l")), "plain"),
    ("comp_b_ver_b", lambda: s_curve(port("comp_b", "r"), port("ver_b", "l")), "pass"),
    ("comp_b_faq", lambda: elbow(port("comp_b", "b"), port("faq_path", "l")), "fail"),
    ("ver_b_feedback", lambda: s_curve(port("ver_b", "r"), port("feedback", "l")), "pass"),
    ("ver_b_faq", lambda: elbow(port("ver_b", "b"), port("faq_path", "r")), "fail"),
    ("sentiment_human", lambda: s_curve(port("sentiment", "r"), port("human", "l")), "plain"),
    ("human_kb", lambda: s_curve(port("human", "r"), port("kb", "l")), "plain"),
    ("kb_feedback", lambda: s_curve(port("kb", "r"), port("feedback", "l", -0.14)), "plain"),
]
# frame each edge starts drawing on (by layer, after its source block has settled)
EDGE_DRAW = {"m1_rag": 50, "m1_direct": 50, "m1_sentiment": 50,
             "rag_comp_a": 55, "direct_comp_b": 55, "sentiment_human": 55,
             "comp_a_ver_a": 60, "comp_a_esc": 60, "comp_b_ver_b": 60, "comp_b_faq": 60, "human_kb": 60,
             "ver_a_feedback": 65, "ver_a_esc": 65, "ver_b_feedback": 65, "ver_b_faq": 65, "kb_feedback": 65,
             "entry": 64}
LIT_EDGES = ["entry", "m1_rag", "rag_comp_a", "comp_a_ver_a", "ver_a_feedback"]
INK_R = 0.0075
DASH = dict(dash=0.075, gap=0.05)

# pass / fail tags: (edge, sample t along the edge, xy offset)
TAGS = {
    "pass_comp_a": ("pass", "comp_a_ver_a", 0.5, (0, 0.17)),
    "fail_comp_a": ("fail", "comp_a_esc", 0.42, (-0.26, 0.0)),
    "pass_ver_a": ("pass", "ver_a_feedback", 0.22, (0.0, 0.17)),
    "fail_ver_a": ("fail", "ver_a_esc", 0.42, (0.26, 0.0)),
    "pass_comp_b": ("pass", "comp_b_ver_b", 0.5, (0, 0.17)),
    "fail_comp_b": ("fail", "comp_b_faq", 0.42, (-0.26, 0.0)),
    "pass_ver_b": ("pass", "ver_b_feedback", 0.5, (0.0, 0.17)),
    "fail_ver_b": ("fail", "ver_b_faq", 0.42, (0.26, 0.0)),
}


def sample(pts, t):
    pts = np.asarray(pts, float)
    seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    return np.array([np.interp(t * s[-1], s, pts[:, i]) for i in range(3)])


# ------------------------------------------------------------------ the message

def capsule(name, mat, length=0.2, r=0.065):
    prof = []
    for i in range(13):
        a = math.pi - math.pi / 2 * i / 12
        prof.append((-length / 2 + r * math.cos(a), max(r * math.sin(a), 1e-4)))
    for i in range(13):
        a = math.pi / 2 - math.pi / 2 * i / 12
        prof.append((length / 2 + r * math.cos(a), max(r * math.sin(a), 1e-4)))
    return lib.lathe(name, prof, mat, steps=48)


# ------------------------------------------------------------------ build

def build():
    M = materials()
    net = lib.network(P)
    start = {t: tuple(net["pos"][t]) for t in lib.NETWORK}
    slot = assign(start)

    blocks = {}
    for t, node in net["nodes"].items():
        k = slot[t]
        kind = MODULES[k][1]
        me, target = morph_mesh(f"block_{k}", kind)
        node.data = me
        mat = M[k] if k in M else (M["term"] if kind == "term" else M["plastic"])
        me.materials.append(mat)
        node.shape_key_add(name="Basis")
        sk = node.shape_key_add(name="block")
        sk.data.foreach_set("co", target.astype(np.float32).ravel())
        blocks[k] = dict(ob=node, sk=sk, start=np.array(start[t]), ticker=t)

    # network edges get a draw-on material so they can retract into their source node
    retract = []
    for (a, b, w), ob in zip(lib.NETWORK_EDGES, net["edges"].values()):
        mat, val = lib.reveal_ink(f"net_{a}_{b}", lib.INK)
        ob.data.materials[0] = mat
        retract.append((val, w))

    edges, lit = {}, {}
    for name, fn, kind in EDGES:
        pts = fn()
        mat, val = lib.reveal_ink(f"edge_{name}", lib.INK)
        kw = DASH if kind == "fail" else {}
        lib.ink_path(f"edge_{name}", pts, mat, r=INK_R, **kw)
        edges[name] = dict(pts=pts, val=val)
        if name in LIT_EDGES:
            mat, val = lib.reveal_ink(f"lit_{name}", lib.SIGNAL, 1.2)
            lib.ink_path(f"lit_{name}", pts, mat, r=INK_R * 1.6)
            lit[name] = val

    token = capsule("message", M["token"])

    A = {}

    def anchor(name, loc, parent=None):
        A[name] = lib.empty(f"anchor:{name}", tuple(float(v) for v in loc), parent)

    for t, node in net["nodes"].items():
        anchor("node_" + t, (0, 0, lib.NODE_R + 0.14), node)
    for k, (label, kind, x, y) in MODULES.items():
        top = 2 * half_z(k) + LIFT + 0.002
        hx = half_x(k) if kind != "diamond" else half_x(k) * 0.92
        for suf in ("", "_lit") if k in ROUTE else ("",):
            anchor(k + suf, (x, y, top))
            anchor(k + suf + "_l", (x - hx, y, top))
            anchor(k + suf + "_r", (x + hx, y, top))
    for key_, (_, e, t, off) in TAGS.items():
        p = sample(edges[e]["pts"], t)
        anchor(key_, (p[0] + off[0], p[1] + off[1], EDGE_Z))
    anchor("message", (0, 0, 0.09), token)

    return A, dict(M=M, net=net, blocks=blocks, retract=retract, edges=edges, lit=lit, token=token)


# ------------------------------------------------------------------ animation

def smooth(u):
    u = min(1.0, max(0.0, u))
    return u * u * (3 - 2 * u)


def smoother(u):
    u = min(1.0, max(0.0, u))
    return u * u * u * (u * (6 * u - 15) + 10)


def rgba(hex_):
    return (*lib.lin(hex_), 1)


def light(m, f0, f1, base_from=WHITE):
    b = bsdf(m)
    lib.key(b["Base Color"], "default_value", f0, rgba(base_from))
    lib.key(b["Base Color"], "default_value", f1, rgba(lib.SIGNAL))
    lib.key(b["Emission Strength"], "default_value", f0, 0.0)
    lib.key(b["Emission Strength"], "default_value", f1, 0.5)


def linear(owner):
    """Per-frame keys: make them linear so the value at each frame is exact."""
    ad = getattr(owner, "animation_data", None)
    if not ad or not ad.action:
        return
    try:
        curves = ad.action.fcurves
    except AttributeError:  # layered actions (Blender 4.4+)
        curves = [fc for layer in ad.action.layers for strip in layer.strips
                  for cb in strip.channelbags for fc in cb.fcurves]
    for fc in curves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


TRAVEL = (16, 50)  # nodes travel to their slot
DRIVER_TRAVEL = (8, 36)  # the driver leads, out of the way before the others close in
DRIVER_BOW = np.array([0.0, -0.2])
MORPH = (22, 52)  # spheres turn into blocks
SETTLE = 52

# the message: one hop per module, easing into each block's centre (hidden inside it)
HOPS = [(72, 84), (84, 96), (96, 107), (107, 118), (118, 132)]


def route_points(H):
    """Polyline pieces for each hop: (points, [(edge name, s0, s1)]) in arc length."""
    E = H["edges"]
    hops = []
    prev = None
    for i, k in enumerate(ROUTE):
        c = np.array([*xy(k), EDGE_Z])
        e = LIT_EDGES[i]
        ep = np.asarray(E[e]["pts"], float)
        head = [prev] if prev is not None else []
        pts = np.array(head + list(ep) + [c])
        seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
        s = np.concatenate([[0], np.cumsum(seg)])
        s0 = s[len(head)]
        s1 = s[len(head) + len(ep) - 1]
        hops.append((pts, s, e, s0, s1))
        prev = c
    return hops


def animate(scene, H):
    blocks, M = H["blocks"], H["M"]

    # 1-3 hold the seam; edges retract into their source nodes, the driver's
    # strong ones first since the driver is the first to move
    for val, w in H["retract"]:
        f0 = 4 + round((1 - w) / 0.8 * 5)
        lib.key(val, "default_value", f0, 1.01)
        lib.key(val, "default_value", f0 + 7, 0.0)

    # nodes travel to their slots and morph into blocks; every node keeps the
    # same timing so the optimal-transport paths stay apart
    for k, b in blocks.items():
        ob, sk = b["ob"], b["sk"]
        end = xy(k)
        hz = half_z(k)
        tr = DRIVER_TRAVEL if b["ticker"] == lib.DRIVER else TRAVEL
        for f in range(tr[0] - 1, SETTLE + 2):
            u = smoother((f - tr[0]) / (tr[1] - tr[0]))
            v = smooth((f - MORPH[0]) / (MORPH[1] - MORPH[0]))
            p = b["start"][:2] * (1 - u) + end * u
            if b["ticker"] == lib.DRIVER:  # bow south, clear of the node heading for Direct info
                p = p + DRIVER_BOW * math.sin(math.pi * u)
            z = lib.NODE_R * (1 - v) + (hz + LIFT) * v
            lib.key(ob, "location", f, (float(p[0]), float(p[1]), float(z)))
            lib.key(sk, "value", f, float(v))
        linear(ob)
        linear(ob.data.shape_keys)

    # the driver cools to white as it becomes the root
    b = bsdf(M["m1"])
    lib.key(b["Base Color"], "default_value", 16, rgba(lib.SIGNAL))
    lib.key(b["Base Color"], "default_value", 36, rgba(WHITE))
    lib.key(b["Emission Strength"], "default_value", 16, 0.5)
    lib.key(b["Emission Strength"], "default_value", 36, 0.0)
    lib.key(b["Roughness"], "default_value", 16, 0.35)
    lib.key(b["Roughness"], "default_value", 36, 0.32)
    # the fail sinks settle to a dimmer grey: they are where a message leaves the flow
    b = bsdf(M["term"])
    lib.key(b["Base Color"], "default_value", 30, rgba(WHITE))
    lib.key(b["Base Color"], "default_value", 50, rgba(DIM))
    lib.key(b["Roughness"], "default_value", 50, 0.45)

    # the tree's arrows draw on, layer by layer
    for name, e in H["edges"].items():
        f0 = EDGE_DRAW[name]
        lib.key(e["val"], "default_value", f0, 0.0)
        lib.key(e["val"], "default_value", f0 + 7, 1.0)
    for val in H["lit"].values():
        lib.key(val, "default_value", 1, 0.0)

    # the message
    tok = H["token"]
    hops = route_points(H)
    lit_at = {}
    for f in range(HOPS[0][0] - 3, FRAMES + 1):
        # which hop, and how far along it
        i = next((j for j, (a, b_) in enumerate(HOPS) if f < b_), len(HOPS) - 1)
        a, b_ = HOPS[i]
        u = smooth((f - a) / (b_ - a))
        pts, s, e, s0, s1 = hops[i]
        q = sample(pts, u)
        q2 = sample(pts, min(1.0, u + 0.01)) if u < 0.99 else q + (sample(pts, 1.0) - sample(pts, 0.98))
        d = q2 - q
        yaw = math.atan2(d[1], d[0]) if np.linalg.norm(d[:2]) > 1e-6 else 0.0
        lib.key(tok, "location", f, tuple(float(v) for v in q))
        lib.key(tok, "rotation_euler", f, (0.0, 0.0, yaw))
        sc = smooth((f - (HOPS[0][0] - 3)) / 5)
        sc = max(sc, 1e-3)
        lib.key(tok, "scale", f, (sc, sc, sc))
        # orange follows the token along each lit edge
        for j, (_, s_, e_, a0, a1) in enumerate(hops):
            if j < i:
                v = 1.0
            elif j > i:
                v = 0.0
            else:
                v = min(1.0, max(0.0, (u * s_[-1] - a0) / (a1 - a0)))
            lib.key(H["lit"][e_], "default_value", f, float(v))
    linear(tok)
    for e_ in LIT_EDGES:
        # the lit overlay's keys live on the material's node tree
        linear(bpy.data.materials[f"lit_{e_}"].node_tree)

    for i, k in enumerate(ROUTE):
        f1 = HOPS[i][1]
        lit_at[k] = f1 - 2
        if k == "m1":
            light(M[k], f1 - 4, f1)
        else:
            light(M[k], f1 - 4, f1)
    return lit_at


# ------------------------------------------------------------------ camera

def cam_key(f, target, off, lens):
    t = np.array(target, float)
    return (f, tuple(float(v) for v in t + off), tuple(float(v) for v in t), lens)


CAMERA = [
    lib.handoff_key(1, "network", P),
    lib.handoff_key(3, "network", P),
    cam_key(32, (-0.6, -0.05, 0.1), (-0.8, -8.0, 9.6), 36),
    cam_key(60, (-0.2, -0.1, 0.1), (-1.0, -8.6, 10.6), 38),
    cam_key(148, (0.0, -0.15, 0.1), (0.35, -8.4, 10.8), 39),
    cam_key(FRAMES, (0.0, -0.15, 0.1), (0.35, -8.4, 10.8), 39),
]


def fill(scene):
    """A soft fill from the right that fades in after the seam: the tree is wider
    than the network and its right end falls out of the key light."""
    ld = bpy.data.lights.new("fill", "AREA")
    ld.shape, ld.size = "DISK", 10
    ob = lib.link(bpy.data.objects.new("fill", ld), bpy.data.objects["cam_target"])
    off = np.array(FILL_OFFSET)
    ob.location = tuple(off)
    ob.rotation_euler = Vector(tuple(-off)).to_track_quat("-Z", "Y").to_euler()
    ob.visible_glossy = False
    lib.key(ld, "energy", 6, 0.0)
    lib.key(ld, "energy", 44, FILL_ENERGY)


FILL_OFFSET = (5.5, -3.0, 7.0)
FILL_ENERGY = 120


# ------------------------------------------------------------------ labels

def labels_and_timing(lit_at):
    L, appear, vanish = [], {}, {}
    for t in lib.NETWORK:
        L.append({"type": "tag", "t": t, "k": "node_" + t})
        appear["node_" + t] = 1
        vanish["node_" + t] = 14
    for k, (label, kind, *_xy) in MODULES.items():
        L.append({"type": "card", "t": label, "k": k, "cls": "bad"})
        appear[k] = SETTLE - 4 + 2 * LAYER[k]
        if k in ROUTE:
            L.append({"type": "card", "t": label, "k": k + "_lit", "cls": "good"})
            appear[k + "_lit"] = lit_at[k]
            vanish[k] = lit_at[k] + 5
    for key_, (t, e, *_r) in TAGS.items():
        L.append({"type": "tag", "t": t, "k": key_})
        appear[key_] = EDGE_DRAW[e] + 5
    L.append({"type": "point", "t": "Message", "k": "message", "dx": -2.5, "dy": -6})
    appear["message"] = HOPS[0][0]
    vanish["message"] = HOPS[-1][1] - 2
    return L, appear, vanish


def main():
    args = lib.film_args(FRAMES)
    scene = lib.reset()
    lib.studio(scene, args.samples, args.pct)
    A, H = build()
    lit_at = animate(scene, H)
    cam = lib.film_camera(scene, CAMERA)
    fill(scene)
    labels, appear, vanish = labels_and_timing(lit_at)
    lib.render_film(scene, cam, A, FRAMES, args, labels, appear, vanish)


main()
