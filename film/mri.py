"""Synthetic axial MRI slices for the brain chapter, one per modality.

Real BraTS scans cannot be redistributed, so the slices are drawn from a
small anatomical model instead: scalp, skull with marrow, CSF, a folded
cortical ribbon over white matter, deep grey nuclei, ventricles, and a tumor
with necrotic core, enhancing rim and edema that spreads in fingers along the
white matter. Each modality maps the same tissues to its own intensities, so
the four plates differ the way real T1/T1c/T2/FLAIR do. The tumor is outlined
in signal orange, the way a segmentation model would mark it.
"""

import numpy as np

ORDER = ("scalp", "marrow", "bone", "csf", "gm", "wm", "edema", "rim", "necro")
TISSUE = {
    #         scalp marrow bone  csf   gm    wm    edema rim   necro
    "T1":    (0.82, 0.70, 0.04, 0.10, 0.50, 0.80, 0.42, 0.50, 0.22),
    "T1c":   (0.82, 0.70, 0.04, 0.10, 0.50, 0.80, 0.42, 1.00, 0.20),
    "T2":    (0.62, 0.45, 0.03, 1.00, 0.62, 0.36, 0.86, 0.66, 0.96),
    "FLAIR": (0.58, 0.40, 0.03, 0.05, 0.64, 0.44, 1.00, 0.76, 0.40),
}
TUMOR = (0.35, 0.22)  # centre in slice coordinates (u right, v anterior)


def _blur(img, sigma):
    n = img.shape[0]
    f = np.fft.fftfreq(n)
    g = np.exp(-2 * (np.pi * sigma) ** 2 * (f[:, None] ** 2 + f[None, :] ** 2))
    return np.real(np.fft.ifft2(np.fft.fft2(img) * g))


def _field(rng, n, sigma):
    f = _blur(rng.standard_normal((n, n)), sigma)
    return f / f.std()


def _ellipse(u, v, cx, cy, rx, ry, rot=0.0):
    c, s = np.cos(rot), np.sin(rot)
    x, y = u - cx, v - cy
    return ((c * x + s * y) / rx) ** 2 + ((-s * x + c * y) / ry) ** 2


def _seg_dist(u, v, pts):
    """Distance from every pixel to a polyline."""
    d = np.full(u.shape, np.inf)
    for (ax, ay), (bx, by) in zip(pts[:-1], pts[1:]):
        dx, dy = bx - ax, by - ay
        t = np.clip(((u - ax) * dx + (v - ay) * dy) / (dx * dx + dy * dy), 0, 1)
        d = np.minimum(d, np.hypot(u - ax - t * dx, v - ay - t * dy))
    return d


def _brain_radius(th):
    """Brain outline in polar form: egg-shaped, narrower at the frontal pole."""
    rx, ry = 0.70, 0.86
    r = 1 / np.sqrt((np.cos(th) / rx) ** 2 + (np.sin(th) / ry) ** 2)
    return r * (1 - 0.05 * np.clip(np.sin(th), 0, 1) ** 2) * (1 + 0.01 * np.cos(9 * th))


def _folds(th, rr, rb, rng, n):
    """Signed distance to the sulci: deep primary sulci at a steady rhythm round
    the brain, shallow secondary ones between some of them, and a domain warp
    so each one bends and wanders on its way in instead of running straight."""
    N = 34
    th = th + 0.075 * _field(rng, n, n / 22) + 0.022 * _field(rng, n, n / 60)
    ph = N * th
    wrap = lambda p: (p + np.pi) % (2 * np.pi) - np.pi
    tab = rng.uniform(size=(3, N))
    depth = rb - rr
    k = np.floor(ph / (2 * np.pi) + 0.5).astype(int) % N  # which primary sulcus
    lat = np.abs(np.cos(th))  # the midline fissure owns the poles
    L = (0.08 + 0.12 * tab[0][k]) * np.clip((lat - 0.06) / 0.12, 0, 1)
    taper = np.clip(1 - depth / np.maximum(L, 1e-3), 0, 1)
    d1 = np.maximum(np.abs(wrap(ph)) / N * rr - (0.003 + 0.005 * taper), depth - L)
    k2 = np.floor(ph / (2 * np.pi)).astype(int) % N
    L2 = np.where(tab[1][k2] > 0.35, 0.025 + 0.05 * tab[2][k2], -1.0) * (lat > 0.12)
    d2 = np.maximum(np.abs(wrap(ph - np.pi)) / N * rr - 0.0045, depth - L2)
    sul = np.minimum(d1, d2)
    for y0, y1 in ((0.95, 0.42), (-0.95, -0.52)):  # interhemispheric fissure
        u = rr * np.cos(th)
        v = rr * np.sin(th)
        seg = np.where((v - y1) * (v - y0) <= 0, np.abs(u), np.inf)
        sul = np.minimum(sul, seg - 0.007)
    return sul


def tissues(n=1024, seed=11):
    """Soft (0..1) masks for each tissue, row 0 anterior (top)."""
    rng = np.random.default_rng(seed)
    v, u = np.mgrid[1:-1:n * 1j, -1:1:n * 1j]
    th = np.arctan2(v, u)
    rr = np.hypot(u, v)
    px = 2 / n
    soft = lambda d, w=1.2: np.clip(0.5 - d / (w * px), 0, 1)  # signed distance -> antialiased mask

    head = 1 / np.sqrt((np.cos(th) / 0.81) ** 2 + (np.sin(th) / 0.97) ** 2)
    rb = _brain_radius(th)
    dout = rr - rb  # > 0 outside the brain
    sul = _folds(th, rr, rb, rng, n)

    # the tumor's mass effect flattens the sulci around it
    dt = np.hypot(u - TUMOR[0], v - TUMOR[1])
    sul = sul + 0.05 * np.clip((0.36 - dt) / 0.12, 0, 1)
    m = {}
    m["scalp"] = soft(rr - head)
    m["marrow"] = soft(rr - (head - 0.035))
    inner = head - 0.075
    m["csf"] = soft(rr - inner)
    brain = soft(np.maximum(dout, -sul))  # brain minus sulci
    m["gm"] = brain
    # cortical ribbon: grey within ~0.05 of the surface or a sulcus, white beneath
    ribbon = np.minimum(-dout, sul)
    # threshold a blurred mask so the gyral fingers end in rounded tips
    wm = _blur((ribbon > 0.034) * 1.0, 5)
    m["wm"] = brain * np.clip((wm - 0.5) * 4 + 0.5, 0, 1)
    # deep grey nuclei: caudate heads, putamen, thalami
    nuclei = np.zeros_like(u)
    for sx in (-1, 1):
        nuclei = np.maximum(nuclei, soft(np.sqrt(_ellipse(u, v, sx * 0.105, 0.20, 0.045, 0.075, sx * 0.3)) - 1, 4))
        nuclei = np.maximum(nuclei, soft(np.sqrt(_ellipse(u, v, sx * 0.24, 0.04, 0.05, 0.14, sx * 0.25)) - 1, 4))
        nuclei = np.maximum(nuclei, soft(np.sqrt(_ellipse(u, v, sx * 0.09, -0.12, 0.075, 0.09)) - 1, 4))
    vent = np.zeros_like(u)
    for sx in (-1, 1):
        vent = np.maximum(vent, soft(np.sqrt(_ellipse(u, v, sx * 0.042, 0.16, 0.028, 0.15, sx * 0.22)) - 1, 2))
        vent = np.maximum(vent, soft(np.sqrt(_ellipse(u, v, sx * 0.12, -0.30, 0.022, 0.09, -sx * 0.45)) - 1, 2))
    vent = np.maximum(vent, soft(np.sqrt(_ellipse(u, v, 0, 0.0, 0.010, 0.06)) - 1, 2))

    lump = _field(rng, n, n / 20)
    lump2 = _field(rng, n, n / 9)
    d = np.hypot(u - TUMOR[0], v - TUMOR[1]) / (1 + 0.15 * lump)
    rim = soft(d - 0.135) * brain
    necro = soft(d - (0.075 + 0.012 * lump2)) * brain
    # edema spreads along the white matter in fingers, barely into the cortex
    reach = 0.46 + 0.10 * lump2
    x = np.clip((d - 0.17) / (reach - 0.17), 0, 1)
    edema = 1 - x * x * (3 - 2 * x)  # plateau near the tumor, soft edge further out
    edema = _blur(edema * np.clip(m["wm"] + 0.15 * brain, 0, 1), 2.0)
    return dict(u=u, v=v, m=m, nuclei=nuclei, vent=vent, edema=edema, rim=rim, necro=necro,
                head=head, rr=rr, soft=soft, brain=brain)


def render(modality, n=1024, seed=11, tint="#FF5A1F"):
    """RGBA float image, row 0 at the top, black background like a real scan."""
    T = tissues(n, seed)
    u, v, m, soft, rr, head = T["u"], T["v"], T["m"], T["soft"], T["rr"], T["head"]
    val = dict(zip(ORDER, TISSUE[modality]))

    def paint(img, mask, value):
        return img * (1 - mask) + value * mask

    img = np.zeros((n, n))
    img = paint(img, m["scalp"], val["scalp"])
    # skull: dark outer and inner tables with brighter marrow between
    img = paint(img, soft(rr - (head - 0.022)), val["bone"])
    img = paint(img, soft(rr - (head - 0.032)), val["marrow"])
    img = paint(img, soft(rr - (head - 0.058)), val["bone"])
    img = paint(img, m["csf"], val["csf"])
    img = paint(img, m["gm"], val["gm"])
    img = paint(img, m["wm"], val["wm"])
    img = paint(img, _blur(T["nuclei"], 3) * m["wm"] * 0.35, val["gm"])
    img = paint(img, T["vent"], val["csf"])
    img = paint(img, T["edema"], val["edema"])
    img = paint(img, T["rim"], val["rim"])
    img = paint(img, T["necro"], val["necro"])

    rng = np.random.default_rng(seed + 1)
    img = _blur(img, 1.3)
    img *= 1 + 0.022 * _field(rng, n, n / 120) * (img > 0.2) + 0.02 * _field(rng, n, n / 30)  # tissue texture
    img *= 1 + 0.07 * v - 0.06 * (u ** 2 + v ** 2)  # coil falloff
    img = np.clip(img + 0.01 * np.abs(rng.standard_normal(img.shape)), 0, 1) ** 0.92

    # segmentation contour around the tumor core, in signal orange
    core = _blur(np.maximum(T["rim"], T["necro"]), 5.0)
    line = np.clip(1.4 * np.exp(-((core - 0.4) / 0.14) ** 2) - 0.02, 0, 1)  # exactly 0 away from the edge
    c = np.array([int(tint[i:i + 2], 16) / 255 for i in (1, 3, 5)])
    rgb = np.repeat(img[..., None], 3, axis=2)
    rgb = rgb * (1 - line[..., None]) + c[None, None, :] * line[..., None]
    return np.dstack([rgb, np.ones((n, n))])


def save(bpy, rgba, path):
    """Write through Blender's image API (no PIL in Blender's Python)."""
    n = rgba.shape[0]
    im = bpy.data.images.new("tmp_slice", n, n, alpha=True)
    im.pixels.foreach_set(np.flipud(rgba).astype(np.float32).ravel())
    im.filepath_raw = path
    im.file_format = "PNG"
    im.save()
    bpy.data.images.remove(im)
