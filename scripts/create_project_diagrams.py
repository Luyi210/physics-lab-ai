from __future__ import annotations

import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output" / "images"
OUT_DIR.mkdir(parents=True, exist_ok=True)

FONT_REGULAR = "/System/Library/Fonts/Hiragino Sans GB.ttc"
FONT_BOLD = "/System/Library/Fonts/STHeiti Medium.ttc"


PALETTE = {
    "bg": "#eef3f0",
    "paper": "#fbfcf8",
    "ink": "#202522",
    "muted": "#4f5b55",
    "line": "#b7c3bc",
    "teal": "#0f8f8b",
    "teal_dark": "#0a6664",
    "amber": "#d79a18",
    "amber_soft": "#fff4cf",
    "green_soft": "#e2f6f2",
    "blue_soft": "#eaf1ff",
    "rose_soft": "#ffe8df",
    "dark": "#24302b",
    "white": "#ffffff",
}


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REGULAR, size)


def rounded(draw: ImageDraw.ImageDraw, box, fill, outline=PALETTE["line"], radius=18, width=2):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def text_size(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def draw_text(draw: ImageDraw.ImageDraw, xy, text: str, fnt, fill=PALETTE["ink"], spacing=8):
    draw.multiline_text(xy, text, font=fnt, fill=fill, spacing=spacing)


def wrap_cjk(text: str, width: int) -> str:
    lines: list[str] = []
    for paragraph in text.split("\n"):
        if not paragraph:
            lines.append("")
            continue
        current = ""
        for char in paragraph:
            if len(current) >= width:
                lines.append(current)
                current = char
            else:
                current += char
        if current:
            lines.append(current)
    return "\n".join(lines)


def title(draw: ImageDraw.ImageDraw, heading: str, subheading: str):
    draw_text(draw, (70, 56), heading, font(46, True), PALETTE["ink"])
    draw_text(draw, (72, 116), subheading, font(22), PALETTE["muted"])
    draw.line((70, 158, 1530, 158), fill=PALETTE["line"], width=2)


def arrow(draw: ImageDraw.ImageDraw, start, end, color=PALETTE["teal_dark"], width=4):
    draw.line((start[0], start[1], end[0], end[1]), fill=color, width=width)
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    if abs(dx) >= abs(dy):
        direction = 1 if dx >= 0 else -1
        pts = [(end[0], end[1]), (end[0] - 18 * direction, end[1] - 10), (end[0] - 18 * direction, end[1] + 10)]
    else:
        direction = 1 if dy >= 0 else -1
        pts = [(end[0], end[1]), (end[0] - 10, end[1] - 18 * direction), (end[0] + 10, end[1] - 18 * direction)]
    draw.polygon(pts, fill=color)


def card(draw, box, label, heading, body, fill=PALETTE["paper"], accent=PALETTE["teal"]):
    rounded(draw, box, fill=fill, outline=PALETTE["line"], radius=18, width=2)
    x1, y1, x2, y2 = box
    card_width = x2 - x1
    heading_chars = max(5, int((card_width - 44) / 24))
    body_chars = max(7, int((card_width - 44) / 17))
    draw.rounded_rectangle((x1 + 18, y1 + 18, x1 + 120, y1 + 48), radius=15, fill=accent)
    w, _ = text_size(draw, label, font(16, True))
    draw.text((x1 + 18 + (102 - w) / 2, y1 + 22), label, font=font(16, True), fill=PALETTE["white"])
    draw_text(draw, (x1 + 22, y1 + 68), wrap_cjk(heading, heading_chars), font(25, True), PALETTE["ink"])
    draw_text(draw, (x1 + 22, y1 + 126), wrap_cjk(body, body_chars), font(17), PALETTE["muted"], spacing=7)


def pill(draw, box, text, fill, outline=None, color=PALETTE["ink"]):
    rounded(draw, box, fill=fill, outline=outline or fill, radius=999, width=2)
    fnt = font(18, True)
    w, h = text_size(draw, text, fnt)
    x1, y1, x2, y2 = box
    draw.text((x1 + (x2 - x1 - w) / 2, y1 + (y2 - y1 - h) / 2 - 2), text, font=fnt, fill=color)


def base_canvas() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGB", (1600, 1000), PALETTE["bg"])
    draw = ImageDraw.Draw(image)
    for x in range(0, 1600, 32):
        draw.line((x, 0, x, 1000), fill="#e1e8e4", width=1)
    for y in range(0, 1000, 32):
        draw.line((0, y, 1600, y), fill="#e1e8e4", width=1)
    return image, draw


def save(image: Image.Image, filename: str):
    path = OUT_DIR / filename
    image.save(path, quality=96)
    print(path)


def workflow_diagram():
    image, draw = base_canvas()
    title(draw, "PhysicsLab AI 产品体验 Workflow", "从打开 Demo 到完成一次“观察 - 提问 - 验证”的学习闭环")

    steps = [
        ("01", "打开网页", "弹窗说明：面向高中生的 AI 光学实验助教。"),
        ("02", "选择章节", "四类光学实验可切换。"),
        ("03", "调节参数", "拖动角度、折射率、波长、缝宽等参数。"),
        ("04", "观察现象", "观察光路、条纹、光强和临界角读数。"),
        ("05", "询问 AI", "点击右下角助教，提出当前实验里的困惑。"),
        ("06", "回到验证", "按提示回到页面继续验证。"),
    ]

    xs = [70, 325, 580, 835, 1090, 1345]
    for index, (num, head, body) in enumerate(steps):
        box = (xs[index], 230, xs[index] + 190, 470)
        card(draw, box, num, head, body, fill=PALETTE["paper"], accent=PALETTE["teal"] if index < 4 else PALETTE["amber"])
        if index < len(steps) - 1:
            arrow(draw, (xs[index] + 198, 350), (xs[index + 1] - 14, 350))

    rounded(draw, (120, 585, 1480, 845), fill="#ffffff", outline=PALETTE["line"], radius=24, width=2)
    draw_text(draw, (160, 625), "核心学习闭环", font(30, True), PALETTE["ink"])
    draw_text(
        draw,
        (160, 678),
        "不是先让学生读长篇解释，而是先让学生看见现象，再用 AI 助教把现象翻译成规律，最后回到仿真继续验证。",
        font(22),
        PALETTE["muted"],
    )
    pill(draw, (170, 750, 430, 806), "先看现象", PALETTE["green_soft"], PALETTE["teal"])
    arrow(draw, (448, 778), (572, 778), PALETTE["teal_dark"])
    pill(draw, (590, 750, 850, 806), "再问原因", PALETTE["amber_soft"], PALETTE["amber"])
    arrow(draw, (868, 778), (992, 778), PALETTE["teal_dark"])
    pill(draw, (1010, 750, 1270, 806), "回到实验验证", PALETTE["blue_soft"], "#7794cf")

    draw_text(draw, (70, 920), "适合放在作品集：说明产品不是静态课件，而是一个可交互、可提问、可验证的学习流程。", font(20), PALETTE["muted"])
    save(image, "01-product-workflow.png")


def architecture_diagram():
    image, draw = base_canvas()
    title(draw, "AI 助教技术设计路线", "用 Prompt、RAG、工具和评测约束小模型输出，让回答更像高中物理老师")

    card(draw, (70, 230, 310, 430), "INPUT", "学生问题", "自然语言提问，例如：为什么会发生全反射？", fill=PALETTE["paper"], accent=PALETTE["teal_dark"])
    card(draw, (70, 500, 310, 700), "STATE", "当前仿真状态", "章节、入射角、折射率、临界角、条纹或光强读数。", fill=PALETTE["green_soft"], accent=PALETTE["teal"])
    arrow(draw, (318, 330), (450, 395), PALETTE["teal_dark"])
    arrow(draw, (318, 600), (450, 465), PALETTE["teal_dark"])

    rounded(draw, (450, 285, 700, 655), fill="#ffffff", outline=PALETTE["line"], radius=22, width=2)
    draw_text(draw, (485, 325), "Agent 规划层", font(30, True), PALETTE["ink"])
    for i, item in enumerate(["意图识别", "章节匹配", "是否离题", "是否可直接回答"]):
        pill(draw, (490, 390 + i * 55, 655, 430 + i * 55), item, "#f2f7f5", PALETTE["line"], PALETTE["ink"])

    arrow(draw, (705, 470), (810, 470), PALETTE["teal_dark"])

    tool_cards = [
        ((820, 215, 1055, 365), "RAG", "光学知识库", "49 条高中光学知识片段"),
        ((1100, 215, 1335, 365), "TOOL", "公式工具", "临界角、条纹间距、马吕斯定律"),
        ((820, 430, 1055, 580), "MEM", "学习记忆", "记录近期提问和关注点"),
        ((1100, 430, 1335, 580), "LLM", "可选本地模型", "访问者本机模型增强"),
    ]
    for box, label, head, body in tool_cards:
        card(draw, box, label, head, body, fill=PALETTE["paper"], accent=PALETTE["amber"] if label in {"TOOL", "LLM"} else PALETTE["teal"])

    arrow(draw, (1080, 660), (1080, 735), PALETTE["teal_dark"])
    rounded(draw, (760, 735, 1400, 895), fill=PALETTE["dark"], outline=PALETTE["dark"], radius=22, width=2)
    draw_text(draw, (800, 770), "最终展示给学生", font(30, True), PALETTE["white"])
    draw_text(draw, (800, 820), "结论：先回答\n原因：解释高中物理规律\n仿真：联系当前页面该观察哪里", font(21), "#f9f5e7", spacing=10)

    rounded(draw, (70, 790, 670, 895), fill="#fff7db", outline="#dfc672", radius=18, width=2)
    draw_text(draw, (100, 818), "输出约束", font(25, True), PALETTE["ink"])
    draw_text(draw, (100, 858), "不展示思考过程，不说开发态语言，不长篇大论。", font(20), PALETTE["muted"])
    save(image, "02-ai-tutor-architecture.png")


def design_logic_diagram():
    image, draw = base_canvas()
    title(draw, "产品设计逻辑拆解", "把一个模糊的“AI 助教”想法拆成目标用户、体验标准、AI 规则和验证方式")

    columns = [
        ("问题定义", "高中光学抽象，学生会背公式，但难以把公式、图像、实验现象对应起来。", "#ffe8df", "#d85e37"),
        ("产品判断", "不能只做聊天框，要把 AI 放进具体实验场景，让解释回到当前仿真。", "#e2f6f2", "#0f8f8b"),
        ("输出标准", "回答面向高中生：结论先行、原因简洁、联系仿真、不暴露思考过程。", "#fff4cf", "#d79a18"),
        ("工程落地", "前端交互仿真 + 光学知识库 + 公式工具 + 评测集 + 在线演示。", "#eaf1ff", "#5d7fc2"),
    ]
    x = 70
    for index, (head, body, fill, accent) in enumerate(columns):
        box = (x + index * 380, 230, x + index * 380 + 320, 555)
        rounded(draw, box, fill=fill, outline=PALETTE["line"], radius=24, width=2)
        draw.rounded_rectangle((box[0] + 24, box[1] + 24, box[0] + 116, box[1] + 58), radius=17, fill=accent)
        draw.text((box[0] + 45, box[1] + 29), f"0{index + 1}", font=font(18, True), fill=PALETTE["white"])
        draw_text(draw, (box[0] + 24, box[1] + 92), head, font(31, True), PALETTE["ink"])
        draw_text(draw, (box[0] + 24, box[1] + 150), wrap_cjk(body, 14), font(22), PALETTE["muted"], spacing=10)
        if index < len(columns) - 1:
            arrow(draw, (box[2] + 16, 392), (box[2] + 54, 392), PALETTE["teal_dark"])

    rounded(draw, (170, 665, 1430, 865), fill="#ffffff", outline=PALETTE["line"], radius=24, width=2)
    draw_text(draw, (210, 700), "可讲给面试官的核心句", font(30, True), PALETTE["ink"])
    draw_text(
        draw,
        (210, 755),
        wrap_cjk("我不是只接入一个模型，而是先定义“好助教回答”的标准，再通过知识库、工具、提示词、输出清洗和评测集让 AI 表现逼近这个标准。", 42),
        font(22),
        PALETTE["muted"],
        spacing=10,
    )
    draw_text(draw, (70, 920), "适合放在作品集：展示你如何从产品问题出发，而不是只展示技术堆栈。", font(20), PALETTE["muted"])
    save(image, "03-design-logic-map.png")


def main():
    workflow_diagram()
    architecture_diagram()
    design_logic_diagram()


if __name__ == "__main__":
    main()
