from __future__ import annotations

import re
from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "output" / "pdf"
OUTPUT_PATH = OUTPUT_DIR / "PhysicsLabAI-project-brief.pdf"

DEMO_URL = "https://luyi210.github.io/physics-lab-ai/"
REPO_URL = "https://github.com/Luyi210/physics-lab-ai"


def count_entries(path: Path) -> int:
    if not path.exists():
        return 0
    text = path.read_text(encoding="utf-8")
    return len(re.findall(r"\bid:\s*[\"']", text))


def paragraph(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(text.replace("\n", "<br/>"), style)


def bullet(text: str, style: ParagraphStyle) -> Paragraph:
    return paragraph(f"- {text}", style)


def make_table(data, col_widths, background=colors.white):
    table = Table(data, colWidths=col_widths, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), background),
                ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#d6dde8")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e4e9f0")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return table


def on_page(canvas, doc):
    width, height = A4
    canvas.saveState()
    canvas.setFont("STSong-Light", 8)
    canvas.setFillColor(colors.HexColor("#667085"))
    canvas.drawString(18 * mm, 12 * mm, "PhysicsLab AI 光学仿真与本地助教")
    canvas.drawRightString(width - 18 * mm, 12 * mm, f"第 {doc.page} 页")
    canvas.setStrokeColor(colors.HexColor("#e4e9f0"))
    canvas.line(18 * mm, 17 * mm, width - 18 * mm, 17 * mm)
    canvas.restoreState()


def build_pdf():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))

    knowledge_count = count_entries(ROOT / "src" / "data" / "opticsKnowledge.ts")
    eval_count = count_entries(ROOT / "src" / "data" / "tutorTestSet.ts")

    palette = {
        "ink": colors.HexColor("#111827"),
        "muted": colors.HexColor("#475467"),
        "blue": colors.HexColor("#1d4ed8"),
        "blue_light": colors.HexColor("#eef4ff"),
        "green_light": colors.HexColor("#ecfdf3"),
        "amber_light": colors.HexColor("#fffaeb"),
        "rose_light": colors.HexColor("#fff1f3"),
        "line": colors.HexColor("#d6dde8"),
        "dark": colors.HexColor("#182230"),
    }

    base = getSampleStyleSheet()
    styles = {
        "title": ParagraphStyle(
            "TitleCN",
            parent=base["Title"],
            fontName="STSong-Light",
            fontSize=23,
            leading=31,
            alignment=TA_CENTER,
            textColor=palette["ink"],
            wordWrap="CJK",
            spaceAfter=8,
        ),
        "subtitle": ParagraphStyle(
            "SubtitleCN",
            parent=base["BodyText"],
            fontName="STSong-Light",
            fontSize=10.5,
            leading=16,
            alignment=TA_CENTER,
            textColor=palette["muted"],
            wordWrap="CJK",
            spaceAfter=14,
        ),
        "h1": ParagraphStyle(
            "HeadingCN",
            parent=base["Heading1"],
            fontName="STSong-Light",
            fontSize=15,
            leading=21,
            textColor=palette["blue"],
            wordWrap="CJK",
            spaceBefore=8,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "SmallHeadingCN",
            parent=base["Heading2"],
            fontName="STSong-Light",
            fontSize=12.5,
            leading=18,
            textColor=palette["dark"],
            wordWrap="CJK",
            spaceBefore=6,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "BodyCN",
            parent=base["BodyText"],
            fontName="STSong-Light",
            fontSize=10.4,
            leading=16,
            textColor=palette["ink"],
            alignment=TA_LEFT,
            wordWrap="CJK",
            spaceAfter=5,
        ),
        "small": ParagraphStyle(
            "SmallCN",
            parent=base["BodyText"],
            fontName="STSong-Light",
            fontSize=9.1,
            leading=14,
            textColor=palette["muted"],
            wordWrap="CJK",
            spaceAfter=4,
        ),
        "card_title": ParagraphStyle(
            "CardTitleCN",
            parent=base["BodyText"],
            fontName="STSong-Light",
            fontSize=10.2,
            leading=14,
            textColor=palette["dark"],
            wordWrap="CJK",
            spaceAfter=4,
        ),
        "card": ParagraphStyle(
            "CardCN",
            parent=base["BodyText"],
            fontName="STSong-Light",
            fontSize=9.2,
            leading=14,
            textColor=palette["ink"],
            wordWrap="CJK",
        ),
        "code": ParagraphStyle(
            "CodeCN",
            parent=base["Code"],
            fontName="STSong-Light",
            fontSize=8.8,
            leading=13,
            textColor=colors.HexColor("#344054"),
            backColor=colors.HexColor("#f8fafc"),
            wordWrap="CJK",
            borderPadding=5,
        ),
    }

    doc = SimpleDocTemplate(
        str(OUTPUT_PATH),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=22 * mm,
        title="PhysicsLab AI 项目介绍",
        author="PhysicsLab AI",
    )

    story = []

    story.append(paragraph("PhysicsLab AI 光学仿真与本地助教", styles["title"]))
    story.append(
        paragraph(
            "一个面向高中生的光学学习 Demo：把折射、全反射、干涉、衍射、偏振做成可调参数的浏览器仿真，并接入一个有固定教学口吻、知识检索、公式工具和学习记忆的 AI 助教。",
            styles["subtitle"],
        )
    )

    story.append(paragraph("1. 项目简介", styles["h1"]))
    story.append(
        paragraph(
            "这个项目解决的问题是：高中光学概念抽象，学生常常能背公式，却很难把公式、图像、实验现象和真实应用联系起来。因此我做了一个可在浏览器体验的产品原型，让学生先通过拖动参数看到现象，再用 AI 助教把现象解释成可理解的物理规律。",
            styles["body"],
        )
    )

    summary_data = [
        [
            paragraph("做了什么", styles["card_title"]),
            paragraph("React + TypeScript 光学仿真平台，包含折射/全反射、干涉、衍射、偏振四个学习章节。", styles["card"]),
        ],
        [
            paragraph("为什么做", styles["card_title"]),
            paragraph("把“公式记忆”变成“现象观察 -> 规律解释 -> 当前仿真验证”的学习流程。", styles["card"]),
        ],
        [
            paragraph("核心体验", styles["card_title"]),
            paragraph("学生调节入射角、折射率、波长、缝宽、偏振片角度等变量，AI 助教只展示最终教学回答。", styles["card"]),
        ],
        [
            paragraph("体验入口", styles["card_title"]),
            paragraph(f"在线 Demo：{DEMO_URL}<br/>GitHub：{REPO_URL}", styles["card"]),
        ],
    ]
    story.append(make_table(summary_data, [34 * mm, 124 * mm], colors.HexColor("#f8fafc")))
    story.append(Spacer(1, 8))

    metric_data = [
        [
            paragraph("四个光学章节", styles["card_title"]),
            paragraph("折射/全反射、光的干涉、光的衍射、光的偏振。", styles["card"]),
        ],
        [
            paragraph(f"{knowledge_count} 条知识片段", styles["card_title"]),
            paragraph("围绕高中光学高频概念整理成可检索的 RAG 知识库。", styles["card"]),
        ],
        [
            paragraph(f"{eval_count} 个必答问题", styles["card_title"]),
            paragraph("覆盖概念、公式、实验、应用和离题收束，用于持续调 prompt 和工具规则。", styles["card"]),
        ],
    ]
    story.append(make_table(metric_data, [44 * mm, 114 * mm], colors.HexColor("#eef4ff")))
    story.append(Spacer(1, 8))
    story.append(paragraph("一句话价值", styles["h2"]))
    story.append(
        paragraph(
            "它不是把一个聊天框贴到网页上，而是把“学生当前正在看的仿真状态”作为回答上下文，让 AI 的解释必须落回页面里的具体角度、条纹、光强和变量变化。",
            styles["body"],
        )
    )

    story.append(PageBreak())

    story.append(paragraph("2. 产品设计", styles["h1"]))
    story.append(paragraph("目标用户与使用场景", styles["h2"]))
    for item in [
        "高中生：在学习光学概念时，需要把公式、图像和实验现象对应起来。",
        "教师或助教：课堂演示时可以快速改变变量，并用标准化语言解释观察结果。",
        "作品评审：可以直接打开在线 Demo，看到一个完整可用的 AI + 交互原型，而不是静态文档。",
    ]:
        story.append(bullet(item, styles["body"]))

    story.append(paragraph("助教回答的理想态标准", styles["h2"]))
    design_rules = [
        [
            paragraph("面向高中生", styles["card_title"]),
            paragraph("不用过度专业的推导语言，先解释条件和现象，再给必要公式。", styles["card"]),
        ],
        [
            paragraph("教师口吻", styles["card_title"]),
            paragraph("耐心、简洁、可信，像物理老师，不像客服，也不闲聊。", styles["card"]),
        ],
        [
            paragraph("固定结构", styles["card_title"]),
            paragraph("结论：先回答。原因：解释规律。仿真：回到当前页面观察点。", styles["card"]),
        ],
        [
            paragraph("隐藏过程", styles["card_title"]),
            paragraph("不展示思考链、检索过程、模型状态、知识库为空等开发态语言。", styles["card"]),
        ],
    ]
    story.append(make_table(design_rules, [44 * mm, 114 * mm], colors.HexColor("#ecfdf3")))
    story.append(Spacer(1, 8))

    story.append(paragraph("学习闭环", styles["h2"]))
    flow = [
        [
            paragraph("1. 调参数", styles["card_title"]),
            paragraph("学生拖动入射角、介质折射率、波长、缝宽或偏振片角度。", styles["card"]),
        ],
        [
            paragraph("2. 看现象", styles["card_title"]),
            paragraph("页面实时显示光线、条纹、光强、临界角和状态读数。", styles["card"]),
        ],
        [
            paragraph("3. 问助教", styles["card_title"]),
            paragraph("AI 读取当前章节与仿真状态，按固定格式解释。", styles["card"]),
        ],
        [
            paragraph("4. 回到实验", styles["card_title"]),
            paragraph("回答最后一段指向页面里应观察的位置，让学生继续验证。", styles["card"]),
        ],
    ]
    story.append(make_table(flow, [44 * mm, 114 * mm], colors.HexColor("#fff7ed")))
    story.append(Spacer(1, 8))
    story.append(paragraph("回答示例", styles["h2"]))
    story.append(
        paragraph(
            "结论：全反射发生在光从光密介质射向光疏介质，且入射角达到或超过临界角时。<br/>原因：临界角时折射角等于 90°；再增大入射角，折射光消失，只剩反射光。<br/>仿真：观察入射角超过临界角后，折射光是否从界面另一侧消失。",
            styles["code"],
        )
    )

    story.append(PageBreak())

    story.append(paragraph("3. AI 助教与 Agent 架构", styles["h1"]))
    story.append(
        paragraph(
            "当前实现采用“规则可控的本地助教 + 可选小模型增强”的路线。基础能力不依赖远程 API，在线 Demo 可以直接回答一批高频问题；如果访问者自己的电脑安装了 Ollama 和 qwen3:4b，则会自动启用本地模型增强。",
            styles["body"],
        )
    )

    story.append(paragraph("回答链路", styles["h2"]))
    arch = [
        [
            paragraph("学生问题", styles["card_title"]),
            paragraph("输入自然语言问题，例如“为什么会全反射”。", styles["card"]),
        ],
        [
            paragraph("意图识别", styles["card_title"]),
            paragraph("判断概念、公式、实验、应用、仿真或离题。", styles["card"]),
        ],
        [
            paragraph("知识检索", styles["card_title"]),
            paragraph("从光学知识片段中取相关材料，避免自由发挥。", styles["card"]),
        ],
        [
            paragraph("公式工具", styles["card_title"]),
            paragraph("对全反射、双缝、单缝、偏振等高频问题直接给稳定答案。", styles["card"]),
        ],
        [
            paragraph("学习记忆", styles["card_title"]),
            paragraph("用 localStorage 保存近期问题，辅助判断学生关注点。", styles["card"]),
        ],
        [
            paragraph("可选模型", styles["card_title"]),
            paragraph("只有规则与知识不足时才调用本机 Ollama；模型输出再经过清洗。", styles["card"]),
        ],
        [
            paragraph("最终回答", styles["card_title"]),
            paragraph("只展示“结论/原因/仿真”三段，不泄露内部过程。", styles["card"]),
        ],
    ]
    story.append(make_table(arch, [38 * mm, 120 * mm], colors.HexColor("#f8fafc")))
    story.append(Spacer(1, 8))

    story.append(paragraph("为什么这样设计", styles["h2"]))
    for item in [
        "小模型如果直接回答，容易慢、啰嗦、口吻不稳定，所以把高频知识和公式题前置为确定性工具。",
        "RAG 负责让回答有教材依据，但不把“知识库为空、检索失败”等开发语言暴露给学生。",
        "Agent 负责选择路径：能本地直接答就直接答；必须用模型时才把上下文交给模型。",
        "前端最后还会清洗输出，过滤 <think>、内部上下文和模型状态，只留下学生能看的最终答案。",
    ]:
        story.append(bullet(item, styles["body"]))

    story.append(paragraph("关键代码位置", styles["h2"]))
    code_paths = [
        ["助教 prompt", "src/prompts/physicsTutorPrompt.ts"],
        ["Agent 规划", "src/agent/tutorAgent.ts"],
        ["知识检索工具", "src/agent/tools/knowledgeTool.ts"],
        ["公式工具", "src/agent/tools/physicsTools.ts"],
        ["学生记忆", "src/agent/memory/studentMemory.ts"],
        ["Ollama 可选增强", "src/physics/ollamaClient.ts"],
        ["评测集", "src/data/tutorTestSet.ts"],
    ]
    story.append(make_table([[paragraph(a, styles["card"]), paragraph(b, styles["card"])] for a, b in code_paths], [50 * mm, 108 * mm], colors.white))

    story.append(PageBreak())

    story.append(paragraph("4. 技术路线与部署", styles["h1"]))
    stack = [
        ["前端框架", "React 19 + TypeScript + Vite，用组件化结构组织章节、读数面板、控制台和 AI 助教。"],
        ["图形仿真", "Three.js 渲染主要光学画面，结合自定义物理函数计算折射、临界角、条纹和光强变化。"],
        ["AI 逻辑", "RAG 知识库 + 公式工具 + 意图识别 + localStorage 记忆 + 可选 Ollama 模型增强。"],
        ["部署", "GitHub Pages 自动部署，push 到 main 后由 GitHub Actions 构建并发布 dist。"],
        ["可移植性", "基础助教随网页运行；本地模型只检测访问者自己电脑上的 Ollama，不调用开发者电脑。"],
    ]
    story.append(make_table([[paragraph(a, styles["card_title"]), paragraph(b, styles["card"])] for a, b in stack], [42 * mm, 116 * mm], colors.HexColor("#eef4ff")))
    story.append(Spacer(1, 8))

    story.append(paragraph("部署策略", styles["h2"]))
    for item in [
        "Vite 配置使用 base: './'，保证 GitHub Pages 子路径部署时资源引用稳定。",
        "GitHub Actions workflow 使用 npm ci、npm run build，再把 dist 上传到 Pages。",
        "在线 Demo 重点保证“无安装即可体验核心产品”；Ollama 作为增强能力，不作为分享门槛。",
        "后续如果要做桌面软件，可以用 Tauri/Electron 包浏览器前端，再引导用户安装或下载本地模型。",
    ]:
        story.append(bullet(item, styles["body"]))

    story.append(paragraph("当前验证命令", styles["h2"]))
    story.append(paragraph("npm run build<br/>npm run eval:tutor", styles["code"]))
    story.append(
        paragraph(
            f"助教评测集目前覆盖 {eval_count} 个必须答好的问题，目标是让常见光学问题先达到稳定、短、准，再逐步加入更多 PDF 资料和更复杂的问答能力。",
            styles["body"],
        )
    )

    story.append(PageBreak())

    story.append(paragraph("5. AI 协作方式与后续计划", styles["h1"]))
    story.append(paragraph("我如何使用 AI 工具协作", styles["h2"]))
    for item in [
        "用自然语言描述产品目标，再让 AI 编程工具把想法落成 React 原型、组件、样式和部署配置。",
        "把回答口吻拆成可执行标准：高中生、物理老师、先结论后原因、联系当前仿真、不展示思考过程。",
        "把“模型不稳定”拆成工程问题：prompt 约束、RAG 知识片段、公式工具、输出清洗、评测集。",
        "用 50 个高频必答问题反复评估，不只看能不能回答，也看格式、关键词和是否需要模型。",
    ]:
        story.append(bullet(item, styles["body"]))

    story.append(paragraph("仓库整理结果", styles["h2"]))
    cleanups = [
        [
            paragraph("保留", styles["card_title"]),
            paragraph("源码、知识库、评测脚本、部署 workflow、打包说明和本 PDF 生成脚本。", styles["card"]),
        ],
        [
            paragraph("清理", styles["card_title"]),
            paragraph("删除旧 dist 构建产物和 tmp 中间文本；它们都能由脚本重新生成。", styles["card"]),
        ],
        [
            paragraph("不清理", styles["card_title"]),
            paragraph("node_modules 只是本机依赖缓存，方便继续开发，不会被提交到 GitHub。", styles["card"]),
        ],
    ]
    story.append(make_table(cleanups, [44 * mm, 114 * mm], colors.HexColor("#fffaeb")))
    story.append(Spacer(1, 8))

    story.append(paragraph("下一步路线", styles["h2"]))
    roadmap = [
        ["资料侧", "继续导入光学 PDF，按章节拆成更细的知识片段，并给每条知识加适用题型。"],
        ["助教侧", "增加错因诊断、分层提示和“先问学生一步”的 Socratic 教学模式。"],
        ["产品侧", "加入教师端题库、实验记录、学习报告和课堂投屏模式。"],
        ["工程侧", "准备桌面打包方案，明确模型下载、更新、隐私和离线能力边界。"],
    ]
    story.append(make_table([[paragraph(a, styles["card_title"]), paragraph(b, styles["card"])] for a, b in roadmap], [36 * mm, 122 * mm], colors.white))
    story.append(Spacer(1, 8))

    story.append(paragraph("提交说明", styles["h2"]))
    story.append(
        paragraph(
            f"在线 Demo：{DEMO_URL}<br/>GitHub 仓库：{REPO_URL}<br/>PDF 生成日期：{date.today().isoformat()}",
            styles["body"],
        )
    )

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(OUTPUT_PATH)


if __name__ == "__main__":
    build_pdf()
