# -*- coding: utf-8 -*-
"""官方 Q 版中也 PNG -> 会动的 puppet-custom.svg（稳妥套餐）。

管线：抠透明底(边界泛洪+羽化) -> 眼睛矩形从底图修补掉并裁成独立图层 -> 统一裁边缩放
     -> 组装 SVG(base64 内嵌底图+眼睛图层，矢量 happy/sleepy 眼与 grin/angry/sleepy 嘴)。

依赖 python + PIL + numpy + opencv-python-headless。重复运行即可重建 assets/companion/puppet-custom.svg。
python tools/build_chuuya_puppet.py
"""
import base64
import io
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/companion/src/chuuya-clean.jpg"
OUT = ROOT / "assets/companion/puppet-custom.svg"
DBG = ROOT / "tmp-debug"

# 眼睛矩形（原图坐标 x0,y0,x1,y1）：右界深入发束，发束区按颜色分类（暖棕保留/黑白蓝填充）
EYE_L = (346, 798, 545, 950)
EYE_R = (702, 806, 935, 962)
# 嘴(抿嘴)区域：默认表情用原图烘焙的嘴；happy/angry/sleepy 先用肤色补丁盖住它再画矢量嘴
MOUTH_PATCH = (572, 1016, 682, 1070)
SKIN_MOUTH = (246, 226, 201)      # 嘴周肤色取样
LINE = "#221a14"                  # 矢量线条色（原画描边近黑褐）
SCALE = 0.5                       # 输出缩放（显示高约 200px，留 4 倍余量）

def png_b64(img_rgba):
    buf = io.BytesIO()
    Image.fromarray(img_rgba).save(buf, "png", optimize=True)
    return base64.b64encode(buf.getvalue()).decode("ascii")

def main():
    a = np.array(Image.open(SRC).convert("RGB"))
    H, W = a.shape[:2]
    DBG.mkdir(exist_ok=True)

    # ---------- 1. 抠透明底：近白连通域(接触边界的)设为背景 ----------
    near_white = a.min(axis=2) >= 238
    n, lab = cv2.connectedComponents(near_white.astype(np.uint8), 4)
    border_ids = set(lab[0, :]) | set(lab[-1, :]) | set(lab[:, 0]) | set(lab[:, -1])
    border_ids.discard(0)
    bg = np.isin(lab, list(border_ids))
    print(f"bg pixels: {bg.mean()*100:.1f}%")

    alpha = np.where(bg, 0, 255).astype(np.uint8)
    # 轮廓光晕(JPEG 白边)：贴近背景的浅色像素按白度给半透明
    fringe = cv2.dilate(bg.astype(np.uint8), np.ones((3, 3), np.uint8), iterations=2).astype(bool) & ~bg
    whiteness = np.clip((250 - a.min(axis=2).astype(int)) * 3, 0, 255).astype(np.uint8)
    alpha[fringe] = np.minimum(alpha[fringe], whiteness[fringe])
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0)

    # 调试：透明底叠在洋红底上看边缘
    mag = np.full_like(a, (255, 0, 255), dtype=np.uint8)
    af = alpha.astype(float)[..., None] / 255
    comp = (a * af + mag * (1 - af)).astype(np.uint8)
    Image.fromarray(comp).resize((W // 3, H // 3)).save(DBG / "p-alpha.png")

    # ---------- 2. 眼睛矩形检查：四边必须是皮肤 ----------
    for name, (x0, y0, x1, y1) in (("L", EYE_L), ("R", EYE_R)):
        for label, px in (("上", a[y0, x0:x1]), ("下", a[y1 - 1, x0:x1]),
                          ("左", a[y0:y1, x0]), ("右", a[y0:y1, x1 - 1])):
            v = px.max(axis=1); s = px.max(axis=1) - px.min(axis=1)
            bad = np.where((v < 170) | (s > 70))[0]
            if len(bad):
                xs = x0 + bad if label == "上" else (x0 + bad if label == "下" else
                     (y0 + bad if label == "左" else y0 + bad))
                print(f"[warn] 眼框{name}{label}边有非皮肤像素 v<170/s>70 @ {label}:{bad.min()}-{bad.max()}")

    # ---------- 3. 底图修补眼睛：保留皮肤带/头发区，其余按列在上下皮肤间插值填充 ----------
    base_inp = a.copy()
    for name, (x0, y0, x1, y1), keeps, strip in (
            ("L", EYE_L, [(346, 798, 503, 805),    # 眶顶皮肤带(条带内交给颜色分类)
                          (346, 893, 402, 950)],   # 左下发卷区
             (503, 545)),                          # 右侧条带：发束+睫毛钩+眼白缝缠绕区
            ("R", EYE_R, [(702, 806, 872, 813)],   # 眶顶皮肤带(左段,避开睫毛翼尖)
             (880, 935))):                         # 右侧条带：发帘+睫毛楔缠绕区
        keep = np.zeros((y1 - y0, x1 - x0), bool)
        for kx0, ky0, kx1, ky1 in keeps:
            keep[ky0 - y0:ky1 - y0, kx0 - x0:kx1 - x0] = True
        # 条带内按颜色分类：暖棕(发丝)/皮肤保留，黑白蓝(睫毛/眼白/虹膜)填充
        sx0, sx1 = strip
        sub = a[y0:y1, sx0:sx1].astype(int)
        r_, b_ = sub[..., 0], sub[..., 2]
        v_ = sub.max(axis=2)
        warm = ((r_ - b_ >= 28) & (r_ >= 55) & (v_ >= 95)) | ((v_ >= 170) & (r_ - b_ >= 22))
        # 眼白也是暖白色,颜色无法和皮肤区分 → 先开运算断开抗锯齿暖桥,再按连通性:
        # 接触矩形上/下边的 bulk warm 区 = 皮肤/头发; 被睫毛围住的(眼白缝/晕边) = 填充
        warm_open = cv2.morphologyEx(warm.astype(np.uint8), cv2.MORPH_OPEN,
                                     np.ones((5, 5), np.uint8))
        n_, lab_ = cv2.connectedComponents(warm_open, 4)
        touch = set(np.unique(lab_[:6, :])) | set(np.unique(lab_[-6:, :]))
        touch.discard(0)
        warm_conn = np.isin(lab_, list(touch)).astype(np.uint8)
        sk = np.zeros_like(keep)
        sk[:, sx0 - x0:sx1 - x0] = warm_conn
        sk = cv2.dilate(sk.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
        keep |= sk
        region = a[y0:y1, x0:x1].astype(float)
        h2, w2 = region.shape[:2]
        top_ref = cv2.blur(region[0:6].mean(axis=0)[None], (15, 1))[0]     # (w,3) 眶顶皮肤
        bot_row = region[-6:].mean(axis=0)
        def is_skin(px):
            return (px.max(axis=1) >= 170) & (px[:, 0] - px[:, 2] >= 22)
        col_bot = np.where(is_skin(bot_row)[:, None], bot_row, top_ref)    # 底部非皮肤的列改用顶部色
        col_bot = cv2.blur(col_bot[None], (15, 1))[0]
        t = np.linspace(0, 1, h2)[:, None, None]
        grad = top_ref[None] * (1 - t) + col_bot[None] * t
        valid = is_skin(top_ref) & is_skin(col_bot)                    # 上下都是皮肤的列才可信
        valid[sx0 - x0:sx1 - x0] = False                               # 条带列顶行含睫毛/头发,一律借用外侧列
        if not valid.all():
            idx = np.where(valid)[0]
            if len(idx):
                nearest = idx[np.argmin(np.abs(idx[None] - np.arange(w2)[:, None]), axis=1)]
                grad = grad[:, nearest]                                    # 不可信列借用最近有效列的整列渐变
        fp = np.zeros((h2 + 16, w2 + 16), np.uint8)
        fp[8:-8, 8:-8] = (~keep)
        w = np.clip(cv2.distanceTransform(fp, cv2.DIST_L2, 3)[8:-8, 8:-8] / 5, 0, 1)
        w = np.maximum(w, (region.max(axis=2) < 155))   # 暗/中调(睫毛/轮廓/虹膜边)强制填满,不被羽化带回来
        out = region * (1 - w[..., None]) + grad * w[..., None]
        base_inp[y0:y1, x0:x1] = out.astype(np.uint8)
        print(f"eye {name}: fill {(~keep).mean()*100:.0f}% of rect")
    Image.fromarray(base_inp[700:1100, 250:1010]).save(DBG / "p-eyes-inpainted.png")

    # 眨眼模拟：眼睛图层压到 12% 高贴回修补底图，检查露出区域是否干净
    prev = base_inp.copy()
    for (x0, y0, x1, y1) in (EYE_L, EYE_R):
        crop = a[y0:y1, x0:x1]
        h, w = crop.shape[:2]
        sh = max(2, int(h * 0.12))
        sq = cv2.resize(crop, (w, sh), interpolation=cv2.INTER_AREA)
        cy = (y0 + y1) // 2
        prev[cy - sh // 2:cy - sh // 2 + sh, x0:x1] = sq
    Image.fromarray(prev[700:1100, 250:1010]).save(DBG / "p-blink-sim.png")

    rgba = np.dstack([base_inp, alpha])
    rgba_orig = np.dstack([a, alpha])      # 眼睛图层用原图像素（非修补）

    # ---------- 4. 内容 bbox 裁边 ----------
    ys, xs = np.where(alpha > 0)
    bx0, bx1, by0, by1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    m = 8
    bx0, by0 = max(0, bx0 - m), max(0, by0 - m)
    bx1, by1 = min(W, bx1 + m), min(H, by1 + m)
    print(f"content bbox: x{bx0}-{bx1} y{by0}-{by1} -> {bx1-bx0}x{by1-by0}")

    def crop_shift(x, y):
        return x - bx0, y - by0

    base_crop = rgba[by0:by1, bx0:bx1]
    eyes = {}
    for name, (x0, y0, x1, y1) in (("L", EYE_L), ("R", EYE_R)):
        gx, gy = crop_shift(x0, y0)
        eyes[name] = dict(x=gx, y=gy, w=x1 - x0, h=y1 - y0,
                          img=rgba_orig[y0:y1, x0:x1])  # 眼睛图层用原图像素（非修补）
    mw = MOUTH_PATCH

    # ---------- 5. 缩放 ----------
    def rs(img):
        h, w = img.shape[:2]
        return cv2.resize(img, (round(w * SCALE), round(h * SCALE)), interpolation=cv2.INTER_AREA)

    base_s = rs(base_crop)
    SH, SW = base_s.shape[:2]
    for e in eyes.values():
        e["x"], e["y"], e["w"], e["h"] = (round(e["x"] * SCALE), round(e["y"] * SCALE),
                                          round(e["w"] * SCALE), round(e["h"] * SCALE))
        e["img"] = rs(e["img"])
    S = SCALE

    def P(x, y):   # 原图坐标 -> 输出坐标
        return round((x - bx0) * S), round((y - by0) * S)

    # ---------- 6. 组装 SVG ----------
    lx, ly = eyes["L"]["x"], eyes["L"]["y"]
    rx, ry = eyes["R"]["x"], eyes["R"]["y"]
    # 眼睛中心（输出坐标）：左(427,872) 右(802,874) 原图
    lcx, lcy = P(430, 876); rcx, rcy = P(798, 880)
    mx, my = P(627, 1046)             # 嘴中心
    px0, py0 = P(mw[0], mw[1]); px1, py1 = P(mw[2], mw[3])
    arc = 30 * S                      # 眼弧高差

    def mouth_parts(kind):
        patch = (f'<path d="M{px0-4},{py0-4} h{px1-px0+8} v{py1-py0+8} h-{px1-px0+8} Z" fill="#F6E2C9"/>')
        if kind == "grin":
            x0, y0 = P(560, 1032); x1, y1 = P(694, 1082)
            mid = P(627, 1010); bot = P(627, 1090)
            return patch + (
                f'<path d="M{x0},{y0} Q{mid[0]},{mid[1]} {x1},{y1} '
                f'Q{P(688,1078)[0]},{P(688,1078)[1]} {bot[0]},{bot[1]} '
                f'Q{P(566,1078)[0]},{P(566,1078)[1]} {x0},{y0} Z" fill="#5C2A1E"/>'
                f'<path d="M{P(600,1036)[0]},{P(600,1036)[1]} L{P(614,1036)[0]},{P(614,1036)[1]} '
                f'L{P(607,1050)[0]},{P(607,1050)[1]} Z" fill="#F6E2C9"/>')
        if kind == "angry":
            x0, y0 = P(578, 1030); x1, y1 = P(676, 1030)
            b0, b1 = P(664, 1074), P(590, 1074)
            return patch + (
                f'<path d="M{x0},{y0} Q{P(627,1014)[0]},{P(627,1014)[1]} {x1},{y1} '
                f'L{b0[0]},{b0[1]} Q{P(627,1086)[0]},{P(627,1086)[1]} {b1[0]},{b1[1]} Z" fill="#4a201a"/>'
                f'<path d="M{P(598,1058)[0]},{P(598,1058)[1]} Q{P(627,1070)[0]},{P(627,1070)[1]} '
                f'{P(656,1058)[0]},{P(656,1058)[1]}" stroke="#7a3a30" stroke-width="{7*S:.0f}" fill="none" stroke-linecap="round"/>')
        if kind == "sleepy":
            a0 = P(585, 1046); a1 = P(669, 1046)
            return patch + (
                f'<path d="M{a0[0]},{a0[1]} q{10*S:.0f},-{8*S:.0f} {20*S:.0f},0 q{10*S:.0f},{8*S:.0f} {20*S:.0f},0 '
                f'q{10*S:.0f},-{8*S:.0f} {20*S:.0f},0 q{10*S:.0f},{8*S:.0f} {20*S:.0f},0" '
                f'stroke="{LINE}" stroke-width="{8*S:.1f}" fill="none" stroke-linecap="round"/>')
        return ""

    zzz = "".join(
        f'<text x="{zx}" y="{zy}" font-size="{int(zfont * S)}" '
        f'font-weight="700" fill="{c}">z</text>'
        for i, (zx, zy, zfont, c) in enumerate(((520, 25, 110, "#8a8a92"), (545, 0, 88, "#96969e"), (570, -25, 73, "#a2a2aa"))))

    PADX, PADY, PADRX = 30, 55, 40
    K = 234.0 / (SH + PADY)   # 与内置画稿同坐标系: CSS 动画的单位位移(跳/跺脚)保持设计量级
    VW, VH = (SW + PADX + PADRX) * K, (SH + PADY) * K
    svg = f'''<svg class="puppet" viewBox="0 0 {VW:.2f} {VH:.2f}" xmlns="http://www.w3.org/2000/svg" aria-label="中也">
  <g transform="scale({K:.5f}) translate({PADX},{PADY})">
  <ellipse id="pp-shadow" cx="{SW // 2}" cy="{SH - 6}" rx="{int(215 * S)}" ry="{int(26 * S)}" fill="rgba(35,40,43,.16)"/>
  <g id="pp-act">
  <g id="pp-all">
    <image x="0" y="0" width="{SW}" height="{SH}" href="data:image/png;base64,{png_b64(base_s)}"/>
    <g id="pp-eyes-open">
      <image x="{lx}" y="{ly}" width="{eyes['L']['w']}" height="{eyes['L']['h']}" href="data:image/png;base64,{png_b64(eyes['L']['img'])}"/>
      <image x="{rx}" y="{ry}" width="{eyes['R']['w']}" height="{eyes['R']['h']}" href="data:image/png;base64,{png_b64(eyes['R']['img'])}"/>
    </g>
    <g id="pp-eyes-happy" display="none">
      <path d="M{lcx - int(72 * S)},{lcy + int(6 * S)} Q{lcx},{lcy - int(arc)} {lcx + int(72 * S)},{lcy + int(6 * S)}" stroke="{LINE}" stroke-width="{14 * S:.1f}" fill="none" stroke-linecap="round"/>
      <path d="M{rcx - int(84 * S)},{rcy + int(6 * S)} Q{rcx},{rcy - int(arc)} {rcx + int(84 * S)},{rcy + int(6 * S)}" stroke="{LINE}" stroke-width="{14 * S:.1f}" fill="none" stroke-linecap="round"/>
    </g>
    <g id="pp-eyes-sleepy" display="none">
      <path d="M{lcx - int(72 * S)},{lcy - int(14 * S)} Q{lcx},{lcy + int(22 * S)} {lcx + int(72 * S)},{lcy - int(14 * S)}" stroke="{LINE}" stroke-width="{13 * S:.1f}" fill="none" stroke-linecap="round"/>
      <path d="M{rcx - int(84 * S)},{rcy - int(14 * S)} Q{rcx},{rcy + int(22 * S)} {rcx + int(84 * S)},{rcy - int(14 * S)}" stroke="{LINE}" stroke-width="{13 * S:.1f}" fill="none" stroke-linecap="round"/>
    </g>
    <g id="pp-m-grin" display="none">{mouth_parts("grin")}</g>
    <g id="pp-m-angry" display="none">{mouth_parts("angry")}</g>
    <g id="pp-m-sleepy" display="none">{mouth_parts("sleepy")}</g>
    <g id="pp-zzz" display="none">{zzz}</g>
  </g>
  </g>
  </g>
</svg>
'''
    OUT.write_text(svg, encoding="utf-8")
    print(f"SVG written: {OUT} ({OUT.stat().st_size/1024:.0f} KB, viewBox {VW:.1f}x{VH:.1f}, 内容 {SW}x{SH})")

if __name__ == "__main__":
    main()
