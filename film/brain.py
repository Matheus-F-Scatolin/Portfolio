"""Chapter 01, Brain tumor AI.

brain with tumor -> MRI scanner -> T1, T1c, T2, FLAIR -> ResNet-18
-> image features appended to radiomics -> CatBoost -> Improving.

The chain runs along +X at bore height and one camera travels down it over
FRAMES frames; the page scrubs those frames with scroll. Run with:
  Blender -b --factory-startup --python film/brain.py -- --out DIR [--frames all|between|a:b:step] [--pct 50] [--samples 64]
"""

import math
import os
import sys

import bpy
import numpy as np
from mathutils import Vector, noise

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib  # noqa: E402
import mri  # noqa: E402

AXIS_Z = 1.2  # bore centre height; every stage is centred on it
GRID_C = (3.05, 0.0, 1.12)  # centre of the 2x2 light box of scans
GRID_YAW = 68  # the light box faces the camera as it passes the scanner
SLICE = 0.66  # plate size
SLICE_GAP = 0.06
PLATE_YAW = 18  # ResNet plates turn less: they read by silhouette


# ------------------------------------------------------------------ materials

def materials():
    return {
        "clay": lib.principled("clay", "#DEDCD8", rough=0.62, Subsurface_Weight=0.12, Subsurface_Scale=0.015),
        "plastic": lib.principled("plastic", "#F2F2F0", rough=0.32),
        "plastic_dim": lib.principled("plastic_dim", "#C9CAC7", rough=0.45),
        "tumor": lib.principled("tumor", lib.SIGNAL, rough=0.45, emit=lib.SIGNAL, emit_strength=0.5),
        "signal": lib.principled("signal", lib.SIGNAL, rough=0.35, emit=lib.SIGNAL, emit_strength=0.5),
        "glow": lib.flat("glow", lib.SIGNAL, strength=1.3),
        "ink": lib.flat("ink", lib.INK),
        "ink_signal": lib.flat("ink_signal", lib.SIGNAL, strength=1.2),
    }


# ------------------------------------------------------------------ brain

def _field(P, freq, off, warp):
    out = np.empty(len(P))
    for i, q in enumerate(P * freq + off):
        q = Vector(q)
        out[i] = noise.noise(q + noise.noise_vector(q * 0.5) * warp)
    return out


def hemisphere(side, mat, parent):
    """One cerebral hemisphere. side=-1 is the left one, facing the camera."""
    me, d = lib.ico(f"hemisphere_{side}", 7)
    a, b, c = 0.56, 0.26, 0.43
    p = d * [a, b, c]
    x = p[:, 0]
    lat = np.clip(side * d[:, 1], 0, 1)
    p[:, 2] = np.where(p[:, 2] < 0, p[:, 2] * 0.70, p[:, 2])
    # frontal lobe a little narrower and lower than the occipital end
    fr = np.clip(-x / a, 0, 1) ** 2
    p[:, 1] *= 1 - 0.08 * fr
    p[:, 2] -= 0.035 * fr * np.clip(p[:, 2] / 0.12, 0, 1)
    # temporal lobe bulging out and down under the Sylvian fissure
    g = np.exp(-(((x + 0.02) / 0.26) ** 2 + ((p[:, 2] + 0.15) / 0.11) ** 2)) * lat
    p[:, 1] += side * 0.045 * g
    p[:, 2] -= 0.035 * g
    p[:, 1] += side * 0.245
    lib.set_co(me, p)

    n = lib.vnormals(me)
    s = _field(p, 8.5, Vector((3.1, 1.7 * side, 5.3)), 0.4)
    # V-shaped sulci along the level set of the field, rounded gyri between
    disp = 0.034 * (np.tanh(np.sqrt(s ** 2 + 0.025 ** 2) / 0.12) - 1)
    # Sylvian fissure along the lateral face
    zs = -0.07 + 0.38 * (x + 0.02)
    win = np.clip((x + 0.32) / 0.08, 0, 1) * np.clip((0.24 - x) / 0.08, 0, 1)
    disp -= 0.045 * np.exp(-((p[:, 2] - zs) / 0.028) ** 2) * win * np.clip(lat * 2 - 0.3, 0, 1)
    lib.set_co(me, p + n * _smooth(me, disp, 3)[:, None])
    return lib.finish(me, f"hemisphere_{side}", mat, parent)


def _smooth(me, f, iters, k=0.5):
    """Average a per-vertex value with its neighbours (umbrella smoothing)."""
    e = np.empty(len(me.edges) * 2, np.int64)
    me.edges.foreach_get("vertices", e)
    a, b = e[0::2], e[1::2]
    cnt = np.bincount(a, minlength=len(f)) + np.bincount(b, minlength=len(f))
    for _ in range(iters):
        acc = np.bincount(a, f[b], len(f)) + np.bincount(b, f[a], len(f))
        f = (1 - k) * f + k * acc / cnt
    return f


def cerebellum(mat, parent):
    me, d = lib.ico("cerebellum", 6)
    p = d * [0.20, 0.36, 0.14] + [0.31, 0, -0.27]
    lib.set_co(me, p)
    n = lib.vnormals(me)
    s = np.sin((p[:, 2] + 0.25 * p[:, 0]) * 95 + 2 * _field(p, 3.0, Vector((9, 2, 4)), 0.3))
    disp = -0.007 * ((s + 1) / 2) ** 6 - 0.02 * np.exp(-(p[:, 1] / 0.03) ** 2)
    lib.set_co(me, p + n * disp[:, None])
    return lib.finish(me, "cerebellum", mat, parent)


def brainstem(mat, parent):
    x = np.linspace(0, 0.40, 90)
    r = (0.062 + 0.034 * np.exp(-((x - 0.11) / 0.06) ** 2)  # pons
         - 0.018 * np.clip((x - 0.17) / 0.23, 0, 1))  # medulla narrowing to the cord
    cap = np.sqrt(np.clip(1 - ((x - np.clip(x, 0.03, 0.37)) / 0.03) ** 2, 0, 1))
    ob = lib.lathe("brainstem", list(zip(x, np.maximum(r * cap, 1e-3))), mat, steps=96, parent=parent)
    # axis along +X turned to point down and slightly back, under the cerebellum's front edge
    ob.rotation_euler = (0, math.radians(90 - 12), 0)
    ob.location = (0.05, 0, -0.15)
    return ob


def tumor(mat, parent, center=(-0.10, -0.43, 0.10), r=0.11):
    me, d = lib.ico("tumor", 4)
    lump = np.array([noise.noise(Vector(q) * 1.4 + Vector((4, 4, 4))) for q in d])
    lib.set_co(me, d * (r * (1 + 0.3 * lump))[:, None])
    return lib.finish(me, "tumor", mat, parent, center)


def build_brain(M):
    # noise_vector draws on Blender's random seed, which is the clock unless set,
    # so without this every run grows different folds and split renders don't match
    noise.seed_set(1)
    root = lib.empty("brain", (-0.15, 0, AXIS_Z))
    root.scale = (1.25,) * 3
    hemisphere(-1, M["clay"], root)
    hemisphere(1, M["clay"], root)
    cerebellum(M["clay"], root)
    brainstem(M["clay"], root)
    t = tumor(M["tumor"], root)
    return root, t


# ------------------------------------------------------------------ the rest of the chain

def build_scanner(M, x=1.5):
    root = lib.empty("scanner", (x, 0, AXIS_Z))
    lib.lathe("scanner_ring", lib.rounded_rect(-0.3, 0.3, 0.76, 1.15, 0.075), M["plastic"], parent=root)
    lib.lathe("scanner_glow", lib.rounded_rect(-0.05, 0.05, 0.746, 0.758, 0.004, 2), M["glow"], parent=root)
    lib.box("scanner_plinth", (0.66, 1.45, 0.2), (0, 0, 0.1 - AXIS_Z), M["plastic"], 0.03, root)
    return root


def scan_plate(name, image_path):
    """Dark acrylic film with the scan printed on it, like a sheet on a light box.

    "wipe" (0 -> 1) acquires the scan from the top down: above the line the
    plate is there, below it nothing yet, and the line itself glows orange.
    Returns (material, wipe socket).
    """
    m, nt, out = lib._new_material(name)
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(image_path)
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Roughness"].default_value = 0.3
    # lit from behind like a light box: the scan is emitted, so its greys stay
    # neutral whatever the bore ring and the ground bounce onto it; only a sheen reflects
    b.inputs["Base Color"].default_value = (0, 0, 0, 1)
    nt.links.new(tex.outputs["Color"], b.inputs["Emission Color"])
    b.inputs["Emission Strength"].default_value = 1.15
    uv = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(uv.outputs["UV"], sep.inputs[0])
    wipe = nt.nodes.new("ShaderNodeValue")
    wipe.outputs[0].default_value = 0.0

    def math_(op, a, b_):
        n = nt.nodes.new("ShaderNodeMath")
        n.operation = op
        for i, x in enumerate((a, b_)):
            if isinstance(x, (int, float)):
                n.inputs[i].default_value = x
            else:
                nt.links.new(x, n.inputs[i])
        return n.outputs[0]

    edge = math_("SUBTRACT", 1.0, wipe.outputs[0])  # v of the scan line
    shown = math_("GREATER_THAN", sep.outputs["Y"], edge)
    band = math_("MULTIPLY", shown, math_("LESS_THAN", sep.outputs["Y"], math_("ADD", edge, 0.02)))
    line = nt.nodes.new("ShaderNodeEmission")
    line.inputs["Color"].default_value = (*lib.lin(lib.SIGNAL), 1)
    line.inputs["Strength"].default_value = 3.0
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(band, mix.inputs[0])
    nt.links.new(b.outputs[0], mix.inputs[1])
    nt.links.new(line.outputs[0], mix.inputs[2])
    cut = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(shown, cut.inputs[0])
    nt.links.new(nt.nodes.new("ShaderNodeBsdfTransparent").outputs[0], cut.inputs[1])
    nt.links.new(mix.outputs[0], cut.inputs[2])
    nt.links.new(cut.outputs[0], out.inputs["Surface"])
    return m, wipe.outputs[0]


def grid_point(col, row, du=0.0, dz=0.0):
    """World point on the light box: col/row in -1..1 cells, du/dz offsets in the plate plane."""
    a = math.radians(GRID_YAW)
    right = Vector((math.sin(a), -math.cos(a), 0))  # screen right as seen from the camera
    step = (SLICE + SLICE_GAP) / 2
    return Vector(GRID_C) + right * (col * step + du) + Vector((0, 0, row * step + dz))


def build_slices(M, out_dir):
    """T1 and T1c on top, T2 and FLAIR below, all facing the camera."""
    plates, wipes = [], []
    for (col, row), mod in zip(((-1, 1), (1, 1), (-1, -1), (1, -1)), mri.TISSUE):
        path = os.path.join(out_dir, f"scan-{mod}.png")
        if not os.path.exists(path):
            mri.save(bpy, mri.render(mod), path)
        mat, wipe = scan_plate(f"slice_{mod}", path)
        p = lib.plate(f"slice_{mod}", SLICE, SLICE, 0.02, grid_point(col, row), mat, round_=0.004)
        p.rotation_euler.z = math.radians(GRID_YAW)
        plates.append(p)
        wipes.append(wipe)
    return plates, wipes


def build_resnet(M, x0=4.75):
    """Stem conv plus four stages of two basic blocks, each block two convs.

    Plates shrink (spatial size halves) and thicken (channels double) stage
    by stage, the way ResNet-18 does. Every block gets its own skip arc.
    """
    plates, blocks, arcs = [], [], []
    x = x0
    plates.append(lib.plate("resnet_stem", 1.2, 1.2, 0.035, (x, 0, AXIS_Z), M["plastic"]))
    plates[-1].rotation_euler.z = math.radians(PLATE_YAW)
    x += 0.24
    for si, (h, t) in enumerate([(1.0, 0.03), (0.8, 0.045), (0.62, 0.06), (0.46, 0.08)]):
        for bi in range(2):
            first = x
            for ci in range(2):
                plates.append(lib.plate(f"resnet_s{si}b{bi}c{ci}", h, h, t, (x, 0, AXIS_Z), M["plastic"]))
                plates[-1].rotation_euler.z = math.radians(PLATE_YAW)
                x += t + 0.05
            last = x - t - 0.05
            blocks.append((first - t / 2, last + t / 2, AXIS_Z + h / 2))
            x += 0.09
        x += 0.12
    for i, (a, b, top) in enumerate(blocks):
        z = top + 0.025
        mat, val = lib.reveal_ink(f"skip_{i}", lib.INK)
        lib.ink_path(f"skip_{i}", lib.bezier((a - 0.015, 0, z), (a, 0, z + 0.17), (b, 0, z + 0.17), (b + 0.015, 0, z)), mat)
        arcs.append(val)
    return plates, blocks, arcs, x - 0.21


def build_features(M, x0, size=0.19, step=0.24, split=0.08):
    """Image features (white) appended to radiomic features (grey): one row."""
    xs = [x0 + i * step + (split if i >= 5 else 0) for i in range(10)]
    cubes = [lib.box(f"feature_{i}", (size, size, size), (x, 0, AXIS_Z), M["plastic"] if i < 5 else M["plastic_dim"], 0.026)
             for i, x in enumerate(xs)]
    return xs, size, cubes


def build_trees(M, x0, n=3, chosen=(2, 1, 2), s=1.6):
    """CatBoost grows oblivious trees: one split per level, shared by every node.

    The leaf each tree lands on, and the edges that lead to it, have their own
    materials so they can light up tree by tree.
    """
    centers, hot = [], []
    node, leafsz, r = 0.08 * s, 0.07 * s, 0.0045 * s
    for k in range(n):
        edge = lib.flat(f"tree{k}_path", lib.INK)
        leafm = lib.principled(f"tree{k}_leaf", "#C9CAC7", rough=0.45, emit=lib.SIGNAL, emit_strength=0.0)
        hot.append((edge, leafm))
        cx = x0 + 0.28 * s + k * 0.72 * s
        centers.append(cx)
        z0, z1, z2 = AXIS_Z + 0.25 * s, AXIS_Z, AXIS_Z - 0.25 * s
        root = (cx, 0, z0)
        mids = [(cx - 0.16 * s, 0, z1), (cx + 0.16 * s, 0, z1)]
        leaves = [(cx + o * s, 0, z2) for o in (-0.24, -0.08, 0.08, 0.24)]
        leaf = chosen[k]
        for j, m in enumerate(mids):
            mat = edge if j == leaf // 2 else M["ink"]
            lib.ink_path(f"tree{k}_e{j}", [np.add(root, (0, 0, -node / 2)), np.add(m, (0, 0, node / 2))], mat, r=r, arrow=False)
        for j, lf in enumerate(leaves):
            mat = edge if j == leaf else M["ink"]
            lib.ink_path(f"tree{k}_l{j}", [np.add(mids[j // 2], (0, 0, -node / 2)), np.add(lf, (0, 0, leafsz / 2))], mat, r=r, arrow=False)
        lib.box(f"tree{k}_root", (node,) * 3, root, M["plastic"], 0.014 * s)
        for j, m in enumerate(mids):
            lib.box(f"tree{k}_m{j}", (node,) * 3, m, M["plastic"], 0.014 * s)
        for j, lf in enumerate(leaves):
            lib.box(f"tree{k}_leaf{j}", (leafsz,) * 3, lf, leafm if j == leaf else M["plastic_dim"], 0.012 * s)
    return centers, x0 + (0.56 + (n - 1) * 0.72) * s, 0.25 * s, hot


CARD = (1.45, 0.06, 0.36)
CARD_DZ = 0.23


def build_cards(M, x):
    # ends as exactly lib.improving_card: chapter 02 opens on it
    good_m = lib.principled("card_improving", "#C9CAC7", rough=0.35, emit=lib.SIGNAL, emit_strength=0.0)
    good = lib.box("card_improving", CARD, (x, 0, AXIS_Z + CARD_DZ), good_m, 0.03)
    bad = lib.box("card_not_improving", CARD, (x, 0, AXIS_Z - CARD_DZ), M["plastic_dim"], 0.03)
    return good, bad, good_m


def build(out_dir):
    """Build the chapter. Returns label anchors and the handles animate() moves."""
    M = materials()
    build_brain(M)
    build_scanner(M)
    slices, wipes = build_slices(M, out_dir)
    plates, blocks, arcs, res_end = build_resnet(M)
    fx, fs, cubes = build_features(M, res_end + 0.5)
    feat_end = fx[-1] + fs / 2
    tree_x0 = feat_end + 0.5
    tree_cx, tree_end, tree_h, hot = build_trees(M, tree_x0)
    card_x = tree_end + 0.55 + CARD[0] / 2
    _, bad, card_m = build_cards(M, card_x)

    dash = dict(dash=0.04, gap=0.028)
    z = AXIS_Z
    flows = {}

    def flow(name, pts):
        mat, val = lib.reveal_ink(f"flow_{name}", lib.INK)
        lib.ink_path(f"flow_{name}", pts, mat, **dash)
        flows[name] = val

    flow("brain_scanner", [(0.62, 0, z), (1.1, 0, z)])
    flow("scanner_slices", [(1.86, 0, z), tuple(grid_point(-1, 0, -SLICE / 2 - 0.08))])
    flow("slices_resnet", [tuple(grid_point(1, 0, SLICE / 2 + 0.06)), (4.68, 0, z)])
    flow("resnet_features", [(res_end + 0.09, 0, z), (fx[0] - fs / 2 - 0.06, 0, z)])
    rad_x = (fx[5] + fx[9]) / 2
    sb = grid_point(1, -1, 0, -SLICE / 2 - 0.04)
    flow("slices_radiomics", lib.bezier(tuple(sb), (sb.x + 0.15, sb.y - 0.02, 0.16), (rad_x - 0.6, -0.05, 0.2), (rad_x, 0, z - fs / 2 - 0.04)))
    flow("features_trees", [(feat_end + 0.08, 0, z), (tree_x0 - 0.04, 0, z)])
    cz = z + CARD_DZ
    flow("trees_card", lib.bezier((tree_end + 0.06, 0, z), (tree_end + 0.25, 0, z), (card_x - CARD[0] / 2 - 0.3, 0, cz), (card_x - CARD[0] / 2 - 0.05, 0, cz)))

    A = {}

    def anchor(name, loc, parent=None):
        A[name] = lib.empty(f"anchor:{name}", loc, parent)

    anchor("brain", (-0.45, -0.2, z + 0.45))
    anchor("tumor", (-0.28, -0.66, z + 0.15))
    # the outer band facing the camera: the ring's top runs off the frame
    anchor("scanner", (1.5, -1.15, z + 0.3))
    for (col, row), mod in zip(((-1, 1), (1, 1), (-1, -1), (1, -1)), mri.TISSUE):
        anchor(mod, tuple(grid_point(col, row, 0, row * (SLICE / 2 + 0.02))))
    anchor("resnet_l", (4.75, 0, z + 0.85))
    anchor("resnet_r", (res_end, 0, z + 0.85))
    a, b, top = blocks[0]
    anchor("skip", ((a + b) / 2, 0, top + 0.15))
    anchor("features_l", (fx[0] - fs / 2, 0, z + fs / 2 + 0.02))
    anchor("features_r", (fx[4] + fs / 2, 0, z + fs / 2 + 0.02))
    anchor("radiomics_l", (fx[5] - fs / 2, 0, z - fs / 2 - 0.02))
    anchor("radiomics_r", (fx[9] + fs / 2, 0, z - fs / 2 - 0.02))
    anchor("catboost_l", (tree_x0, 0, z + tree_h + 0.12))
    anchor("catboost_r", (tree_end, 0, z + tree_h + 0.12))
    for i in range(len(tree_cx) - 1):
        anchor(f"plus_{i}", ((tree_cx[i] + tree_cx[i + 1]) / 2, 0, z))
    for name, cz_ in (("improving", cz), ("not_improving", z - CARD_DZ)):
        anchor(name, (card_x, -CARD[1], cz_))
        anchor(f"{name}_l", (card_x - CARD[0] / 2, -CARD[1], cz_))
        anchor(f"{name}_r", (card_x + CARD[0] / 2, -CARD[1], cz_))

    H = dict(M=M, slices=slices, wipes=wipes, arcs=arcs, cubes=cubes, fx=fx, hot=hot, card_m=card_m,
             flows=flows, bad=bad, card_pt=(card_x, 0, cz))
    return A, H


# ------------------------------------------------------------------ animation

FRAMES = 176
HANDOFF_AT = 172  # from here the camera holds on the Improving card: chapter 02 opens on this frame


def camera_keys(card_pt):
    """One continuous camera move down the chain, ending on the handoff pose."""
    return [
        (1, (-2.0, -3.6, 1.9), (0.2, 0, 1.15), 50),
        (24, (-0.7, -4.5, 2.1), (1.5, 0, 1.15), 47),
        (38, (0.9, -5.0, 2.1), (2.85, 0, 1.12), 44),
        (54, (1.5, -5.0, 2.15), (3.3, 0, 1.12), 44),
        (76, (3.9, -5.0, 2.6), (5.9, 0, 1.15), 42),
        (104, (7.3, -4.6, 2.4), (9.2, 0, 1.12), 42),
        (132, (10.6, -5.4, 2.6), (12.8, 0, 1.15), 40),
        (152, (12.4, -5.6, 2.5), (14.2, 0, 1.2), 42),
        lib.handoff_key(HANDOFF_AT, "card", card_pt),
        lib.handoff_key(FRAMES, "card", card_pt),
    ]


# what the page draws (types in film/scrub.html); dx/dy are % of the stage
LABELS = [
    {"type": "point", "t": "Human brain", "k": "brain", "dx": -4, "dy": -7},
    {"type": "point", "t": "Tumor", "k": "tumor", "dx": 10, "dy": -10},
    {"type": "point", "t": "MRI scanner", "k": "scanner", "dx": 6, "dy": -8},
    {"type": "point", "t": "T1", "k": "T1", "dx": 0, "dy": -3},
    {"type": "point", "t": "T1c", "k": "T1c", "dx": 0, "dy": -3},
    {"type": "point", "t": "T2", "k": "T2", "dx": 0, "dy": 3},
    {"type": "point", "t": "FLAIR", "k": "FLAIR", "dx": 0, "dy": 3},
    {"type": "span", "t": "ResNet-18", "a": "resnet_l", "b": "resnet_r", "show": "resnet"},
    {"type": "point", "t": "Skip connection", "k": "skip", "dx": -2, "dy": -4},
    {"type": "span", "t": "Image features", "a": "features_l", "b": "features_r", "show": "features"},
    {"type": "span", "t": "Radiomics", "a": "radiomics_l", "b": "radiomics_r", "show": "radiomics", "down": True},
    {"type": "span", "t": "CatBoost", "a": "catboost_l", "b": "catboost_r", "show": "catboost"},
    {"type": "plus", "k": "plus_0", "show": "plus"}, {"type": "plus", "k": "plus_1", "show": "plus"},
    {"type": "card", "t": "Improving", "k": "improving", "cls": "good"},
    {"type": "card", "t": "Not improving", "k": "not_improving", "cls": "bad"},
]

# frame each label fades in / is gone by on the page
APPEAR = {
    "brain": 1, "tumor": 1, "scanner": 16, "T1": 42, "T1c": 48, "T2": 54, "FLAIR": 60,
    "resnet": 62, "skip": 68, "features": 94, "radiomics": 115, "catboost": 120,
    "plus": 120, "improving": 148, "not_improving": 148,
}
VANISH = {"catboost": 160, "plus": 160, "not_improving": 160}


def _draw(val, f0, f1, a=0.0, b=1.0):
    lib.key(val, "default_value", f0, a)
    lib.key(val, "default_value", f1, b)


def _rgba(hex_):
    return (*lib.lin(hex_), 1)


def animate(scene, H):
    """Keyframe the chapter: everything is driven by the frame, which the page maps to scroll."""
    cam = lib.film_camera(scene, camera_keys(H["card_pt"]))

    # the bore lights up as the brain is scanned
    glow = H["M"]["glow"].node_tree.nodes["Emission"].inputs["Strength"]
    for f, v in ((8, 0.5), (30, 2.6), (60, 1.3)):
        lib.key(glow, "default_value", f, v)

    # each modality is acquired in turn: an orange scan line runs down its plate
    for i, w in enumerate(H["wipes"]):
        f0 = 34 + 6 * i
        _draw(w, f0, f0 + 13, 0.0, 1.06)

    fl = H["flows"]
    _draw(fl["brain_scanner"], 12, 22)
    _draw(fl["scanner_slices"], 26, 33)
    _draw(fl["slices_resnet"], 60, 66)
    for i, v in enumerate(H["arcs"]):  # signal passes block by block
        _draw(v, 64 + 3 * i, 70 + 3 * i)
    _draw(fl["resnet_features"], 88, 93)
    _draw(fl["slices_radiomics"], 92, 104)
    _draw(fl["features_trees"], 116, 122)
    _draw(fl["trees_card"], 138, 145)

    # image features pop out of the network; radiomics arrive, then close the gap: appended
    cubes, fx = H["cubes"], H["fx"]
    for i, cb in enumerate(cubes[:5]):
        f0 = 90 + 2 * i
        lib.key(cb, "scale", f0, (0.001,) * 3)
        lib.key(cb, "scale", f0 + 6, (1,) * 3)
    for i, cb in enumerate(cubes[5:]):
        f0 = 100 + 2 * i
        x = fx[5 + i]
        lib.key(cb, "scale", f0, (0.001,) * 3)
        lib.key(cb, "scale", f0 + 6, (1,) * 3)
        lib.key(cb, "location", 110, (x + 0.32, 0, AXIS_Z))
        lib.key(cb, "location", 117, (x, 0, AXIS_Z))

    # each tree finds its leaf, then the prediction lights
    for k, (edge, leaf) in enumerate(H["hot"]):
        f0, f1 = 122 + 5 * k, 127 + 5 * k
        ec = edge.node_tree.nodes["Emission"].inputs
        b = leaf.node_tree.nodes["Principled BSDF"].inputs
        lib.key(ec["Color"], "default_value", f0, _rgba(lib.INK))
        lib.key(ec["Color"], "default_value", f1, _rgba(lib.SIGNAL))
        lib.key(ec["Strength"], "default_value", f1, 1.2)
        lib.key(b["Base Color"], "default_value", f0, _rgba("#C9CAC7"))
        lib.key(b["Base Color"], "default_value", f1, _rgba(lib.SIGNAL))
        lib.key(b["Emission Strength"], "default_value", f0, 0.0)
        lib.key(b["Emission Strength"], "default_value", f1, 0.5)
    b = H["card_m"].node_tree.nodes["Principled BSDF"].inputs
    lib.key(b["Base Color"], "default_value", 143, _rgba("#C9CAC7"))
    lib.key(b["Base Color"], "default_value", 150, _rgba(lib.SIGNAL))
    lib.key(b["Emission Strength"], "default_value", 143, 0.0)
    lib.key(b["Emission Strength"], "default_value", 150, 0.5)

    # the answer is in: Not improving folds away, the arrow lets go, the camera
    # comes in on the Improving card alone
    bad = H["bad"]
    lib.key(bad, "scale", 154, (1, 1, 1))
    lib.key(bad, "location", 154, tuple(bad.location))
    lib.key(bad, "scale", 164, (0.001, 0.001, 0.001))
    lib.key(bad, "location", 164, tuple(bad.location + Vector((0, 0, -0.12))))
    _draw(fl["trees_card"], 154, 164, 1.0, 0.0)
    # anything left outside the frame goes too, so its shadows match chapter 02
    keep = {"card_improving", "ground"}
    for ob in list(bpy.data.objects):
        if ob.type == "MESH" and ob.name not in keep:
            lib.key(ob, "hide_render", HANDOFF_AT - 1, False)
            lib.key(ob, "hide_render", HANDOFF_AT, True)
    return cam


def main():
    args = lib.film_args(FRAMES)
    scene = lib.reset()
    lib.studio(scene, args.samples, args.pct)
    os.makedirs(args.out, exist_ok=True)
    anchors, H = build(args.out)
    cam = animate(scene, H)
    lib.render_film(scene, cam, anchors, FRAMES, args, LABELS, APPEAR, VANISH)


main()
