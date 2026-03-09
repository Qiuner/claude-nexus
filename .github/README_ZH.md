<div align="center">
<img src="../public/icon-128.png" width="96" alt="claude-nexus logo" />


# claude-nexus

### Claude 缺失的增强套件 ✨

为 [claude.ai](https://claude.ai) 带来文件夹管理、时间线导航、提示词库等强大功能。

[![Chrome](https://img.shields.io/badge/Chrome-✓-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](#安装)
[![License: MIT](https://img.shields.io/badge/License-MIT-D97757?style=flat-square)](../LICENSE)
[![Built with React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

[English](../README.md) · [中文](#)

</div>

---

## ✨ 功能

### 📂 对话文件夹管理

**让你的对话井井有条。**
通过拖拽将对话整理到文件夹中，告别杂乱的历史记录列表。

- **拖拽操作**：轻松将对话移入文件夹
- **便捷管理**：随时重命名、删除和重新整理
- **持久化存储**：文件夹结构跨会话本地保存

### 📍 时间线导航 _(即将推出)_

**再也不会在长对话中迷失。**
可视化节点让你一眼看清对话结构，点击即可跳转到任意消息。

### 💡 提示词库 _(即将推出)_

**你的个人提示词武器库。**
保存最佳提示词，无需反复输入。

### 💾 对话导出 _(即将推出)_

**你的数据，你做主。**
将对话导出为 Markdown 或 JSON 格式。

---

## 📥 安装

### 手动安装（开发版）

1. 克隆仓库

   ```bash
   git clone https://github.com/qiuner/claude-nexus.git
   cd claude-nexus
   ```

2. 安装依赖

   ```bash
   yarn install
   ```

3. 构建扩展

   ```bash
   yarn build:chrome
   ```

4. 在 Chrome 中加载
   - 打开 `chrome://extensions`
   - 开启**开发者模式**
   - 点击**加载已解压的扩展程序**
   - 选择 `dist/` 文件夹

---

## 🛠️ 开发

```bash
# 启动开发模式（自动重新构建）
yarn dev:chrome

# 每次构建后：
# 1. 打开 chrome://extensions
# 2. 点击 claude-nexus 的刷新按钮
# 3. 刷新 claude.ai 页面
```

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feat/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送分支 (`git push origin feat/amazing-feature`)
5. 发起 Pull Request

---

## 🌟 致谢

灵感来源于 [gemini-voyager](https://github.com/Nagi-ovo/gemini-voyager) —— 一个为 Google Gemini 打造的全能增强套件。

---

## 📄 许可证

MIT License © 2026 Qiuner

<div align="center">
为 Claude 用户用心打造 ❤️
</div>
