# Pawsonality Quiz · 爪格实验室

一个基于 [pingfanfan/SBTI](https://github.com/PeterChen1997/pawsonality-quiz) 二次开发的开源前端项目：把原本的娱乐人格测试，重构成更适合中文互联网传播的 **宠物 MBTI / 狗格测试 / 猫格测试** 品牌化落地页。

这一版已经把底层结构重做为：
- 猫 / 狗双题库彻底拆开
- 固定 15 维顺序 + 12 题短测的复合映射计分
- 标准人格 / 隐藏人格 / 混合人格三层结果体系
- 可运行的数据校验脚本，用来检查题库归属、pattern 长度和结果映射稳定性

当前默认品牌设定：
- 品牌名：**爪格实验室**
- 主理人露出：**由 鲁西西 主理**（可在 `data/config.json` 修改）
- 场景：小红书、朋友圈、社群裂变、轻测试引流、宠物品牌/博主人设验证

## 在线方向

适合部署成：
- GitHub Pages
- Vercel / Netlify
- 任意静态站点

默认 Pages base 已配置为：`/pawsonality-quiz/`

## 这次重构了什么

### 品牌层
- 从 `SBTI 人格测试` 改为 **爪格实验室｜宠物人格测试**
- 首页、结果页、分享图、meta、按钮文案全部改为宠物人格语境
- 新增主理人/IP 露出位
- 新增源码来源说明：**基于 pingfanfan/SBTI 二次开发**

### 内容层
- 重写 15 个维度定义，改成更适合宠物人格叙事的表达
- 拆成两套独立短测题库：狗狗 12 题、猫猫 12 题
- 每个结果补全 `subtitle / footnote / deepDive / tags`
- 结果类型改成狗格 / 猫格 / 混合系毛孩子人格命名

### 产品层
- 首页支持动态品牌配置
- 结果页支持动态文案、主理人露出、源码来源展示
- 分享图配色和底部水印同步品牌化
- 一键部署命令改成新仓库占位

## 项目结构

```text
├── data/
│   ├── config.json       # 品牌配置、标题、主理人、免责声明、部署命令
│   ├── dimensions.json   # 15个宠物人格维度
│   ├── questions.json    # 猫 / 狗双题库与特殊题
│   └── types.json        # 狗格 / 猫格 / 特殊人格结果库
├── src/
│   ├── engine.js         # 匹配引擎
│   ├── quiz.js           # 答题流程
│   ├── result.js         # 结果页渲染
│   ├── share.js          # 分享图生成
│   ├── main.js           # 入口 & 品牌配置注入
│   └── style.css         # 品牌样式
├── scripts/
│   └── validate-data.mjs # 数据结构与 pattern 映射校验
├── index.html
└── vite.config.js
```

## 本地开发

```bash
git clone https://github.com/YOUR_NAME/pawsonality-quiz.git
cd pawsonality-quiz
npm install
npm run dev
```

## 数据校验

```bash
npm run validate
```

会检查：
- 15 维顺序和定义是否完整
- 猫 / 狗题库是否各自满足 12 题与最低维度覆盖
- 结果 code、pattern 长度、特殊人格引用是否有效
- 每个标准人格的 exact pattern 是否会稳定命中自己
- 结果库是否过度拥挤

## 构建

```bash
npm run build
```

## 快速改成你的品牌

优先改这几个字段：

1. `data/config.json`
   - `display.title`
   - `display.subtitle`
   - `display.ownerLabel`
   - `display.deployCommand`
   - `display.shareFooter`
2. `data/types.json`
   - 如果想更偏狗狗或猫猫，可继续微调人格名称、code、短注脚和深层解释
3. `src/style.css`
   - 改品牌主色

## 技术栈

- Vite
- 原生 JavaScript
- Canvas 分享图
- 纯静态前端，可零后端部署

## 来源说明

- 源码来源：基于 `pingfanfan/SBTI` 二次开发
- 原仓库：<https://github.com/PeterChen1997/pawsonality-quiz>
- 原项目协议：MIT

## License

MIT
