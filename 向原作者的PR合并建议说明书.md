# 致 Claude Nexus 原项目作者代码合并指引 (Pull Request 说明)

**PR 标题建议**: 
Refactor Timeline UI: DeepSeek-Style Micro-Indexing, Auto-Hiding Scrollbars & Navigation Snappiness
（全面重构提升 Timeline 时间线组件：高密度索引排版、物理滚动条折叠隔离与零延迟极速导航）

## 为什么要提交这个 PR？
在实际重度使用插件的过程中，我们发现原版的 Timeline 右侧导航栏在加载几十乃至上百条长篇对话时，存在大量的屏效流失、排版割裂以及操作迟滞问题。为了带来比肩原生产品那样的顶级文本干涉与沉浸质感，我们参考了业界标杆 DeepSeek 桌面端的侧边栏折叠交互，对 `Timeline` 组件以及相关的 `useTimeline.ts` 底层挂载雷达进行了重构。

## 💡 核心升级与修复日志 (Changelog)

### 1. 微型化与高密度的极限排版 (Micro-Indexing UI)
- **痛点**：原先的 36px 行间距，以及 13px 字体规格在列表庞杂时显得非常松散。
- **改动**：在 `Timeline/index.tsx` 中，取消宽大内补，采用 `min-h-[26px]` 结合 `my-px`，单体占高锁死在 28px；取消过宽拉伸，通过 `mr-2` 迫使右侧文字几乎贴身吸附于 `-` 小横线上；统一修改微缩字号为 `12px`。
- **效果**：在侧边栏自动收起时，所有紧密交织的短横线构成了一根极为连贯深邃的“刻度尺”，大幅优化悬浮面板呼吸感。

### 2. 去彩色化的克制系统 (Monochromatic States)
- **痛点**：激活状态原使用 `text-blue-500` 等亮色组合，容易在 Dark Mode 方案下对阅读正文产生视觉争夺。
- **改动**：全面剥离彩色系统，针对 `isActive` 状态使用极为克制高级的纯自适应高光（`!text-zinc-200` + `!bg-zinc-200`）辅以隐蔽的背景框。

### 3. DOM 物理级防穿透折叠 (DOM-level Hide Toggle - 极重要)
- **Bug 痛点**：原代码对于收回去的侧边栏（`w-[2rem]`），在 Y 轴依旧保留了 `overflow-y-auto`。当面对不支持 WebKit 美化或渲染降级的 Edge/Firefox 用户时，操作系统自带的巨大的 16px 灰色滚动条会强行入侵 32px 的窄小边框中，将 `-` 横线视觉极其丑陋地切割盖住。
- **修复**：我们针对 CSS 的 `isExpanded` 响应参数关联绑定了 DOM 的可见限制：
  ```tsx
  className={isExpanded ? 'overflow-y-auto' : 'overflow-y-hidden'}
  ```
- **效果**：仅当鼠标探测伸入面板弹出的瞬间才赐予容器滚动滑槽权限，平时鼠标离开时从操作系统物理层面直接灭杀滚动条占位。

### 4. 彻底解决活性坐标判定虚位错轨 (Active Index Target Desync)
- **Bug 痛点**：`useTimeline.ts` 中的判断使用 `top < 80` 这一死轴数据。但当由于父级 CSS 偏移或者窗口 Header 阻挡使得对话容器无法紧紧咬合屏幕顶部时，所有的判定都会产生严重的坐标滞后（比如点选 N 索引，结果总是高亮在 N-1 切片上）。
- **修复**：注入父级响应容器参数 `containerTop`，并结合精准动态缓冲计算 `threshold = containerTop + SCROLL_OFFSET_PX + 40` 保障阈值随父元素的坐标浮动而同步追踪。
- **效果**：指哪打哪，任何分辨率拖动下，高亮条准确随屏幕坐标定位。

### 5. 零秒快推导航 (Instant Snapping)
- **改动**：在应对可能高达千页对话的数据流下，我们摒弃且替换掉了所有由程序强行平滑滑轮的机制 `behavior: 'smooth'` 修改为 `behavior: 'instant'`。拒绝了动画转场的冗余加载卡顿，使得时间线做到了真正能与底层直接内存联动的瞬移功能。

## 作者合并审核方案
所有的修改针对的原有的 React 底层体系十分尊重并未大规模修改对象组件参数接口，仅仅做了原子类和执行方式的微调逻辑重构。`npm run build` 打包过程干净顺畅。您可在 `src/pages/content/components/Timeline/index.tsx` 和 `src/pages/content/hooks/useTimeline.ts` 实施无缝 Merge。
