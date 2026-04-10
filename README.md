# Pawsonality Quiz · 爪格实验室

一个基于 [pingfanfan/SBTI](https://github.com/pingfanfan/SBTI) 二次开发的开源前端项目：把原本的娱乐人格测试，重构成更适合中文互联网传播的 **宠物 MBTI / 狗格测试 / 猫格测试** 品牌化落地页。

当前默认品牌设定：
- 品牌名：**爪格实验室**
- 主理人露出：**由 女主人 / 卢欣 主理**（可在 `data/config.json` 修改）
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
- 重写 30 道题，去掉原项目里不适合品牌传播的表达，换成更轻盈、更适合女性向传播的中文互联网文案
- 重写 25 个标准人格 + 2 个特殊人格
- 结果类型改成狗狗 / 猫猫 / 混合系毛孩子人格命名

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
│   ├── questions.json    # 题目与选项
│   └── types.json        # 人格类型库
├── src/
│   ├── engine.js         # 匹配引擎
│   ├── quiz.js           # 答题流程
│   ├── result.js         # 结果页渲染
│   ├── share.js          # 分享图生成
│   ├── main.js           # 入口 & 品牌配置注入
│   └── style.css         # 品牌样式
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
   - 如果想更偏狗狗或猫猫，可继续微调人格名称与描述
3. `src/style.css`
   - 改品牌主色

## 技术栈

- Vite
- 原生 JavaScript
- Canvas 分享图
- 纯静态前端，可零后端部署

## 来源说明

- 源码来源：基于 `pingfanfan/SBTI` 二次开发
- 原仓库：<https://github.com/pingfanfan/SBTI>
- 原项目协议：MIT

## License

MIT
