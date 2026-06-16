# PhysicsLab AI 光学仿真

面向高中生的光学仿真与本地 AI 助教 Demo。项目把折射、全反射、干涉、衍射、偏振做成可调参数的浏览器仿真，并用内置知识库、公式工具、学习记忆和可选 Ollama 本地模型提供教学回答。

## 在线 Demo

GitHub Pages 部署地址：

```text
https://luyi210.github.io/physics-lab-ai/
```

说明：

- 基础助教可直接在线体验。
- 本地模型增强只会连接访问者自己电脑上的 Ollama，不会连接开发者电脑。

## 项目介绍

可投递版 PDF：

```text
output/pdf/PhysicsLabAI-project-brief.pdf
```

PDF 内容包含：产品介绍、目标用户、交互设计、AI 助教口吻约束、RAG/Agent 技术路线、部署方式、AI 协作方式和后续迭代计划。

## 运行

```bash
npm install
npm run dev
```

打开：

```text
http://127.0.0.1:5173/
```

## 构建

```bash
npm run build
```

## 当前模块

- 光的折射
- 全反射
- 介质折射率调节
- 入射角拖动与自动扫角
- 实时折射角、临界角、反射强度、光速比例读数
- PhysicsLab AI 助教：固定“结论/原因/仿真”回答格式
- 内置 RAG 知识库、公式工具、学习记忆和 50 个高频问题评测集

## 验证

```bash
npm run build
npm run eval:tutor
```
