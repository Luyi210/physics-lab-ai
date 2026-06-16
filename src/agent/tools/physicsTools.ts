import type { ChapterKey } from "../../types";
import type { TutorToolAnswer } from "../types";

type RefractionSnapshot = {
  n1: number | null;
  n2: number | null;
  incidentAngle: number | null;
  refractedAngle: number | null;
  criticalAngle: number | null;
  status: string | null;
  reflectance: number | null;
  transmittance: number | null;
};

function parseNumberAfter(label: string, text: string) {
  const match = text.match(new RegExp(`${label}[^\\d-]*(-?\\d+(?:\\.\\d+)?)`));
  return match ? Number(match[1]) : null;
}

function parsePercentBefore(label: string, text: string) {
  const match = text.match(new RegExp(`${label}[^\\d]*(\\d+(?:\\.\\d+)?)%`));
  return match ? Number(match[1]) : null;
}

function parseRefractionSnapshot(experimentContext: string): RefractionSnapshot {
  const statusMatch = experimentContext.match(/当前状态：([^。\n]+)[。\n]?/);

  return {
    n1: parseNumberAfter("n1=", experimentContext),
    n2: parseNumberAfter("n2=", experimentContext),
    incidentAngle: parseNumberAfter("入射角", experimentContext),
    refractedAngle: parseNumberAfter("折射角", experimentContext),
    criticalAngle: parseNumberAfter("临界角", experimentContext),
    status: statusMatch?.[1] ?? null,
    reflectance: parsePercentBefore("反射能量占比", experimentContext),
    transmittance: parsePercentBefore("透射能量占比", experimentContext)
  };
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function formatNumber(value: number | null, unit = "") {
  return value === null || Number.isNaN(value) ? "暂未显示" : `${value.toFixed(1)}${unit}`;
}

function answerWithFormulaRule(query: string, chapter: ChapterKey): TutorToolAnswer | null {
  if (chapter === "refraction") {
    if (hasAny(query, ["空气射入玻璃", "空气到玻璃", "不会全反射"])) {
      return {
        toolName: "formula-rule",
        answer: [
          "结论：空气射入玻璃时一般不会发生全反射。",
          "原因：全反射要求光从光密介质射向光疏介质；空气到玻璃是光疏介质到光密介质，条件不满足。",
          "仿真：切换成玻璃到空气，再增大入射角，才容易看到全反射和折射光消失。"
        ].join("\n")
      };
    }

    if (hasAny(query, ["空气斜射入玻璃", "空气射入玻璃", "空气斜射到玻璃", "向法线偏折"])) {
      return {
        toolName: "formula-rule",
        answer: [
          "结论：光从空气斜射入玻璃时会向法线偏折。",
          "原因：空气是光疏介质，玻璃是光密介质，光进入玻璃后速度变小，所以折射角小于入射角。",
          "仿真：把介质设为空气到玻璃，观察折射光是否更靠近法线。"
        ].join("\n")
      };
    }

    if (hasAny(query, ["玻璃斜射到空气", "玻璃射到空气", "远离法线"])) {
      return {
        toolName: "formula-rule",
        answer: [
          "结论：光从玻璃斜射到空气时会远离法线。",
          "原因：玻璃是光密介质，空气是光疏介质，光进入空气后速度变大，所以折射角大于入射角。",
          "仿真：把介质设为玻璃到空气，增大入射角时注意折射光是否更贴近界面。"
        ].join("\n")
      };
    }

    if (hasAny(query, ["折射率越大", "全反射越容易", "临界角越小"])) {
      return {
        toolName: "formula-rule",
        answer: [
          "结论：折射率越大，临界角越小，全反射越容易发生。",
          "原因：从介质射向空气时 sinC = 1/n；n 越大，sinC 越小，临界角 C 也越小。",
          "仿真：提高入射介质折射率，观察临界角读数是否减小。"
        ].join("\n")
      };
    }

    if (hasAny(query, ["为什么会发生全反射", "全反射条件", "什么时候全反射"])) {
      return {
        toolName: "formula-rule",
        answer: [
          "结论：全反射发生在光从光密介质射向光疏介质，且入射角达到或超过临界角时。",
          "原因：临界角时折射角等于 90°；再增大入射角，折射光消失，只剩反射光。",
          "仿真：观察入射角超过临界角后，折射光是否从界面另一侧消失。"
        ].join("\n")
      };
    }

    if (hasAny(query, ["临界角怎么理解", "什么是临界角"])) {
      return {
        toolName: "formula-rule",
        answer: [
          "结论：临界角是刚好要发生全反射时的入射角。",
          "原因：此时折射角等于 90°，光线几乎贴着界面传播；从空气或真空看常用 sinC = 1/n。",
          "仿真：把入射角调到临界角附近，观察折射光是否贴近界面并准备消失。"
        ].join("\n")
      };
    }
  }

  if (chapter === "interference") {
    if (hasAny(query, ["稳定干涉", "相干", "相干光"])) {
      return {
        toolName: "formula-rule",
        answer: [
          "结论：能形成稳定干涉的两束光应是相干光。",
          "原因：相干光要频率相同，并保持相位差稳定，这样叠加后加强和削弱的位置才固定。",
          "仿真：在双缝页观察亮暗条纹，稳定条纹说明两束光在持续叠加。"
        ].join("\n")
      };
    }

    if (hasAny(query, ["中央为什么", "中央亮纹"])) {
      return {
        toolName: "formula-rule",
        answer: [
          "结论：双缝干涉中央通常是亮条纹。",
          "原因：中央位置到两条缝的路程差为 0，相当于同相到达，所以相互加强。",
          "仿真：看屏幕正中央的亮纹，再向两侧比较明暗条纹的交替。"
        ].join("\n")
      };
    }

    if (hasAny(query, ["条纹间距", "Δx", "间距", "波长变大", "屏幕", "双缝间距"])) {
      if (hasAny(query, ["双缝间距变大", "缝间距变大", "d变大"])) {
        return {
          toolName: "formula-rule",
          answer: [
            "结论：双缝间距变大时，条纹间距会变小。",
            "原因：双缝干涉中 Δx = Lλ/d，条纹间距与双缝间距 d 成反比。",
            "仿真：增大双缝间距，观察屏幕上的明暗条纹是否变得更密。"
          ].join("\n")
        };
      }

      if (hasAny(query, ["屏幕", "屏距", "越远", "l变大"])) {
        return {
          toolName: "formula-rule",
          answer: [
            "结论：屏幕离双缝越远，条纹间距越大。",
            "原因：Δx = Lλ/d，屏距 L 变大时，相邻亮纹或暗纹之间的距离也变大。",
            "仿真：增大屏距，重点看条纹是不是被拉开。"
          ].join("\n")
        };
      }

      if (hasAny(query, ["波长", "红光", "蓝光"])) {
        return {
          toolName: "formula-rule",
          answer: [
            "结论：波长变大时，双缝干涉条纹间距变大；红光通常比蓝光条纹更疏。",
            "原因：红光波长较长，且 Δx = Lλ/d，所以条纹间距较大。",
            "仿真：把波长调大，观察明暗条纹是否向外拉开。"
          ].join("\n")
        };
      }

      return {
        toolName: "formula-rule",
        answer: [
          "结论：双缝干涉条纹间距由 Δx = Lλ/d 决定。",
          "原因：它随屏距 L、波长 λ 变大而变大，随双缝间距 d 变大而变小。",
          "仿真：分别只改变一个变量，比较条纹是变疏还是变密。"
        ].join("\n")
      };
    }

    if (hasAny(query, ["亮条纹", "暗条纹", "条件", "路程差"])) {
      return {
        toolName: "formula-rule",
        answer: [
          "结论：亮条纹来自相互加强，暗条纹来自相互削弱。",
          "原因：两束光到达同一点的路程差为 kλ 时加强；相差半个波长的奇数倍时削弱。",
          "仿真：看屏幕上亮暗交替的位置，本质上是在看路程差的变化。"
        ].join("\n")
      };
    }

    if (hasAny(query, ["肥皂膜", "油膜", "薄膜", "彩色条纹"])) {
      return {
        toolName: "formula-rule",
        answer: [
          "结论：肥皂膜的彩色条纹主要来自薄膜干涉。",
          "原因：白光在薄膜上下表面反射，两束反射光的路程差随膜厚变化，不同波长加强的位置不同。",
          "仿真：在干涉页改变波长，观察不同颜色对应的亮纹位置会不同。"
        ].join("\n")
      };
    }

    if (hasAny(query, ["激光", "干涉实验"])) {
      return {
        toolName: "formula-rule",
        answer: [
          "结论：干涉实验常用激光，因为激光相干性好。",
          "原因：激光频率较单一、相位差稳定，更容易形成清晰稳定的干涉条纹。",
          "仿真：观察双缝页的稳定明暗条纹，可以把它理解成相干光叠加的结果。"
        ].join("\n")
      };
    }
  }

  if (chapter === "polarization") {
    if (hasAny(query, ["马吕斯", "malus", "cos", "光强", "旋转第二片", "夹角"])) {
      return {
        toolName: "formula-rule",
        answer: [
          "结论：马吕斯定律描述偏振光通过检偏器后光强怎样随夹角变化。",
          "原因：I = I0cos²θ，θ 是偏振方向和透振方向的夹角；夹角越接近 90°，透过光越弱。",
          "仿真：转动第二片偏振片，观察光强是否按“平行最亮、垂直最暗”变化。"
        ].join("\n")
      };
    }

    if (hasAny(query, ["平行", "垂直", "两片偏振片", "变暗", "比较亮"])) {
      return {
        toolName: "formula-rule",
        answer: [
          "结论：两片偏振片平行时较亮，垂直时很暗。",
          "原因：第一片把自然光变成偏振光；第二片只让沿自己透振方向的振动通过。",
          "仿真：把两片偏振片夹角从 0° 转到 90°，观察透过光强逐渐减小。"
        ].join("\n")
      };
    }

    if (hasAny(query, ["太阳镜", "眩光", "水面反光", "减弱水面反光"])) {
      return {
        toolName: "formula-rule",
        answer: [
          "结论：偏振片能减弱水面反光和眩光。",
          "原因：水面反射光常带有偏振，合适的透振方向会挡住较强的反射光分量。",
          "仿真：在偏振页转动偏振片，观察透过光强随方向改变。"
        ].join("\n")
      };
    }
  }

  if (chapter === "diffraction") {
    if (hasAny(query, ["什么是光的衍射", "衍射是什么"])) {
      return {
        toolName: "formula-rule",
        answer: [
          "结论：光的衍射是光通过孔或缝、绕过障碍物后偏离直线传播的现象。",
          "原因：衍射体现光的波动性，孔缝或障碍物尺寸接近波长时更明显。",
          "仿真：在衍射页调小缝宽，观察中央亮纹和旁侧条纹的变化。"
        ].join("\n")
      };
    }

    if (hasAny(query, ["光沿直线传播", "平时又说光", "直线传播"])) {
      return {
        toolName: "formula-rule",
        answer: [
          "结论：光沿直线传播是常见条件下的近似说法。",
          "原因：当障碍物或孔的尺寸远大于波长时，衍射不明显，所以可以近似看成直线传播。",
          "仿真：把缝宽调小到接近波长时，就能看到直线传播近似不再够用。"
        ].join("\n")
      };
    }

    if (hasAny(query, ["缝宽", "中央亮纹", "变小", "最宽"])) {
      return {
        toolName: "formula-rule",
        answer: [
          "结论：单缝变窄时，中央亮纹会变宽，整体亮度通常会降低。",
          "原因：缝宽越接近光的波长，衍射越明显，光更容易向两侧展开。",
          "仿真：逐渐调小缝宽，重点看中央亮纹宽度和亮度的变化。"
        ].join("\n")
      };
    }

    if (hasAny(query, ["分辨率", "望远镜", "中央亮斑", "口径"])) {
      return {
        toolName: "formula-rule",
        answer: [
          "结论：望远镜分辨率会受到衍射限制。",
          "原因：光通过有限口径后会形成中央亮斑，两个很近的像斑重叠时就难以分辨。",
          "仿真：把缝宽看作口径的类比，口径越小，衍射展开越明显。"
        ].join("\n")
      };
    }

    if (hasAny(query, ["衍射和干涉", "区别"])) {
      return {
        toolName: "formula-rule",
        answer: [
          "结论：衍射强调光绕过障碍或通过小孔后展开，干涉强调多束光叠加形成明暗。",
          "原因：两者都体现光的波动性，但观察角度不同：一个看传播展开，一个看叠加强弱。",
          "仿真：衍射页看单缝展开，干涉页看双缝亮暗条纹。"
        ].join("\n")
      };
    }
  }

  if (hasAny(query, ["激光为什么方向性", "方向性好", "能量比较集中"])) {
    return {
      toolName: "formula-rule",
      answer: [
        "结论：激光方向性好，能量容易集中在很小区域。",
        "原因：激光发散角小，传播时不容易散开；再经过会聚后，能量集中更明显。",
        "仿真：可以和衍射现象对比理解：发散越小，光束越集中。"
      ].join("\n")
    };
  }

  return null;
}

export function answerWithPhysicsTool(args: { query: string; chapter: ChapterKey; experimentContext: string }): TutorToolAnswer | null {
  const query = args.query.trim();
  const formulaAnswer = answerWithFormulaRule(query, args.chapter);
  if (formulaAnswer) return formulaAnswer;

  if (args.chapter !== "refraction") return null;

  const snapshot = parseRefractionSnapshot(args.experimentContext);
  const hasRefractionState = snapshot.n1 !== null && snapshot.n2 !== null && snapshot.incidentAngle !== null;
  if (!hasRefractionState) return null;

  if (hasAny(query, ["临界角", "全反射条件", "什么时候全反射"])) {
    const relation = snapshot.n1 !== null && snapshot.n2 !== null && snapshot.n1 > snapshot.n2 ? "当前是从光密介质射向光疏介质，满足可能发生全反射的方向条件。" : "当前不是典型的光密到光疏方向，一般不会出现全反射。";
    return {
      toolName: "refraction-state",
      answer: [
        `结论：当前临界角是 ${formatNumber(snapshot.criticalAngle, "°")}，入射角是 ${formatNumber(snapshot.incidentAngle, "°")}。`,
        `原因：全反射要先满足光从光密介质射向光疏介质，再看入射角是否达到临界角。${relation}`,
        "仿真：继续增大入射角，观察折射光是否贴近界面并最终消失。"
      ].join("\n")
    };
  }

  if (hasAny(query, ["折射角", "偏折", "向法线", "远离法线"])) {
    return {
      toolName: "refraction-state",
      answer: [
        `结论：当前折射角是 ${formatNumber(snapshot.refractedAngle, "°")}，入射角是 ${formatNumber(snapshot.incidentAngle, "°")}。`,
        "原因：光进入折射率不同的介质后速度改变，方向会按折射定律偏折。",
        "仿真：改变两侧折射率，比较折射光是更靠近法线还是更远离法线。"
      ].join("\n")
    };
  }

  if (hasAny(query, ["透射", "能量", "光强", "既有反射", "反射光又有折射光", "反射能量"])) {
    return {
      toolName: "refraction-state",
      answer: [
        `结论：当前反射约 ${formatNumber(snapshot.reflectance, "%")} ，透射约 ${formatNumber(snapshot.transmittance, "%")}。`,
        "原因：界面处通常既有反射也有折射；接近全反射时，透射部分会明显减小。",
        "仿真：拖动入射角滑块，观察反射光和折射光亮度如何变化。"
      ].join("\n")
    };
  }

  if (hasAny(query, ["现在", "当前状态", "为什么现在", "这个图"])) {
    return {
      toolName: "refraction-state",
      answer: [
        `结论：当前状态是${snapshot.status ?? "折射/反射并存"}。`,
        `原因：入射角为 ${formatNumber(snapshot.incidentAngle, "°")}，两侧折射率分别是 ${snapshot.n1?.toFixed(2)} 和 ${snapshot.n2?.toFixed(2)}，这些量共同决定光线方向。`,
        "仿真：先只改变一个变量，例如入射角，再看折射角和反射强度的变化。"
      ].join("\n")
    };
  }

  return null;
}

export function buildPhysicsToolContext(chapter: ChapterKey, experimentContext: string) {
  if (chapter !== "refraction") {
    const formulaTools: Record<ChapterKey, string> = {
      refraction: "折射状态解析。",
      interference: "双缝条纹间距 Δx=Lλ/d、亮暗条纹路程差条件。",
      diffraction: "单缝衍射中缝宽与中央亮纹变化关系。",
      polarization: "马吕斯定律 I=I0cos²θ、两片偏振片明暗关系。"
    };

    return `可用物理工具：${formulaTools[chapter]}当前章节暂无实时参数，只使用页面现象和公式关系。`;
  }

  const snapshot = parseRefractionSnapshot(experimentContext);

  return [
    "可用物理工具：折射状态解析、临界角判断。",
    `n1=${snapshot.n1 ?? "未知"}，n2=${snapshot.n2 ?? "未知"}，入射角=${snapshot.incidentAngle ?? "未知"}°，折射角=${snapshot.refractedAngle ?? "无"}°，临界角=${snapshot.criticalAngle ?? "无"}°。`,
    snapshot.status ? `当前状态：${snapshot.status}。` : "当前状态：未知。"
  ].join("\n");
}
