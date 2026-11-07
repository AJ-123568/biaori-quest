# 败部复活按钮悬停彩蛋图处理：源图是 QQ 的棋盘格假透明底（alpha 全 255，棋盘画在像素里），
# 从四边 flood-fill 浅灰低饱和背景（棋盘两色≈254/223，R=G=B）遇描边停住 → 真透明 →
# 按人物边界裁剪 + 缩到显示高度的 4 倍 → 输出 PNG。
# 用法：python tools/make_revive_peek.py <源图> <输出.png> [显示高度的倍数=4]
import sys
from collections import deque
from PIL import Image

BR_MIN = 200    # 亮度下限：棋盘亮格 ~254 / 灰格 ~223 都在之上
SAT_MAX = 14    # 低饱和上限（通道最大差）：棋盘 R=G=B 差 0~2，人物淡紫头发差更大


def is_bg(px):
    r, g, b = px[0], px[1], px[2]
    return min(r, g, b) >= BR_MIN - 25 and max(r, g, b) - min(r, g, b) <= SAT_MAX


def main():
    src, dst = sys.argv[1], sys.argv[2]
    scale = float(sys.argv[3]) if len(sys.argv) > 3 else 4.0
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    px = im.load()

    mask = bytearray(w * h)   # 1=背景
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg(px[x, y]) and not mask[y * w + x]:
                mask[y * w + x] = 1
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg(px[x, y]) and not mask[y * w + x]:
                mask[y * w + x] = 1
                q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not mask[ny * w + nx] and is_bg(px[nx, ny]):
                mask[ny * w + nx] = 1
                q.append((nx, ny))

    alpha = Image.new("L", im.size, 255)
    ap = alpha.load()
    for y in range(h):
        row = y * w
        for x in range(w):
            if mask[row + x]:
                ap[x, y] = 0
    bg_n = sum(mask)
    print(f"背景 {bg_n}/{w*h} = {bg_n*100//(w*h)}%")

    out = im.copy()
    out.putalpha(alpha)
    bbox = alpha.getbbox()
    print("人物边界", bbox)
    pad = 8
    l, t, r, b = bbox
    crop = out.crop((max(0, l - pad), max(0, t - pad), min(w, r + pad), min(h, b + pad)))
    th = 208   # 按钮显示高 52px × 4
    tw = round(crop.width * th / crop.height)
    out2 = crop.resize((tw, th), Image.LANCZOS)
    out2.save(dst, optimize=True)
    import os
    print("输出", out2.size, os.path.getsize(dst), "bytes ->", dst)


if __name__ == "__main__":
    main()
