"""Draws the Rega app icons as PNG with the standard library only (no Pillow needed).

The mark is a soft glowing circle on a night-blue background, the same orb used in the breathing screen.
Usage: python3 -I scripts/make_icons.py public/icons
"""
import math
import os
import struct
import sys
import zlib

BG_TOP = (21, 28, 52)
BG_BOTTOM = (11, 15, 28)
ORB = (108, 196, 178)
ORB_DEEP = (44, 108, 134)


def mix(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def pixel(x, y, size, orb_ratio):
    u, v = x / size, y / size
    color = mix(BG_TOP, BG_BOTTOM, v)
    cx = cy = 0.5
    r = orb_ratio / 2
    d = math.hypot(u - cx, v - cy)
    # Outer glow.
    glow = max(0.0, 1 - (d - r) / (r * 0.55)) if d > r else 0.0
    color = mix(color, ORB, 0.35 * glow**2)
    if d <= r:
        # Body of the orb, darker toward the edge, with a highlight up and to the left.
        edge = d / r
        body = mix(ORB, ORB_DEEP, edge**1.6)
        hl = math.hypot(u - (cx - r * 0.3), v - (cy - r * 0.35)) / (r * 0.75)
        body = mix(body, (255, 255, 255), max(0.0, 1 - hl) ** 2 * 0.55)
        aa = min(1.0, (r - d) * size)  # anti-aliased rim
        color = mix(color, body, aa)
    return tuple(int(max(0, min(255, c))) for c in color)


def write_png(path, size, orb_ratio):
    rows = bytearray()
    for y in range(size):
        rows.append(0)
        for x in range(size):
            rows.extend(pixel(x + 0.5, y + 0.5, size, orb_ratio))

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(rows), 9)) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


def main(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    write_png(os.path.join(out_dir, "icon-192.png"), 192, 0.56)
    write_png(os.path.join(out_dir, "icon-512.png"), 512, 0.56)
    write_png(os.path.join(out_dir, "maskable-512.png"), 512, 0.44)  # stays inside the maskable safe zone
    write_png(os.path.join(out_dir, "apple-touch-icon.png"), 180, 0.56)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "public/icons")
