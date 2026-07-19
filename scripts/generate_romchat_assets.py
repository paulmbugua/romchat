from pathlib import Path
import math

from PIL import Image, ImageDraw, ImageFont, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
WEB_ASSETS = ROOT / "apps" / "web" / "public" / "assets" / "romchat"
MOBILE_ASSETS = ROOT / "apps" / "mobile" / "assets"
ADMIN_PUBLIC = ROOT / "apps" / "admin" / "public"


INK = (26, 28, 30)
ROSE = (166, 54, 70)
CORAL = (244, 113, 127)
VIOLET = (111, 55, 209)
TEAL = (38, 198, 196)
WHITE = (255, 255, 255)


def font(size, bold=False):
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def gradient(size, start, end, diagonal=True):
    width, height = size
    image = Image.new("RGB", size, start)
    pixels = image.load()
    for y in range(height):
        for x in range(width):
            t = (x + y) / (width + height) if diagonal else y / max(1, height - 1)
            pixels[x, y] = tuple(int(start[i] * (1 - t) + end[i] * t) for i in range(3))
    return image


def draw_logo_mark(draw, box, fill=WHITE, accent=TEAL):
    x0, y0, x1, y1 = box
    w = x1 - x0
    h = y1 - y0
    bubble = [x0 + w * 0.08, y0 + h * 0.16, x0 + w * 0.92, y0 + h * 0.78]
    draw.rounded_rectangle(bubble, radius=int(w * 0.22), outline=fill, width=max(8, int(w * 0.055)))
    tail = [
        (x0 + w * 0.58, y0 + h * 0.76),
        (x0 + w * 0.72, y0 + h * 0.94),
        (x0 + w * 0.48, y0 + h * 0.79),
    ]
    draw.line(tail, fill=fill, width=max(8, int(w * 0.055)), joint="curve")
    heart = [
        (x0 + w * 0.50, y0 + h * 0.58),
        (x0 + w * 0.30, y0 + h * 0.42),
        (x0 + w * 0.35, y0 + h * 0.26),
        (x0 + w * 0.50, y0 + h * 0.34),
        (x0 + w * 0.65, y0 + h * 0.26),
        (x0 + w * 0.70, y0 + h * 0.42),
    ]
    draw.line(heart + [heart[0]], fill=fill, width=max(10, int(w * 0.07)), joint="curve")
    draw.ellipse([x0 + w * 0.72, y0 + h * 0.18, x0 + w * 0.83, y0 + h * 0.29], fill=accent)


def make_icon(size=1024):
    image = gradient((size, size), ROSE, VIOLET)
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([size * 0.1, size * 0.05, size * 1.05, size * 0.82], fill=(255, 255, 255, 38))
    gd.ellipse([size * -0.12, size * 0.56, size * 0.55, size * 1.1], fill=(38, 198, 196, 68))
    image = Image.alpha_composite(image.convert("RGBA"), glow)
    draw = ImageDraw.Draw(image)
    draw_logo_mark(draw, [size * 0.17, size * 0.18, size * 0.83, size * 0.82])
    return image


def make_splash():
    w, h = 1536, 2048
    image = gradient((w, h), (63, 18, 31), (22, 24, 32), diagonal=False).convert("RGBA")
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([-180, 120, 980, 1280], fill=(244, 113, 127, 68))
    gd.ellipse([620, 760, 1720, 1920], fill=(38, 198, 196, 44))
    image = Image.alpha_composite(image, glow.filter(ImageFilter.GaussianBlur(18)))
    draw = ImageDraw.Draw(image)
    draw_logo_mark(draw, [w * 0.24, h * 0.24, w * 0.76, h * 0.63], fill=WHITE, accent=TEAL)
    title = "RomChat"
    subtitle = "Intentional dating. Verified chemistry."
    title_font = font(112, True)
    subtitle_font = font(34)
    draw.text(((w - draw.textlength(title, font=title_font)) / 2, h * 0.66), title, font=title_font, fill=WHITE)
    draw.text(((w - draw.textlength(subtitle, font=subtitle_font)) / 2, h * 0.735), subtitle, font=subtitle_font, fill=(255, 218, 219))
    return image


def make_profile(name, colors, seed):
    w, h = 960, 1280
    image = gradient((w, h), colors[0], colors[1]).convert("RGBA")
    draw = ImageDraw.Draw(image)
    for i in range(10):
        x = ((seed * 83 + i * 137) % w) - 120
        y = ((seed * 47 + i * 211) % h) - 120
        r = 130 + (i % 4) * 45
        draw.ellipse([x, y, x + r * 2, y + r * 2], fill=(*colors[(i + 1) % len(colors)], 36))
    body = [w * 0.18, h * 0.55, w * 0.82, h * 1.12]
    head = [w * 0.31, h * 0.18, w * 0.69, h * 0.46]
    hair = [w * 0.25, h * 0.14, w * 0.75, h * 0.52]
    draw.ellipse(body, fill=(255, 255, 255, 56))
    draw.ellipse(hair, fill=(40, 26, 31, 168))
    draw.ellipse(head, fill=(255, 217, 196, 230))
    draw.arc([w * 0.39, h * 0.30, w * 0.61, h * 0.43], 18, 162, fill=(118, 42, 55, 220), width=8)
    draw.ellipse([w * 0.40, h * 0.29, w * 0.43, h * 0.32], fill=INK)
    draw.ellipse([w * 0.57, h * 0.29, w * 0.60, h * 0.32], fill=INK)
    scrim = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(scrim)
    for y in range(h):
        alpha = int(max(0, (y - h * 0.48) / (h * 0.52)) * 170)
        sd.line([(0, y), (w, y)], fill=(0, 0, 0, alpha))
    image = Image.alpha_composite(image, scrim)
    draw = ImageDraw.Draw(image)
    draw.text((56, h - 168), name, font=font(56, True), fill=WHITE)
    draw.text((56, h - 94), "Verified RomChat member", font=font(26), fill=(255, 232, 235))
    return image


def make_event():
    w, h = 1280, 720
    image = gradient((w, h), (26, 28, 30), (166, 54, 70)).convert("RGBA")
    draw = ImageDraw.Draw(image)
    for i in range(9):
        x = 90 + i * 136
        height = 190 + int(90 * math.sin(i))
        draw.rounded_rectangle([x, h - 140 - height, x + 64, h - 140], radius=24, fill=(255, 255, 255, 30 + i * 4))
    draw.rounded_rectangle([72, 72, w - 72, h - 72], radius=42, outline=(255, 255, 255, 70), width=3)
    draw.text((112, 116), "Golden Hour Social", font=font(76, True), fill=WHITE)
    draw.text((116, 214), "Verified singles, live prompts, rooftop music", font=font(34), fill=(255, 218, 219))
    draw_logo_mark(draw, [w - 250, 92, w - 112, 230], fill=WHITE, accent=TEAL)
    return image


def make_svg_logo():
    return """<svg width="720" height="180" viewBox="0 0 720 180" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="720" height="180" rx="36" fill="#1A1C1E"/>
<rect x="24" y="24" width="132" height="132" rx="34" fill="url(#g)"/>
<path d="M54 76C54 56 70 44 91 44H103C124 44 139 57 139 76V95C139 115 123 128 102 128H92L70 145L76 126C63 122 54 111 54 95V76Z" stroke="white" stroke-width="10" stroke-linejoin="round"/>
<path d="M96 100C78 87 76 72 88 66C95 62 102 66 106 72C110 66 118 62 125 67C137 75 132 90 106 105C103 103 100 102 96 100Z" fill="white"/>
<circle cx="126" cy="57" r="9" fill="#26C6C4"/>
<text x="184" y="101" fill="white" font-family="Inter, Arial, sans-serif" font-size="62" font-weight="800">RomChat</text>
<text x="188" y="133" fill="#FFDADB" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="600">Intentional dating. Verified chemistry.</text>
<defs><linearGradient id="g" x1="24" y1="24" x2="156" y2="156"><stop stop-color="#F4717F"/><stop offset="0.58" stop-color="#A63646"/><stop offset="1" stop-color="#26C6C4"/></linearGradient></defs>
</svg>
"""


def save_all():
    WEB_ASSETS.mkdir(parents=True, exist_ok=True)
    MOBILE_ASSETS.mkdir(parents=True, exist_ok=True)
    ADMIN_PUBLIC.mkdir(parents=True, exist_ok=True)
    icon = make_icon()
    splash = make_splash()
    icon.save(WEB_ASSETS / "icon.png")
    icon.resize((192, 192)).save(WEB_ASSETS / "favicon.png")
    splash.save(WEB_ASSETS / "splash.png")
    (WEB_ASSETS / "logo.svg").write_text(make_svg_logo(), encoding="utf-8")
    (ADMIN_PUBLIC / "romchat-logo.svg").write_text(make_svg_logo(), encoding="utf-8")
    for title, colors, seed, filename in [
        ("Elena, 26", [CORAL, VIOLET, TEAL], 3, "profile-elena.png"),
        ("Amara, 29", [(223, 128, 114), ROSE, (255, 218, 219)], 7, "profile-amara.png"),
        ("Noah, 31", [TEAL, (47, 49, 51), CORAL], 11, "profile-noah.png"),
        ("Mia, 27", [(255, 180, 168), (137, 84, 235), (255, 218, 219)], 17, "profile-mia.png"),
    ]:
        make_profile(title, colors, seed).save(WEB_ASSETS / filename)
    make_event().save(WEB_ASSETS / "event-golden-hour.png")
    icon.save(MOBILE_ASSETS / "icon.png")
    icon.resize((432, 432)).save(MOBILE_ASSETS / "adaptive-icon-foreground.png")
    icon.resize((96, 96)).save(MOBILE_ASSETS / "notification-icon.png")
    icon.resize((192, 192)).save(MOBILE_ASSETS / "favicon.png")
    icon.convert("L").convert("RGBA").save(MOBILE_ASSETS / "adaptive-icon-monochrome.png")
    splash.save(MOBILE_ASSETS / "splash.png")


if __name__ == "__main__":
    save_all()
