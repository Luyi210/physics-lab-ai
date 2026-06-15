import type { ChapterKey } from "../types";

export type KnowledgeChunk = {
  id: string;
  chapter: ChapterKey | "general";
  title: string;
  tags: string[];
  content: string;
};

export const opticsKnowledge: KnowledgeChunk[] = [
  {
    id: "refraction-basic-phenomenon",
    chapter: "refraction",
    title: "光的折射现象",
    tags: ["折射", "反射", "介质", "法线", "入射角", "折射角"],
    content:
      "光从一种介质斜射到另一种介质的界面时，通常一部分反射回原介质，另一部分进入新介质并改变传播方向，这种进入新介质后方向改变的现象叫光的折射。分析折射时要先找界面法线，再比较入射角和折射角。"
  },
  {
    id: "refraction-law-snell",
    chapter: "refraction",
    title: "折射定律",
    tags: ["折射定律", "斯涅耳定律", "sin", "入射角", "折射角", "法线"],
    content:
      "折射光线、入射光线和法线在同一平面内，折射光线与入射光线分居法线两侧。对给定两种介质，入射角正弦与折射角正弦之比为常数，可写作 sinθ1/sinθ2 = n12。"
  },
  {
    id: "refraction-reversibility",
    chapter: "refraction",
    title: "折射中的光路可逆",
    tags: ["光路可逆", "折射", "反射", "路径"],
    content:
      "光在折射现象中满足光路可逆。如果光线沿某一路径从介质 A 进入介质 B，那么反向传播时会沿原路径从介质 B 回到介质 A。用这个思想可以反推临界角和分析复杂光路。"
  },
  {
    id: "refraction-index-definition",
    chapter: "refraction",
    title: "折射率的定义",
    tags: ["折射率", "绝对折射率", "光速", "c", "v"],
    content:
      "某种介质的折射率 n 等于光在真空中的速度 c 与光在该介质中的速度 v 之比，即 n = c/v。折射率越大，光在其中传播越慢，从空气斜射入该介质时偏折通常越明显。"
  },
  {
    id: "refraction-bending-direction",
    chapter: "refraction",
    title: "光疏和光密介质中的偏折方向",
    tags: ["光疏介质", "光密介质", "向法线", "远离法线", "折射角"],
    content:
      "从光疏介质进入光密介质时，光速变小，折射角小于入射角，光线向法线偏折；从光密介质进入光疏介质时，光速变大，折射角大于入射角，光线远离法线偏折。"
  },
  {
    id: "refraction-measure-index",
    chapter: "refraction",
    title: "测量玻璃或液体的折射率",
    tags: ["测量折射率", "玻璃砖", "液体", "入射角", "折射角", "实验"],
    content:
      "测折射率的基本思路是描出入射光线和折射光线，测量入射角与折射角，再代入折射定律计算。做玻璃砖实验时要保证光线位置描点准确，法线和界面要画清楚。"
  },
  {
    id: "tir-conditions",
    chapter: "refraction",
    title: "全反射的发生条件",
    tags: ["全反射", "光密介质", "光疏介质", "临界角", "折射光消失"],
    content:
      "全反射只可能发生在光从光密介质射向光疏介质时。若入射角逐渐增大，折射光会越来越贴近界面；当入射角达到或超过临界角，折射光消失，只剩反射光。"
  },
  {
    id: "tir-critical-angle",
    chapter: "refraction",
    title: "临界角公式",
    tags: ["临界角", "全反射", "sinC", "折射率", "空气"],
    content:
      "当光从折射率为 n 的介质射向空气或真空时，临界角 C 满足 sinC = 1/n。介质折射率越大，临界角越小，也就越容易在界面上发生全反射。"
  },
  {
    id: "tir-natural-phenomena",
    chapter: "refraction",
    title: "全反射的自然现象",
    tags: ["全反射", "水中气泡", "潜水员", "倒立圆锥", "现象解释"],
    content:
      "水中或玻璃中的气泡显得很亮，是因为光从水或玻璃射向气泡时可能在界面发生全反射。潜水员看水面上方景物时，入水后的光线被限制在与临界角有关的圆锥范围内。"
  },
  {
    id: "tir-prism",
    chapter: "refraction",
    title: "全反射棱镜",
    tags: ["全反射棱镜", "反射率", "望远镜", "改变光路"],
    content:
      "全反射棱镜利用玻璃内部光线在玻璃-空气界面上的全反射来改变光的方向。由于全反射损失小，反射率很高，常用于望远镜等光学仪器。"
  },
  {
    id: "tir-fiber",
    chapter: "refraction",
    title: "光纤导光原理",
    tags: ["光纤", "光导纤维", "全反射", "内芯", "外套", "通信", "内窥镜"],
    content:
      "光纤由折射率较大的内芯和折射率较小的外套组成。光在内芯与外套界面上多次全反射，因而可以沿弯曲光纤传播。光纤可用于内窥镜成像和激光通信。"
  },
  {
    id: "interference-conditions",
    chapter: "interference",
    title: "光发生干涉的条件",
    tags: ["干涉", "相干光", "频率", "相位差", "振动方向", "波动性"],
    content:
      "光是电磁波，满足条件时也会发生干涉。要形成稳定干涉条纹，两列光应频率相同、相位差恒定、振动方向相同。激光和双缝装置常用来获得稳定的相干光。"
  },
  {
    id: "interference-double-slit",
    chapter: "interference",
    title: "双缝干涉的成因",
    tags: ["双缝干涉", "明暗条纹", "相干光源", "路程差", "杨氏双缝"],
    content:
      "单色光照到相距很近的双缝后，两条缝相当于两个相干光源。两列光在屏上叠加，某些位置相互加强形成亮条纹，某些位置相互削弱形成暗条纹。"
  },
  {
    id: "interference-bright-dark",
    chapter: "interference",
    title: "亮条纹和暗条纹的路程差条件",
    tags: ["亮条纹", "暗条纹", "路程差", "波长", "半波长"],
    content:
      "屏上某点到双缝的路程差等于波长的整数倍时，两列光相互加强，出现亮条纹；路程差等于半波长的奇数倍时，两列光相互削弱，出现暗条纹。"
  },
  {
    id: "interference-fringe-spacing",
    chapter: "interference",
    title: "双缝干涉条纹间距",
    tags: ["条纹间距", "双缝间距", "屏距", "波长", "公式", "delta x"],
    content:
      "在双缝间距 d 远小于双缝到屏距离 l 的条件下，相邻亮条纹或暗条纹的中心间距满足 Δx = lλ/d。波长越长、屏越远，条纹越疏；双缝间距越大，条纹越密。"
  },
  {
    id: "interference-color-wavelength",
    chapter: "interference",
    title: "条纹间距和光色",
    tags: ["红光", "黄光", "蓝光", "波长", "条纹间距", "颜色"],
    content:
      "不同颜色的单色光波长不同，因此双缝干涉条纹间距不同。红光波长较长，条纹间距较大；黄光条纹间距较小；蓝光波长更短，条纹间距更小。"
  },
  {
    id: "interference-thin-film",
    chapter: "interference",
    title: "薄膜干涉",
    tags: ["薄膜干涉", "肥皂膜", "油膜", "彩色条纹", "膜厚"],
    content:
      "肥皂膜、油膜的彩色条纹来自薄膜前后两个表面反射光的干涉。膜厚不同会改变两束反射光的路程差，不同颜色的亮暗位置也不同，所以会看到彩色纹理。"
  },
  {
    id: "interference-measure-wavelength",
    chapter: "interference",
    title: "用双缝干涉测量光的波长",
    tags: ["测量波长", "双缝干涉实验", "测量头", "滤光片", "公式"],
    content:
      "双缝干涉测波长利用 λ = dΔx/l。实验中 d 为双缝间距，l 为双缝到屏的距离，Δx 为相邻亮条纹间距。为减小误差，常测多个亮条纹之间的总距离再求平均间距。"
  },
  {
    id: "diffraction-basic",
    chapter: "diffraction",
    title: "光的衍射现象",
    tags: ["衍射", "单缝", "绕过障碍物", "中央亮纹", "明暗条纹"],
    content:
      "当光通过很窄的缝或绕过很小的障碍物时，会偏离直线传播方向，在屏上形成比缝更宽的亮纹和明暗相间的条纹，这就是光的衍射。衍射说明光具有波动性。"
  },
  {
    id: "diffraction-width-effect",
    chapter: "diffraction",
    title: "缝宽对单缝衍射的影响",
    tags: ["单缝衍射", "缝宽", "中央亮纹", "亮度", "宽度"],
    content:
      "单缝较宽时，光近似直线通过；缝变窄到可与光波长相比时，衍射明显，中央亮纹变宽，但亮度会降低。缝越窄，光传播方向扩展越明显。"
  },
  {
    id: "diffraction-straight-line-limit",
    chapter: "diffraction",
    title: "为什么平时说光沿直线传播",
    tags: ["直线传播", "衍射条件", "障碍物尺寸", "波长"],
    content:
      "光在均匀介质中传播，且障碍物或孔的尺寸远大于光波长时，衍射很不明显，可以近似看成直线传播。当障碍物尺寸与波长接近或更小时，衍射不能忽略。"
  },
  {
    id: "diffraction-white-light",
    chapter: "diffraction",
    title: "白光衍射为什么有彩色",
    tags: ["白光衍射", "彩色条纹", "波长", "单缝", "圆孔"],
    content:
      "白光包含多种颜色的光。发生衍射时，不同波长的光亮纹位置不同，叠加后就会形成彩色条纹。单缝、圆孔以及障碍物边缘都可以产生衍射图样。"
  },
  {
    id: "diffraction-grating",
    chapter: "diffraction",
    title: "衍射光栅",
    tags: ["衍射光栅", "多缝", "条纹变窄", "亮度增加", "光谱"],
    content:
      "单缝衍射条纹较宽、远离中央的条纹亮度低。增加狭缝个数后，条纹会变窄、亮度增大。衍射光栅就是由许多等距狭缝组成的光学元件，可用于分辨不同波长的光。"
  },
  {
    id: "diffraction-x-ray",
    chapter: "diffraction",
    title: "X 射线衍射和晶体结构",
    tags: ["X射线", "晶体", "衍射", "原子间距", "结构分析"],
    content:
      "晶体中原子排列规则，原子间距与 X 射线波长接近，因此 X 射线照射晶体会产生明显衍射。衍射斑点的位置和强度可用于分析晶体及大分子结构。"
  },
  {
    id: "polarization-transverse-wave",
    chapter: "polarization",
    title: "偏振说明光是横波",
    tags: ["偏振", "横波", "纵波", "电磁波", "振动方向"],
    content:
      "干涉和衍射说明光具有波动性，偏振现象进一步说明光是横波。这里说的光的振动方向，通常指电磁波中电场的方向，且振动方向垂直于光的传播方向。"
  },
  {
    id: "polarization-polarizer",
    chapter: "polarization",
    title: "偏振片和透振方向",
    tags: ["偏振片", "透振方向", "偏振光", "自然光", "通过"],
    content:
      "偏振片有特定的透振方向。振动方向与透振方向一致的光容易通过，垂直的光难以通过。自然光通过一个偏振片后，会变成沿某一特定方向振动的偏振光。"
  },
  {
    id: "polarization-two-polarizers",
    chapter: "polarization",
    title: "两片偏振片的明暗变化",
    tags: ["两片偏振片", "透振方向", "平行", "垂直", "明暗"],
    content:
      "自然光通过第一片偏振片后成为偏振光。若第二片偏振片的透振方向与第一片平行，透射光较强；若二者互相垂直，透射光很弱甚至接近消失。"
  },
  {
    id: "polarization-reflection",
    chapter: "polarization",
    title: "反射光常带有偏振",
    tags: ["反射光", "偏振", "水面", "玻璃", "桌面", "滤光片"],
    content:
      "自然光在水面、玻璃、光滑桌面等表面反射后，反射光往往带有一定偏振。转动偏振片观察这些反射光，明暗会发生明显变化。"
  },
  {
    id: "polarization-applications",
    chapter: "polarization",
    title: "偏振的应用",
    tags: ["偏振应用", "太阳镜", "摄影", "反光", "立体电影", "液晶屏"],
    content:
      "偏振片可减弱水面和玻璃表面的反光，使水下或玻璃后的景物更清楚。偏振太阳镜、摄影滤镜、立体电影眼镜和液晶屏显示都与偏振现象有关。"
  },
  {
    id: "laser-coherence",
    chapter: "polarization",
    title: "激光的相干性",
    tags: ["激光", "相干光", "频率", "相位", "双缝干涉", "衍射"],
    content:
      "普通光源中不同原子的发光方向、频率、相位和偏振状态较杂乱，两个独立普通光源很难形成稳定干涉。激光的频率、相位、偏振和传播方向更一致，是理想的相干光源。"
  },
  {
    id: "laser-directionality",
    chapter: "polarization",
    title: "激光方向性好",
    tags: ["激光", "方向性", "平行度", "测距", "准直"],
    content:
      "激光具有很好的方向性和平行度，传播很远后仍能保持较强集中性。利用短激光脉冲的往返时间可以进行精确测距，日常激光测距仪和月地测距都利用这一特点。"
  },
  {
    id: "laser-high-brightness",
    chapter: "polarization",
    title: "激光亮度高、能量集中",
    tags: ["激光", "高亮度", "能量集中", "切割", "焊接", "医学"],
    content:
      "激光可以在很小空间和很短时间内集中大量能量。强激光会聚后可用于切割、焊接和打孔；医学上也可用激光进行精细手术或处理视网膜等组织。"
  },
  {
    id: "general-light-wave-particle",
    chapter: "general",
    title: "光的波动性和粒子性",
    tags: ["波动性", "粒子性", "干涉", "衍射", "光电效应", "光的本性"],
    content:
      "干涉、衍射和偏振等现象支持光的波动性；而一些现象又需要用光的粒子性解释。高中阶段可先根据问题情境选择模型：讨论条纹和偏振时用波动观点，讨论能量交换时可能需要粒子观点。"
  }
];
