"""Shared helpers for the Selected Work film. Runs inside Blender's Python.

Everything is built from code so a scene can be regenerated from scratch:
no hand-edited .blend files. Labels are not rendered; each scene exports
anchor points projected to screen space and the page draws the labels.
"""

import json
import math

import bmesh
import bpy
import numpy as np
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector, kdtree

SIGNAL = "#FF5A1F"
INK = "#1C1D1F"


# ------------------------------------------------------------------ colour

def lin(hex_):
    """sRGB hex to linear RGB, which is what shader sockets expect."""
    h = hex_.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return tuple(out)


def srgb(hex_):
    h = hex_.lstrip("#")
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])


# ------------------------------------------------------------------ scene

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return bpy.context.scene


def setup_render(scene, samples=128, pct=100, w=1920, h=1080):
    scene.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = d.type == "METAL"
    scene.cycles.device = "GPU"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = "OPENIMAGEDENOISE"
    scene.cycles.max_bounces = 8
    scene.render.resolution_x = w
    scene.render.resolution_y = h
    scene.render.resolution_percentage = pct
    # The ground is a shadow catcher and the film is transparent, so the
    # objects sit directly on the page colour instead of in a grey box.
    scene.render.film_transparent = True
    # Standard, not AgX: AgX desaturates bright orange and the accent must
    # land on the page as the exact signal colour.
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.exposure = -0.25
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"


def world(scene, hex_="#F3F4F6", strength=0.45):
    w = bpy.data.worlds.new("world")
    try:
        w.use_nodes = True
    except AttributeError:
        pass
    bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs["Color"].default_value = (*lin(hex_), 1)
    bg.inputs["Strength"].default_value = strength
    scene.world = w


def link(ob, parent=None):
    bpy.context.scene.collection.objects.link(ob)
    if parent is not None:
        ob.parent = parent
    return ob


def empty(name, loc=(0, 0, 0), parent=None):
    ob = bpy.data.objects.new(name, None)
    ob.location = loc
    return link(ob, parent)


def aim(ob, target):
    d = Vector(target) - ob.location
    ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def camera(name, loc, target, lens=35):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.sensor_width = 36
    ob = link(bpy.data.objects.new(name, cd))
    ob.location = loc
    aim(ob, target)
    return ob


def area_light(name, loc, target, size, energy, shape="DISK"):
    ld = bpy.data.lights.new(name, "AREA")
    ld.shape = shape
    ld.size = size
    ld.energy = energy
    ob = link(bpy.data.objects.new(name, ld))
    ob.location = loc
    aim(ob, target)
    return ob


def shadow_ground(size=400):
    me = bpy.data.meshes.new("ground")
    s = size / 2
    me.from_pydata([(-s, -s, 0), (s, -s, 0), (s, s, 0), (-s, s, 0)], [], [(0, 1, 2, 3)])
    ob = link(bpy.data.objects.new("ground", me))
    ob.is_shadow_catcher = True
    return ob


# ------------------------------------------------------------------ materials

def _new_material(name):
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except AttributeError:
        pass
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    return m, nt, out


def principled(name, hex_, rough=0.5, emit=None, emit_strength=0.0, **inputs):
    m, nt, out = _new_material(name)
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Base Color"].default_value = (*lin(hex_), 1)
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = (*lin(emit), 1)
        b.inputs["Emission Strength"].default_value = emit_strength
    for k, v in inputs.items():
        b.inputs[k.replace("_", " ")].default_value = v
    nt.links.new(b.outputs[0], out.inputs["Surface"])
    return m


def flat(name, hex_, strength=1.0):
    """Unlit colour. Used for the annotation lines so they read as ink."""
    m, nt, out = _new_material(name)
    e = nt.nodes.new("ShaderNodeEmission")
    e.inputs["Color"].default_value = (*lin(hex_), 1)
    e.inputs["Strength"].default_value = strength
    nt.links.new(e.outputs[0], out.inputs["Surface"])
    return m


def reveal_ink(name, hex_, strength=1.0):
    """Ink that is drawn on along an ink_path's "t" as its value goes 0 -> 1.

    Returns the material and the value socket to keyframe.
    """
    m, nt, out = _new_material(name)
    e = nt.nodes.new("ShaderNodeEmission")
    e.inputs["Color"].default_value = (*lin(hex_), 1)
    e.inputs["Strength"].default_value = strength
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "t"
    val = nt.nodes.new("ShaderNodeValue")
    val.outputs[0].default_value = 0.0
    gt = nt.nodes.new("ShaderNodeMath")
    gt.operation = "GREATER_THAN"
    nt.links.new(attr.outputs["Fac"], gt.inputs[0])
    nt.links.new(val.outputs[0], gt.inputs[1])
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(gt.outputs[0], mix.inputs[0])
    nt.links.new(e.outputs[0], mix.inputs[1])
    nt.links.new(nt.nodes.new("ShaderNodeBsdfTransparent").outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    return m, val.outputs[0]


def _socket(sockets, name, type_):
    return next(s for s in sockets if s.name == name and s.type == type_)


def image_plate(name, image_path, plate_hex="#F4F4F2"):
    """Frosted white plate with a printed image; image alpha picks print vs plate."""
    m, nt, out = _new_material(name)
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(image_path)
    tex.image.alpha_mode = "STRAIGHT"
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    _socket(mix.inputs, "A", "RGBA").default_value = (*lin(plate_hex), 1)
    nt.links.new(tex.outputs["Alpha"], mix.inputs["Factor"])
    nt.links.new(tex.outputs["Color"], _socket(mix.inputs, "B", "RGBA"))
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Roughness"].default_value = 0.38
    nt.links.new(_socket(mix.outputs, "Result", "RGBA"), b.inputs["Base Color"])
    # The print glows faintly, like film on a light box, so the scan stays
    # readable when the plate turns away from the key light.
    nt.links.new(tex.outputs["Color"], b.inputs["Emission Color"])
    amul = nt.nodes.new("ShaderNodeMath")
    amul.operation = "MULTIPLY"
    amul.inputs[1].default_value = 0.35
    nt.links.new(tex.outputs["Alpha"], amul.inputs[0])
    nt.links.new(amul.outputs[0], b.inputs["Emission Strength"])
    nt.links.new(b.outputs[0], out.inputs["Surface"])
    return m


# ------------------------------------------------------------------ meshes

def set_smooth(me):
    me.polygons.foreach_set("use_smooth", np.ones(len(me.polygons), bool))


def mesh_object(name, verts, faces, mat=None, parent=None, smooth=True, recalc=True, uvs=None):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(map(float, v)) for v in verts], [], [tuple(f) for f in faces])
    if recalc:
        bm = bmesh.new()
        bm.from_mesh(me)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(me)
        bm.free()
    if uvs is not None:
        layer = me.uv_layers.new(name="UVMap")
        for loop in me.loops:
            layer.data[loop.index].uv = uvs[loop.vertex_index]
    if smooth:
        set_smooth(me)
    me.update()
    ob = link(bpy.data.objects.new(name, me), parent)
    if mat:
        ob.data.materials.append(mat)
    return ob


def ico(name, subdiv):
    """Unit icosphere as (mesh, vertex array) for numpy displacement."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=1.0)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    co = np.empty(len(me.vertices) * 3, np.float32)
    me.vertices.foreach_get("co", co)
    return me, co.reshape(-1, 3).astype(np.float64)


def set_co(me, co):
    me.vertices.foreach_set("co", co.astype(np.float32).ravel())
    me.update()


def vnormals(me):
    n = np.empty(len(me.vertices) * 3, np.float32)
    me.vertex_normals.foreach_get("vector", n)
    return n.reshape(-1, 3).astype(np.float64)


def finish(me, name, mat=None, parent=None, loc=(0, 0, 0)):
    set_smooth(me)
    me.update()
    ob = link(bpy.data.objects.new(name, me), parent)
    ob.location = loc
    if mat:
        ob.data.materials.append(mat)
    return ob


def bevel(ob, width, segments=4, angle=40):
    m = ob.modifiers.new("bevel", "BEVEL")
    m.width = width
    m.segments = segments
    m.limit_method = "ANGLE"
    m.angle_limit = math.radians(angle)
    m.harden_normals = True
    return m


def box(name, size, loc, mat, round_=0.02, parent=None):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = finish(me, name, mat, parent, loc)
    if round_:
        bevel(ob, round_)
    return ob


def plate(name, size_y, size_z, thickness, loc, mat, round_=0.006, parent=None):
    """Thin plate facing -X (towards the start of the chain), UV 0..1 on the face.

    Seen from -X, screen right is -Y, so u grows towards -Y.
    """
    hy, hz = size_y / 2, size_z / 2
    verts = [(0, hy, -hz), (0, -hy, -hz), (0, -hy, hz), (0, hy, hz)]
    uvs = [(0, 0), (1, 0), (1, 1), (0, 1)]
    ob = mesh_object(name, verts, [(0, 1, 2, 3)], mat, parent, smooth=False, recalc=False, uvs=uvs)
    ob.location = loc
    s = ob.modifiers.new("solidify", "SOLIDIFY")
    s.thickness = thickness
    s.offset = 0
    if round_:
        bevel(ob, round_, segments=3)
    return ob


def rounded_rect(x0, x1, r0, r1, rc, seg=6):
    """Closed CCW loop in the (x, r) plane with rounded corners."""
    pts = []
    corners = [(x1 - rc, r0 + rc, -90), (x1 - rc, r1 - rc, 0), (x0 + rc, r1 - rc, 90), (x0 + rc, r0 + rc, 180)]
    for cx, cr, a0 in corners:
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + rc * math.cos(a), cr + rc * math.sin(a)))
    return pts


def lathe(name, profile, mat=None, steps=160, loc=(0, 0, 0), parent=None):
    """Spin an (x, r) profile around the X axis."""
    n = len(profile)
    verts, faces = [], []
    for j in range(steps):
        a = 2 * math.pi * j / steps
        ca, sa = math.cos(a), math.sin(a)
        for x, r in profile:
            verts.append((x, r * ca, r * sa))
    for j in range(steps):
        jn = (j + 1) % steps
        for i in range(n):
            i2 = (i + 1) % n
            faces.append((j * n + i, j * n + i2, jn * n + i2, jn * n + i))
    ob = mesh_object(name, verts, faces, mat, parent)
    ob.location = loc
    return ob


# ------------------------------------------------------------------ annotation lines

def bezier(p0, p1, p2, p3, n=64):
    p0, p1, p2, p3 = map(np.asarray, (p0, p1, p2, p3))
    t = np.linspace(0, 1, n)[:, None]
    return (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3


def _resample(pts, step):
    pts = np.asarray(pts, float)
    seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    n = max(2, int(s[-1] / step) + 1)
    ss = np.linspace(0, s[-1], n)
    return np.stack([np.interp(ss, s, pts[:, k]) for k in range(3)], 1), ss


def _frame(t):
    a = np.array([0, 0, 1.0]) if abs(t[2]) < 0.9 else np.array([0, 1.0, 0])
    u = np.cross(t, a)
    u /= np.linalg.norm(u)
    return u, np.cross(t, u)


def _tube(V, F, P, r, sides):
    base = len(V)
    for i in range(len(P)):
        t = P[min(i + 1, len(P) - 1)] - P[max(i - 1, 0)]
        t = t / np.linalg.norm(t)
        u, v = _frame(t)
        for k in range(sides):
            a = 2 * math.pi * k / sides
            V.append(P[i] + r * (math.cos(a) * u + math.sin(a) * v))
    for i in range(len(P) - 1):
        for k in range(sides):
            a = base + i * sides + k
            b = base + i * sides + (k + 1) % sides
            F.append((a, b, b + sides, a + sides))
    F.append(tuple(base + k for k in range(sides))[::-1])
    F.append(tuple(base + (len(P) - 1) * sides + k for k in range(sides)))


def _cone(V, F, tip, t, length, radius, sides=12):
    u, v = _frame(t)
    base = len(V)
    c = tip - t * length
    for k in range(sides):
        a = 2 * math.pi * k / sides
        V.append(c + radius * (math.cos(a) * u + math.sin(a) * v))
    V.append(tip)
    for k in range(sides):
        F.append((base + k, base + (k + 1) % sides, base + sides))
    F.append(tuple(base + k for k in range(sides))[::-1])


def ink_path(name, pts, mat, r=0.0055, dash=None, gap=None, arrow=True, parent=None):
    """A hairline drawn in 3D: solid or dashed, with an optional arrowhead.

    Lines cast no shadow and take no part in lighting, so they behave like
    ink on top of the render while still moving with the camera. Every vertex
    carries "t", its position along the line from 0 to 1, so a reveal_ink
    material can draw the line on.
    """
    P, ss = _resample(pts, 0.004)
    head = 0.055 if arrow else 0
    keep = ss <= ss[-1] - head * 0.8
    V, F = [], []
    if dash:
        period = dash + gap
        on = (ss % period) < dash
        idx = np.where(on & keep)[0]
        if len(idx):
            runs = np.split(idx, np.where(np.diff(idx) > 1)[0] + 1)
            for run in runs:
                if len(run) >= 2:
                    _tube(V, F, P[run], r, 6)
    else:
        _tube(V, F, P[keep], r, 6)
    if arrow:
        t = P[-1] - P[-4]
        _cone(V, F, P[-1], t / np.linalg.norm(t), head, r * 3.6)
    ob = mesh_object(name, V, F, mat, parent, smooth=False, recalc=False)
    kd = kdtree.KDTree(len(P))
    for i, q in enumerate(P):
        kd.insert(q, i)
    kd.balance()
    t = np.array([ss[kd.find(v)[1]] for v in V]) / ss[-1]
    ob.data.attributes.new("t", "FLOAT", "POINT").data.foreach_set("value", t.astype(np.float32))
    ob.visible_shadow = False
    ob.visible_diffuse = False
    ob.visible_glossy = False
    ob.visible_transmission = False
    return ob


# ------------------------------------------------------------------ anchors

def export_anchors(scene, cam, anchors, path, frame=None):
    """Project named 3D points to normalised screen space (y down) for the page."""
    if frame is not None:
        scene.frame_set(frame)
    out = {}
    for name, ob in anchors.items():
        p = world_to_camera_view(scene, cam, ob.matrix_world.translation)
        out[name] = [round(p.x, 5), round(1 - p.y, 5), round(p.z, 4)]
    with open(path, "w") as f:
        json.dump({"w": scene.render.resolution_x, "h": scene.render.resolution_y, "anchors": out}, f, indent=1)


def project(scene, cam, anchors):
    """Anchors in normalised screen space (y down) at the current frame."""
    out = {}
    for name, ob in anchors.items():
        p = world_to_camera_view(scene, cam, ob.matrix_world.translation)
        out[name] = [round(p.x, 5), round(1 - p.y, 5), round(p.z, 4)]
    return out


def key(owner, path, frame, value):
    """Set and keyframe a property (object attribute or node socket)."""
    setattr(owner, path, value)
    owner.keyframe_insert(path, frame=frame)


def flatten(path, hex_):
    """Write <name>-flat.png: the transparent render over the page colour, for review."""
    im = bpy.data.images.load(path)
    px = np.empty(im.size[0] * im.size[1] * 4, np.float32)
    im.pixels.foreach_get(px)
    px = px.reshape(-1, 4)
    a = px[:, 3:4]
    px[:, :3] = px[:, :3] * a + srgb(hex_)[None, :] * (1 - a)
    px[:, 3] = 1
    im.pixels.foreach_set(px.ravel())
    im.filepath_raw = path.replace(".png", "-flat.png")
    im.save()
    bpy.data.images.remove(im)


# ------------------------------------------------------------------ film plumbing
# Every chapter is one Blender script with the same CLI and the same output:
#   <out>/frames/NNNN.png (transparent, 1920x1080) and <out>/film.json
# film.json = {frames, w, h, labels, appear, vanish, anchors}. "labels" is the
# list the page draws (see film/scrub.html for the types), "appear"/"vanish"
# map a label key to the frame it fades in / out, "anchors" holds every anchor
# projected for every frame as [x, y_down, depth].
#
# The film plays each scene in half steps: the scripts animate on whole scene
# frames 1..FRAMES, and film frame o shows scene time 1 + (o - 1) / SUB. Odd
# film frames are whole scene frames, so a render made at one frame per scene
# frame stays valid once renumbered (k -> 2k - 1), and only the half steps
# between them need rendering ("--frames between"). film.json counts film frames.

KEY_OFFSET = (-2.0, -4.5, 7.35)  # the key light sits here relative to the camera target
SUB = 2  # film frames per scene frame


def film_count(frames):
    """Film frames for a scene animated over `frames` whole frames."""
    return (frames - 1) * SUB + 1


def film_frame(f):
    """The film frame that shows whole scene frame f."""
    return (f - 1) * SUB + 1


def set_time(scene, o):
    """Move the scene to film frame o, between whole frames when o is even."""
    t = 1 + (o - 1) / SUB
    scene.frame_set(int(t), subframe=t - int(t))


def film_args(frames):
    import argparse
    import sys
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--frames", default="", help="film frames: all, between, a:b:step or a,b,c")
    ap.add_argument("--pct", type=int, default=50)
    ap.add_argument("--samples", type=int, default=64)
    ap.add_argument("--blend", action="store_true")
    args = ap.parse_args(argv)
    spec = args.frames
    n = film_count(frames)
    if spec == "all":
        args.frame_list = list(range(1, n + 1))
    elif spec == "between":  # only the half steps, next to a render renumbered k -> 2k - 1
        args.frame_list = [o for o in range(1, n + 1) if (o - 1) % SUB]
    elif ":" in spec:
        a, b, *c = (int(v) for v in spec.split(":"))
        args.frame_list = list(range(a, b + 1, c[0] if c else 1))
    else:
        args.frame_list = [int(v) for v in spec.split(",") if v]
    return args


def studio(scene, samples, pct):
    """Render settings, page-coloured world and the shadow-catcher ground."""
    setup_render(scene, samples=samples, pct=pct)
    world(scene, "#F3F4F6", 0.45)
    shadow_ground()


def film_camera(scene, keys):
    """One camera driven by [(frame, location, target, lens)].

    The key light rides on the camera target, so whatever the camera looks at
    is lit the same way in every chapter, which keeps the cuts invisible.
    """
    tgt = empty("cam_target", keys[0][2])
    cam = camera("cam_film", keys[0][1], keys[0][2], keys[0][3])
    c = cam.constraints.new("TRACK_TO")
    c.target, c.track_axis, c.up_axis = tgt, "TRACK_NEGATIVE_Z", "UP_Y"
    for f, loc, target, lens in keys:
        key(cam, "location", f, loc)
        key(tgt, "location", f, target)
        key(cam.data, "lens", f, lens)
    ld = bpy.data.lights.new("key", "AREA")
    ld.shape, ld.size, ld.energy = "DISK", 9, 1100
    light = link(bpy.data.objects.new("key", ld), tgt)
    light.location = KEY_OFFSET
    light.rotation_euler = (-Vector(KEY_OFFSET)).to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam
    return cam


def render_film(scene, cam, anchors, frames, args, labels, appear, vanish=None):
    """Write film.json (anchors for every film frame) and render the requested film frames.

    `frames`, `appear` and `vanish` are in scene frames; film.json is in film frames.
    """
    import os
    os.makedirs(args.out, exist_ok=True)
    scene.frame_start, scene.frame_end = 1, frames
    n = film_count(frames)
    track = {k: [] for k in anchors}
    for o in range(1, n + 1):
        set_time(scene, o)
        for k, v in project(scene, cam, anchors).items():
            track[k].append(v)
    appear = {k: film_frame(f) for k, f in appear.items()}
    vanish = {k: film_frame(f) for k, f in (vanish or {}).items()}
    with open(os.path.join(args.out, "film.json"), "w") as fh:
        json.dump({"frames": n, "w": scene.render.resolution_x, "h": scene.render.resolution_y,
                   "labels": labels, "appear": appear, "vanish": vanish, "anchors": track},
                  fh, separators=(",", ":"))
    fdir = os.path.join(args.out, "frames")
    os.makedirs(fdir, exist_ok=True)
    for o in args.frame_list:
        set_time(scene, o)
        scene.render.filepath = os.path.join(fdir, f"{o:04d}.png")
        bpy.ops.render.render(write_still=True)
    if args.blend:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(args.out, "scene.blend"))


# ------------------------------------------------------------------ chapter handoffs
# Chapter N ends on one object alone at a fixed camera pose relative to it, and
# chapter N+1 opens on the identical object (built by the same function below,
# in its rest state) at the identical pose, then transforms it. Coordinates are
# chapter-local: each chapter picks its own handoff point. On the seam frame
# the camera target must equal the point, so the key light matches too.

HANDOFF = {
    # name: (camera offset from the point, lens)
    "card": ((0.0, -3.3, 0.55), 50),     # 01 brain > 02 legal: the orange Improving card, upright
    "page": ((0.0, -1.75, 2.6), 50),     # 02 legal > 03 kernelnet: the report page lying flat
    "network": ((0.0, -6.2, 5.2), 40),   # 03 kernelnet > 04 stellar: 13 nodes on the ground
}


def handoff_key(frame, name, point):
    """A camera key (frame, location, target, lens) at the handoff pose."""
    off, lens = HANDOFF[name]
    return (frame, tuple(float(v) for v in np.add(point, off)), tuple(float(v) for v in point), lens)


CARD = (1.45, 0.06, 0.36)  # width (x), thickness (y), height (z)


def improving_card(point, parent=None):
    """The orange "Improving" card standing upright, centred on point.

    Returns (object, material). Label on the page:
      {"type": "card", "t": "Improving", "k": "improving", "cls": "good"}
    with anchors improving / improving_l / improving_r = point + (0 | -w/2 | +w/2, -0.06, 0).
    """
    m = principled("card_improving", SIGNAL, rough=0.35, emit=SIGNAL, emit_strength=0.5)
    return box("card_improving", CARD, point, m, 0.03, parent), m


PAGE = (0.85, 1.1, 0.012)  # width (x), depth (y), thickness (z); "up" on the page is +y


def price_series(n=64):
    """Two co-moving daily price paths, normalised 0..1: ITUB4 leads, BBDC4 follows ~4 days later."""
    rng = np.random.default_rng(7)
    lead = np.cumsum(rng.normal(0, 1, n + 16))
    lead = np.convolve(lead, np.ones(3) / 3, "same")  # trimmed below, away from the edges
    a = lead[10:n + 10]
    b = lead[6:n + 6] * 0.92 + np.cumsum(rng.normal(0, 0.35, n))
    out = []
    for s in (a, b):
        s = (s - s.min()) / (s.max() - s.min())
        out.append(s)
    return out  # [itub4, bbdc4]


def report_page(point, parent=None):
    """The synthesized report lying flat on the ground, centred on point (x, y; z ignored).

    Printed on it: a title bar, a two-line price chart (ITUB4 in signal orange,
    BBDC4 in ink) and rows of text. Returns a dict with the objects
    (page, curves=[itub4, bbdc4], axes, text) and "chart": the chart rectangle
    (x0, x1, y0, y1) in world coordinates plus the curve point lists, so a
    chapter can lift the curves off the page.
    """
    px, py = point[0], point[1]
    top = PAGE[2]
    paper = principled("report_paper", "#F7F7F5", rough=0.4)
    bar = principled("report_bar", INK, rough=0.5)
    row = principled("report_row", "#C9CAC7", rough=0.5)
    ink_m = flat("report_ink", INK)
    sig_m = flat("report_signal", SIGNAL, 1.2)
    root = empty("report", (0, 0, 0), parent)
    page = box("report_page", PAGE, (px, py, top / 2), paper, 0.004, root)
    z = top + 0.0015
    text = [box("report_title", (0.38, 0.034, 0.003), (px - 0.405 + 0.19 + 0.06, py + 0.46, z), bar, 0.0, root),
            box("report_sub", (0.24, 0.016, 0.002), (px - 0.405 + 0.12 + 0.06, py + 0.415, z), row, 0.0, root)]
    for i, w in enumerate((0.70, 0.66, 0.70, 0.52, 0.70, 0.68, 0.44)):
        text.append(box(f"report_row{i}", (w, 0.014, 0.002), (px - 0.35 + w / 2, py - 0.09 - 0.058 * i, z), row, 0.0, root))
    x0, x1, y0, y1 = px - 0.33, px + 0.33, py + 0.02, py + 0.34
    axes = ink_path("report_axes", [(x0, y1, z + 0.002), (x0, y0, z + 0.002), (x1, y0, z + 0.002)], ink_m, r=0.0022, arrow=False, parent=root)
    curves, pts = [], []
    for name, s, m in (("itub4", price_series()[0], sig_m), ("bbdc4", price_series()[1], ink_m)):
        xs = np.linspace(x0 + 0.02, x1 - 0.01, len(s))
        ys = y0 + 0.03 + s * (y1 - y0 - 0.06)
        P = [(float(a), float(b), z + 0.004) for a, b in zip(xs, ys)]
        curves.append(ink_path(f"report_{name}", P, m, r=0.0035, arrow=False, parent=root))
        pts.append(P)
    return dict(root=root, page=page, curves=curves, axes=axes, text=text, chart=dict(rect=(x0, x1, y0, y1), points=pts))


NETWORK = {
    # ticker: (x, y) relative to the handoff point; nodes rest on the ground
    "ITUB4": (0.0, 0.25), "BBDC4": (1.15, -0.35), "BBAS3": (-1.2, -0.45), "SANB11": (0.55, 1.2),
    "ITSA4": (-0.6, 1.25), "BPAC11": (1.95, 0.75), "B3SA3": (-2.05, 0.55), "PETR4": (2.6, -0.6),
    "VALE3": (-2.55, -0.75), "ABEV3": (0.2, -1.25), "WEGE3": (-1.35, 1.55), "BBSE3": (1.55, 1.75),
    "RENT3": (-0.95, -1.5),
}
NETWORK_EDGES = [  # (a, b, weight 0..1): kernel Granger strength
    ("ITUB4", "BBDC4", 1.0), ("ITUB4", "BBAS3", 0.8), ("ITUB4", "SANB11", 0.75), ("ITUB4", "ITSA4", 0.85),
    ("ITUB4", "BPAC11", 0.6), ("ITUB4", "B3SA3", 0.45), ("BBDC4", "PETR4", 0.3), ("BBAS3", "VALE3", 0.3),
    ("BBDC4", "ABEV3", 0.25), ("ITSA4", "WEGE3", 0.25), ("SANB11", "BBSE3", 0.35), ("BBAS3", "RENT3", 0.25),
    ("BPAC11", "BBSE3", 0.3), ("B3SA3", "WEGE3", 0.2), ("ABEV3", "RENT3", 0.2), ("PETR4", "BPAC11", 0.2),
]
NODE_R = 0.17
DRIVER = "ITUB4"


def network(point, parent=None):
    """The KernelNet graph at rest, around point (x, y; z ignored).

    Nodes are white plastic spheres resting on the ground, the driver (ITUB4,
    highest eigenvector centrality) is signal orange; edges are ink tubes at
    node-centre height, thicker for stronger causality. Returns a dict:
    nodes {ticker: object}, edges {(a, b): object}, materials, and pos {ticker: (x, y, z)}.
    Page labels: {"type": "tag", "t": ticker, "k": "node_" + ticker} with the
    anchor at the node centre + (0, 0, NODE_R + 0.14).
    """
    white = principled("node_white", "#F2F2F0", rough=0.32)
    driver = principled("node_driver", SIGNAL, rough=0.35, emit=SIGNAL, emit_strength=0.5)
    ink_m = flat("edge_ink", INK)
    root = empty("network", (0, 0, 0), parent)
    pos = {t: (point[0] + x, point[1] + y, NODE_R) for t, (x, y) in NETWORK.items()}
    nodes = {}
    for t, p in pos.items():
        me, d = ico(f"node_{t}", 4)
        set_co(me, d * NODE_R)
        nodes[t] = finish(me, f"node_{t}", driver if t == DRIVER else white, root, p)
    edges = {}
    for a, b, w in NETWORK_EDGES:
        pa, pb = np.array(pos[a]), np.array(pos[b])
        u = (pb - pa) / np.linalg.norm(pb - pa)
        edges[(a, b)] = ink_path(f"edge_{a}_{b}", [pa + u * NODE_R * 1.05, pb - u * NODE_R * 1.05], ink_m,
                                 r=0.003 + 0.006 * w, arrow=False, parent=root)
    return dict(root=root, nodes=nodes, edges=edges, pos=pos, white=white, driver=driver, ink=ink_m)
