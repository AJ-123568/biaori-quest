# -*- coding: utf-8 -*-
"""
把中也小狗源图(棋盘格假透明 JPG)抠成透明 PNG,输出光标/拖尾两个尺寸。
原理: 从图片四边向内 flood-fill 浅色低饱和背景(棋盘两种灰 + 渐白角落),
遇小狗深色描边停住(体内白毛被描边隔开不会被误抠);
再 1px 腐蚀去白晕、轻微羽化、裁切到内容范围。
用法: python tools/make_cursor_dogs.py
输出: assets/cursor/dog-wide.png      拖尾用(160px 高)
      assets/cursor/dog-wide-cur.png  光标用(48x48 方形, CSS 热点见运行输出)
自检图(铺在深浅两种底色上)写到系统临时目录, 肉眼确认抠图质量。
"""
from pathlib import Path
import tempfile

import numpy as np
from PIL import Image, ImageFilter

SRC = Path(r"C:\Users\86182\Documents\Tencent Files\2339101097\nt_qq\nt_data"
           r"\Pic\2026-09\Thumb\75bed63f10134f1979061d81ca6e5225_720.jpg")
ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "assets" / "cursor"

TRAIL_H = 160   # 拖尾图高度(拖尾显示 ~32px, 留足 2x/3x 屏余量)
CUR_BOX = 48    # 光标画布边长(部分浏览器拒绝 >128 的光标图, 48 安全)
BG_MIN = 212    # 背景判定: 三通道最小值不低于此(棋盘灰实测 229~249)
BG_SPREAD = 26  # 背景判定: 通道极差不超过此(低饱和)


def dilate(m):
    """4 邻域膨胀一步(bool 数组)。"""
    out = m.copy()
    out[1:, :] |= m[:-1, :]
    out[:-1, :] |= m[1:, :]
    out[:, 1:] |= m[:, :-1]
    out[:, :-1] |= m[:, 1:]
    return out


def cutout(path):
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(np.int16)
    h, w, _ = a.shape
    mn = a.min(axis=2)
    spread = a.max(axis=2) - mn
    bg_like = (mn >= BG_MIN) & (spread <= BG_SPREAD)

    # 种子 = 四边所有疑似背景像素, 逐像素向内扩张(即连通 flood-fill)
    region = np.zeros((h, w), bool)
    region[0, :] = bg_like[0, :]
    region[-1, :] = bg_like[-1, :]
    region[:, 0] |= bg_like[:, 0]
    region[:, -1] |= bg_like[:, -1]
    while True:
        grow = dilate(region) & bg_like & ~region
        if not grow.any():
            break
        region |= grow

    # 只保留狗主体的连通域, 丢掉断开的碎渣(源图底边切断的描边残片等)
    subject = ~region
    ys, xs = np.where(subject)
    c = np.argmin((ys - h / 2) ** 2 + (xs - w / 2) ** 2)
    main = np.zeros((h, w), bool)
    main[ys[c], xs[c]] = True
    while True:
        grow = dilate(main) & subject & ~main
        if not grow.any():
            break
        main |= grow

    # 主体腐蚀 1px 吃掉描边外的浅色过渡晕, 再轻微羽化
    alpha = (~dilate(~main)).astype(np.uint8) * 255
    alpha_im = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.7))

    rgba = im.convert("RGBA")
    rgba.putalpha(alpha_im)
    return rgba.crop(rgba.getbbox())


def make_trail(dog):
    th = TRAIL_H
    tw = max(1, round(dog.width * th / dog.height))
    dog.resize((tw, th), Image.LANCZOS).save(OUT_DIR / "dog-wide.png", optimize=True)


def make_cursor(dog):
    """狗放进 CUR_BOX 方形画布, 热点定在头顶最高点(打印给 CSS 用)。"""
    scale = min((CUR_BOX - 4) / dog.height, (CUR_BOX - 4) / dog.width)
    dw, dh = max(1, round(dog.width * scale)), max(1, round(dog.height * scale))
    small = dog.resize((dw, dh), Image.LANCZOS)
    cur = Image.new("RGBA", (CUR_BOX, CUR_BOX), (0, 0, 0, 0))
    cur.paste(small, ((CUR_BOX - dw) // 2, 2), small)

    arr = np.asarray(cur)[:, :, 3]
    ys, xs = np.where(arr > 128)
    top = ys.min()
    hx = int(round(xs[ys <= top + 2].mean()))  # 头顶最高处的质心 x
    cur.save(OUT_DIR / "dog-wide-cur.png", optimize=True)
    return hx, top


def check_render(dog):
    """铺深/浅两种底色渲染, 供肉眼检查残留/白晕/破洞。"""
    for name, bg in (("dark", (51, 81, 142)), ("light", (238, 241, 238))):
        canvas = Image.new("RGB", (dog.width + 40, dog.height + 40), bg)
        canvas.paste(dog, (20, 20), dog)
        canvas.save(Path(tempfile.gettempdir()) / f"cursor_check_{name}.png")


def main():
    dog = cutout(SRC)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    make_trail(dog)
    hx, hy = make_cursor(dog)
    check_render(dog)
    tmp = Path(tempfile.gettempdir())
    print(f"抠图完成: 内容 {dog.width}x{dog.height}")
    print(f"光标热点 CSS: url(...) {hx} {hy + 2}")
    print(f"自检图: {tmp}\\cursor_check_dark.png / cursor_check_light.png")


if __name__ == "__main__":
    main()
