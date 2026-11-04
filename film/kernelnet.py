"""Chapter 03, KernelNet.

report page -> its two printed price curves (ITUB4, BBDC4) peel off and draw a
big upright chart -> each curve collapses into a node: ITUB4 Granger-causes
BBDC4 -> the edge grows into the 13-stock kernel Granger network -> the driver
(ITUB4, eigenvector centrality) rises, its followers lag, then follow: short
the driver, long the followers -> everything settles; the network rests alone.

Opens on lib.report_page at the "page" handoff and ends on lib.network at the
"network" handoff. Run with:
  Blender -b --factory-startup --python film/kernelnet.py -- --out film/out/03-kernelnet [--frames all|between|a:b:step] [--pct 50] [--samples 64]
"""

import math
import os
import sys

import bpy
import numpy as np
from bpy_extras import anim_utils

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib  # noqa: E402

FRAMES = 160
PAGE_PT = (0.0, 0.0, 0.0)                  # report page handoff point
NET_PT = (-0.575, 0.6, lib.NODE_R)         # network handoff point (ITUB4/BBDC4 pair centred on x = 0)

# The big chart stands upright facing the camera, behind the page.
PLOT_X0, PLOT_W = -1.3, 2.6
PLOT_Z0, PLOT_H = 0.26, 1.08
PLOT_Y = {"ITUB4": 0.92, "BBDC4": 0.98}    # the driver a touch in front
AXIS_Y = 0.95
AX0 = (PLOT_X0 - 0.12, AXIS_Y, PLOT_Z0 - 0.1)   # axes origin
R_PAGE, R_BIG = 0.0035, 0.0145
N_SAMPLES, SIDES = 320, 10

FOLLOWERS = [b for a, b, _ in lib.NETWORK_EDGES if a == lib.DRIVER]
RISE = 0.58

# beats (frames)
PEEL = (4, 22, 16)           # first point leaves at 4, last at 4 + 22, each takes 16 frames
COLLAPSE = (54, 68)
GRANGER = (70, 80)
TRADE_UP = (121, 130)       # driver rises
FOLLOW_UP = (134, 144)      # followers catch up
SETTLE = (146, 155)         # everything back to rest


# ------------------------------------------------------------------ small helpers

def smooth(x):
    x = np.clip(x, 0.0, 1.0)
    return x * x * x * (x * (6 * x - 15) + 10)


def ramp(f, a, b):
    return float(smooth((f - a) / (b - a)))


def catmull(P, n):
    """Catmull-Rom resample of a polyline to n points (passes through every input point)."""
    P = np.asarray(P, float)
    m = len(P)
    Q = np.vstack([2 * P[0] - P[1], P, 2 * P[-1] - P[-2]])
    u = np.linspace(0, m - 1, n)
    i = np.minimum(u.astype(int), m - 2)
    t = (u - i)[:, None]
    p0, p1, p2, p3 = Q[i], Q[i + 1], Q[i + 2], Q[i + 3]
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t ** 2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)


def tube_faces(n, sides):
    F = []
    for i in range(n - 1):
        for k in range(sides):
            a, b = i * sides + k, i * sides + (k + 1) % sides
            F.append((a, b, b + sides, a + sides))
    F.append(tuple(range(sides))[::-1])
    F.append(tuple((n - 1) * sides + k for k in range(sides)))
    return F


def tube_verts(C, R, sides=SIDES):
    """Ring vertices around centreline C (n,3) with radii R (n), rotation-minimising frames."""
    n = len(C)
    T = np.gradient(C, axis=0)
    L = np.linalg.norm(T, axis=1)
    for i in range(n):  # degenerate stretches borrow the neighbour's tangent
        if L[i] < 1e-9:
            T[i] = T[i - 1] if i else np.array([1.0, 0, 0])
            L[i] = np.linalg.norm(T[i]) or 1.0
    T = T / L[:, None]
    U = np.empty_like(C)
    a = np.array([0, 0, 1.0]) if abs(T[0, 2]) < 0.9 else np.array([0, 1.0, 0])
    u = np.cross(T[0], a)
    U[0] = u / np.linalg.norm(u)
    for i in range(1, n):
        u = U[i - 1] - np.dot(U[i - 1], T[i]) * T[i]
        nu = np.linalg.norm(u)
        U[i] = u / nu if nu > 1e-9 else U[i - 1]
    V = np.cross(T, U)
    ang = 2 * np.pi * np.arange(sides) / sides
    ring = np.cos(ang)[None, :, None] * U[:, None, :] + np.sin(ang)[None, :, None] * V[:, None, :]
    return (C[:, None, :] + R[:, None, None] * ring).reshape(-1, 3)


def fcurves(id_):
    ad = id_.animation_data
    return anim_utils.action_get_channelbag_for_slot(ad.action, ad.action_slot).fcurves


def flat_holds(id_, frames):
    """Horizontal handles on the hold keys, so a held pose is exactly still."""
    for fc in fcurves(id_):
        for kp in fc.keyframe_points:
            if round(kp.co.x) in frames:
                kp.handle_left_type = kp.handle_right_type = "FREE"
                kp.handle_left.y = kp.handle_right.y = kp.co.y
        fc.update()


def fade_material(mat):
    """Insert a transparent mix in front of the material output; returns the factor socket."""
    nt = mat.node_tree
    out = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
    src = out.inputs["Surface"].links[0].from_socket
    mix = nt.nodes.new("ShaderNodeMixShader")
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    nt.links.new(src, mix.inputs[1])
    nt.links.new(tr.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    mix.inputs[0].default_value = 0.0
    return mix.inputs[0]


def draw(val, f0, f1, a=-0.01, b=1.0):
    """Key a reveal_ink value: drawn on over f0..f1 (or off, with a and b swapped)."""
    lib.key(val, "default_value", f0, a)
    lib.key(val, "default_value", f1, b)


ARROW_L, ARROW_DX, ARROW_TOP = 0.5, lib.NODE_R + 0.12, 0.36


def arrow(name, length, mat, r=0.0085):
    """A straight ink arrow along z from its origin (length < 0 points down), to grow by scale."""
    d = np.array([0, 0, 1.0 if length > 0 else -1.0])
    L, head = abs(length), 0.09
    V, F = [], []
    lib._tube(V, F, np.array([d * 0, d * (L - head * 0.8)]), r, 10)
    lib._cone(V, F, d * L, d, head, r * 4.2, 16)
    ob = lib.mesh_object(name, V, F, mat, smooth=False, recalc=False)
    for k in ("visible_shadow", "visible_diffuse", "visible_glossy", "visible_transmission"):
        setattr(ob, k, False)
    return ob


def follow(ob, target, offset=(0, 0, 0)):
    """ob sits at target's location + offset, whatever target's scale."""
    ob.location = offset
    c = ob.constraints.new("COPY_LOCATION")
    c.target, c.use_offset = target, True
    return ob


def rgba(hex_):
    return (*lib.lin(hex_), 1)


# ------------------------------------------------------------------ build

def build():
    M = {
        "itub": lib.principled("curve_itub4", lib.SIGNAL, rough=0.35, emit=lib.SIGNAL, emit_strength=0.5),
        "bbdc": lib.principled("curve_bbdc4", lib.INK, rough=0.42),
        "cone": lib.principled("granger_head", lib.SIGNAL, rough=0.35, emit=lib.SIGNAL, emit_strength=0.5),
    }
    report = lib.report_page(PAGE_PT)
    net = lib.network(NET_PT)
    pos = {t: np.array(p) for t, p in net["pos"].items()}

    # -------- curves: same data as the page, page state -> chart state
    series = dict(zip(("ITUB4", "BBDC4"), lib.price_series()))
    curves = {}
    for (t, s), page_pts, mat in zip(series.items(), report["chart"]["points"], (M["itub"], M["bbdc"])):
        page = catmull(page_pts, N_SAMPLES)
        idx = np.linspace(0, 1, len(s))
        plot_raw = np.stack([PLOT_X0 + idx * PLOT_W, np.full(len(s), PLOT_Y[t]), PLOT_Z0 + s * PLOT_H], 1)
        plot = catmull(plot_raw, N_SAMPLES)
        C0 = page
        verts = tube_verts(C0, np.full(N_SAMPLES, R_PAGE))
        ob = lib.mesh_object(f"curve_{t}", verts, tube_faces(N_SAMPLES, SIDES), mat, smooth=True, recalc=False)
        curves[t] = dict(ob=ob, page=page, plot=plot, raw=plot_raw, node=pos[t])

    # -------- chart axes and time ticks (ink, drawn on)
    ax_m, ax_v = lib.reveal_ink("plot_axes", lib.INK)
    x0, y0, z0 = AX0
    lib.ink_path("plot_axis_price", [(x0, y0, z0), (x0, y0, PLOT_Z0 + PLOT_H + 0.22)], ax_m, r=0.0045)
    lib.ink_path("plot_axis_time", [(x0, y0, z0), (PLOT_X0 + PLOT_W + 0.22, y0, z0)], ax_m, r=0.0045)
    tk_m, tk_v = lib.reveal_ink("plot_ticks", lib.INK)
    for i in range(1, 9):
        x = x0 + i * (PLOT_W + 0.12) / 8.5
        lib.ink_path(f"plot_tick_t{i}", [(x, y0, z0), (x, y0, z0 + 0.045)], tk_m, r=0.0035, arrow=False)
        z = z0 + i * (PLOT_H + 0.1) / 8.5
        lib.ink_path(f"plot_tick_p{i}", [(x0, y0, z), (x0 + 0.045, y0, z)], tk_m, r=0.0035, arrow=False)

    # -------- lead-lag: the same level is reached by ITUB4 first, BBDC4 days later
    level = 0.75
    xa = np.interp(-level, -series["ITUB4"][:30], curves["ITUB4"]["raw"][:30, 0])
    xb = np.interp(-level, -series["BBDC4"][:30], curves["BBDC4"]["raw"][:30, 0])
    zl = PLOT_Z0 + level * PLOT_H
    lag_m, lag_v = lib.reveal_ink("lag", lib.INK)
    lib.ink_path("lag", [(xa + 0.035, 0.86, zl), (xb - 0.03, 0.86, zl)], lag_m, r=0.005, dash=0.032, gap=0.022)

    # -------- the network: per-edge reveal materials so each edge draws on
    edge_vals, edge_mats, edge_rest = {}, {}, {}
    for (a, b), ob in net["edges"].items():
        m, v = lib.reveal_ink(f"edge_{a}_{b}", lib.INK)
        ob.data.materials[0] = m
        edge_vals[(a, b)], edge_mats[(a, b)] = v, m
        co = np.empty(len(ob.data.vertices) * 3, np.float32)
        ob.data.vertices.foreach_get("co", co)
        co = co.reshape(-1, 3).astype(np.float64)
        pa, pb = pos[a], pos[b]
        d = pb - pa
        s = np.clip((co - pa) @ d / (d @ d), 0, 1)
        edge_rest[(a, b)] = (co, s)
    # PETR4 appears after BPAC11, so that edge draws from BPAC11's end
    ob = net["edges"][("PETR4", "BPAC11")]
    att = ob.data.attributes["t"]
    t = np.empty(len(ob.data.vertices), np.float32)
    att.data.foreach_get("value", t)
    att.data.foreach_set("value", 1 - t)

    # Granger arrowhead at BBDC4's end of the strong edge
    pa, pb = pos["ITUB4"], pos["BBDC4"]
    u = (pb - pa) / np.linalg.norm(pb - pa)
    tip = pb - u * lib.NODE_R * 1.05
    V, F = [], []
    lib._cone(V, F, np.zeros(3), u, 0.13, 0.042, 24)
    cone = lib.mesh_object("granger_head", V, F, M["cone"], smooth=False, recalc=False)
    cone.location = tip
    cone.visible_shadow = False

    # eigenvector-centrality ring on the ground around the driver
    ring_m, ring_v = lib.reveal_ink("centrality_ring", lib.INK)
    c = pos[lib.DRIVER]
    th = np.linspace(-math.pi / 2, 1.5 * math.pi, 160)
    lib.ink_path("centrality_ring", np.stack([c[0] + 0.36 * np.cos(th), c[1] + 0.36 * np.sin(th), np.full(160, 0.004)], 1),
                 ring_m, r=0.0055, dash=0.05, gap=0.032, arrow=False)

    # -------- the trade: short arrow at the driver, long arrows at each follower
    ink = lib.flat("trade_ink", lib.INK)
    short = follow(arrow("short_arrow", -ARROW_L, ink), net["nodes"][lib.DRIVER], (-ARROW_DX, 0, ARROW_TOP))
    longs = [follow(arrow(f"long_arrow_{f}", ARROW_L, ink), net["nodes"][f], (ARROW_DX, 0, ARROW_TOP - ARROW_L))
             for f in FOLLOWERS]

    # -------- anchors
    A = {}

    def anchor(name, loc=(0, 0, 0), target=None):
        e = lib.empty(f"anchor:{name}", loc)
        if target is not None:
            follow(e, target, loc)
        A[name] = e

    for t in lib.NETWORK:
        anchor("node_" + t, (0, 0, lib.NODE_R + 0.14), net["nodes"][t])
    # curve names sit in open space next to their own curve
    p = curves["ITUB4"]["raw"][49]
    anchor("end_ITUB4", (p[0], p[1], p[2] + 0.1))
    p = curves["BBDC4"]["raw"][13]
    anchor("end_BBDC4", (p[0] + 0.22, p[1], p[2]))
    anchor("lag", ((xa + xb) / 2, 0.86, zl + 0.01))
    mid = (pa + pb) / 2
    anchor("granger", (mid[0], mid[1], mid[2] + 0.012))
    anchor("driver", (0, 0, lib.NODE_R + 0.5), net["nodes"][lib.DRIVER])
    anchor("short", (-ARROW_DX, 0, ARROW_TOP + 0.02), net["nodes"][lib.DRIVER])
    anchor("long", (ARROW_DX, 0, ARROW_TOP + 0.02), net["nodes"]["BPAC11"])

    H = dict(M=M, report=report, net=net, pos=pos, curves=curves, ax_v=ax_v, tk_v=tk_v, lag_v=lag_v,
             edge_vals=edge_vals, edge_mats=edge_mats, edge_rest=edge_rest, cone=cone, ring_v=ring_v,
             short=short, longs=longs)
    return A, H


# ------------------------------------------------------------------ per-frame geometry
# The curves morph point by point and the edges stretch with the nodes they
# join, which keyframes cannot express, so a frame handler writes them.

def dz_at(f):
    d = RISE * (ramp(f, *TRADE_UP) - ramp(f, *SETTLE))
    fl = RISE * (ramp(f, *FOLLOW_UP) - ramp(f, *SETTLE))
    return {t: d if t == lib.DRIVER else fl if t in FOLLOWERS else 0.0 for t in lib.NETWORK}


def curve_state(cv, f):
    page, plot, node = cv["page"], cv["plot"], cv["node"]
    u = np.linspace(0, 1, N_SAMPLES)
    p0, span, dur = PEEL
    e = np.clip((f - (p0 + u * span)) / dur, 0, 1)
    exy, ez = smooth(e), smooth(np.minimum(1, e * 1.5))  # each point lifts first, then slides back into the chart
    C = page.copy()
    C[:, :2] += (plot[:, :2] - page[:, :2]) * exy[:, None]
    C[:, 2] += (plot[:, 2] - page[:, 2]) * ez + 0.06 * np.sin(np.pi * exy)
    R = R_PAGE + (R_BIG - R_PAGE) * exy
    c = ramp(f, *COLLAPSE)
    if c > 0:  # the whole curve shrinks into its node
        C = node + (C - node) * (1 - c)
        R = R * (1 - 0.6 * c)
    return C, R, c


def make_handler(H):
    net, pos, curves = H["net"], H["pos"], H["curves"]

    def update(scene, *_):
        f = scene.frame_current_final  # film frames fall between whole frames
        for t, cv in curves.items():
            C, R, c = curve_state(cv, f)
            me = cv["ob"].data
            me.vertices.foreach_set("co", tube_verts(C, R).astype(np.float32).ravel())
            me.update()
            # the node grows inside the shrinking curve
            net["nodes"][t].scale = (max(0.001, c ** 0.8),) * 3
        dz = dz_at(f)
        for t, ob in net["nodes"].items():
            ob.location = (pos[t][0], pos[t][1], pos[t][2] + dz[t])
        for (a, b), ob in net["edges"].items():
            co, s = H["edge_rest"][(a, b)]
            new = co.copy()
            new[:, 2] += (1 - s) * dz[a] + s * dz[b]
            ob.data.vertices.foreach_set("co", new.astype(np.float32).ravel())
            ob.data.update()

    return update


# ------------------------------------------------------------------ animation

CAMERA = [
    lib.handoff_key(1, "page", PAGE_PT),
    lib.handoff_key(3, "page", PAGE_PT),
    (15, (0.1, -3.0, 2.45), (0.0, 0.55, 0.62), 40),
    (44, (0.25, -3.4, 1.62), (0.0, 0.9, 0.72), 40),
    (56, (0.3, -3.5, 1.8), (0.0, 0.85, 0.64), 40),
    (70, (0.15, -3.0, 2.3), (0.0, 0.55, 0.25), 46),
    (88, (-0.05, -3.5, 2.8), (-0.12, 0.55, 0.25), 44),
    (114, (-0.45, -5.5, 4.3), (-0.55, 0.6, 0.25), 40),
    (128, (-0.5, -5.1, 4.0), (-0.55, 0.6, 0.45), 36),
    (145, (-0.55, -5.15, 3.9), (-0.575, 0.6, 0.4), 36),
    lib.handoff_key(157, "network", NET_PT),
    lib.handoff_key(FRAMES, "network", NET_PT),
]
HOLDS = {1, 3, 157, FRAMES}

# network growth: ITUB4's neighbours first, then their neighbours, then the cross links
RING1 = [("BBAS3", 88), ("ITSA4", 91), ("SANB11", 94), ("BPAC11", 97), ("B3SA3", 100)]
RING2 = [(("BBAS3", "VALE3"), 101), (("BBDC4", "PETR4"), 103), (("ITSA4", "WEGE3"), 105),
         (("BBDC4", "ABEV3"), 106), (("SANB11", "BBSE3"), 108), (("BBAS3", "RENT3"), 109)]
CROSS = [(("BPAC11", "BBSE3"), 113), (("B3SA3", "WEGE3"), 114), (("ABEV3", "RENT3"), 115), (("PETR4", "BPAC11"), 116)]

EDGE_DRAW = 7


def animate(scene, H):
    cam = lib.film_camera(scene, CAMERA)
    for ob in (cam, scene.objects["cam_target"], cam.data):
        flat_holds(ob, HOLDS)

    net, M = H["net"], H["M"]
    rep = H["report"]

    # frames 1-3 show the page exactly as chapter 02 left it; at 4 our curves take over
    for ob in rep["curves"]:
        lib.key(ob, "hide_render", 1, False)
        lib.key(ob, "hide_render", 4, True)
    for cv in H["curves"].values():
        lib.key(cv["ob"], "hide_render", 1, True)
        lib.key(cv["ob"], "hide_render", 4, False)
        lib.key(cv["ob"], "hide_render", COLLAPSE[1] - 1, True)

    # the page fades once the curves have left it
    for name in ("report_paper", "report_bar", "report_row", "report_ink"):
        fac = fade_material(bpy.data.materials[name])
        lib.key(fac, "default_value", 28, 0.0)
        lib.key(fac, "default_value", 46, 1.0)
    for ob in [rep["page"], rep["axes"], *rep["text"]]:
        lib.key(ob, "hide_render", 1, False)
        lib.key(ob, "hide_render", 47, True)

    # chart furniture
    draw(H["ax_v"], 10, 28)
    draw(H["tk_v"], 22, 32)
    draw(H["lag_v"], 40, 47)
    draw(H["lag_v"], 51, 55, 1.0, -0.01)
    draw(H["ax_v"], 52, 62, 1.0, -0.01)
    draw(H["tk_v"], 50, 56, 1.0, -0.01)

    # BBDC4's ink curve turns into a white node
    wb = net["white"].node_tree.nodes["Principled BSDF"].inputs["Base Color"]
    lib.key(wb, "default_value", 56, rgba(lib.INK))
    lib.key(wb, "default_value", 70, rgba("#F2F2F0"))

    # everything in the network starts hidden
    for (a, b), v in H["edge_vals"].items():
        lib.key(v, "default_value", 1, -0.01)
    for t, ob in net["nodes"].items():
        if t not in H["curves"]:
            lib.key(ob, "scale", 1, (0.001,) * 3)

    # kernel Granger causality: ITUB4 -> BBDC4, drawn in signal orange, then cools to ink
    g = ("ITUB4", "BBDC4")
    draw(H["edge_vals"][g], *GRANGER)
    em = H["edge_mats"][g].node_tree.nodes["Emission"].inputs
    lib.key(em["Color"], "default_value", 1, rgba(lib.SIGNAL))
    lib.key(em["Strength"], "default_value", 1, 1.2)
    lib.key(em["Color"], "default_value", 96, rgba(lib.SIGNAL))
    lib.key(em["Strength"], "default_value", 96, 1.2)
    lib.key(em["Color"], "default_value", 106, rgba(lib.INK))
    lib.key(em["Strength"], "default_value", 106, 1.0)
    cone = H["cone"]
    lib.key(cone, "scale", 1, (0.001,) * 3)
    lib.key(cone, "scale", GRANGER[1] - 2, (0.001,) * 3)
    lib.key(cone, "scale", GRANGER[1] + 3, (1,) * 3)
    lib.key(cone, "scale", 96, (1,) * 3)
    lib.key(cone, "scale", 104, (0.001,) * 3)
    lib.key(cone, "hide_render", 1, True)
    lib.key(cone, "hide_render", GRANGER[1] - 2, False)
    lib.key(cone, "hide_render", 105, True)

    pop = {}

    def pop_node(t, f):
        ob = net["nodes"][t]
        lib.key(ob, "scale", f, (0.001,) * 3)
        lib.key(ob, "scale", f + 4, (1.1,) * 3)
        lib.key(ob, "scale", f + 7, (1.0,) * 3)
        pop[t] = f

    for t, f in RING1:
        draw(H["edge_vals"][(lib.DRIVER, t)], f - EDGE_DRAW, f)
        pop_node(t, f - 1)
    for (a, b), f in RING2:
        draw(H["edge_vals"][(a, b)], f - EDGE_DRAW, f)
        pop_node(b, f - 1)
    for e, f in CROSS:
        draw(H["edge_vals"][e], f - EDGE_DRAW, f)

    # eigenvector centrality ring around the driver
    draw(H["ring_v"], 108, 117)
    draw(H["ring_v"], 121, 126, 1.0, -0.01)

    # the trade
    def grow(ob, f0, f1, f2, f3):
        for f, s_ in ((1, 0.001), (f0, 0.001), (f1, 1), (f2, 1), (f3, 0.001)):
            lib.key(ob, "scale", f, (s_,) * 3)
        lib.key(ob, "hide_render", 1, True)
        lib.key(ob, "hide_render", f0, False)
        lib.key(ob, "hide_render", f3 + 1, True)

    # the six driver -> follower edges glow while the followers catch up, then cool
    for t in FOLLOWERS:
        e = H["edge_mats"][(lib.DRIVER, t)].node_tree.nodes["Emission"].inputs
        for f, c, st in ((128, lib.INK, 1.0), (134, lib.SIGNAL, 1.2), (146, lib.SIGNAL, 1.2), (153, lib.INK, 1.0)):
            lib.key(e["Color"], "default_value", f, rgba(c))
            lib.key(e["Strength"], "default_value", f, st)

    grow(H["short"], 127, 133, 146, 151)
    for i, ob in enumerate(H["longs"]):
        grow(ob, 131 + i, 137 + i, 146, 151)

    bpy.app.handlers.frame_change_pre.append(make_handler(H))
    return cam, pop


# ------------------------------------------------------------------ labels

def labels(pop):
    L = [
        {"type": "tag", "t": "ITUB4", "k": "end_ITUB4"},
        {"type": "tag", "t": "BBDC4", "k": "end_BBDC4"},
        {"type": "point", "t": "Lead–lag", "k": "lag", "dx": 5, "dy": -6},
        {"type": "point", "t": "Kernel Granger causality", "k": "granger", "dx": 4, "dy": -10},
        {"type": "point", "t": "Driver · eigenvector centrality", "k": "driver", "dx": 0, "dy": -14},
        {"type": "point", "t": "Short driver", "k": "short", "dx": -7, "dy": -12},
        {"type": "point", "t": "Long followers", "k": "long", "dx": 6, "dy": -9},
    ]
    L += [{"type": "tag", "t": t, "k": "node_" + t} for t in lib.NETWORK]
    appear = {"end_ITUB4": 40, "end_BBDC4": 40, "lag": 46, "granger": 78, "driver": 110, "short": 130, "long": 136}
    vanish = {"end_ITUB4": 57, "end_BBDC4": 57, "lag": 53, "granger": 100, "driver": 124, "short": 151, "long": 151}
    appear["node_ITUB4"] = appear["node_BBDC4"] = 66
    for t, f in pop.items():
        appear["node_" + t] = f + 5
    return L, appear, vanish


def main():
    args = lib.film_args(FRAMES)
    scene = lib.reset()
    lib.studio(scene, args.samples, args.pct)
    anchors, H = build()
    cam, pop = animate(scene, H)
    L, appear, vanish = labels(pop)
    lib.render_film(scene, cam, anchors, FRAMES, args, L, appear, vanish)


main()
