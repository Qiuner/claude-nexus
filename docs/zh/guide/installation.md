# 安装方式

## Chrome Web Store 安装

可通过官方 Chrome Web Store 页面安装 claude-nexus：

- https://chromewebstore.google.com/detail/claude-nexus/mjlaeohblnaalakaflnchcmpoojjejka

## 手动安装

1. 克隆仓库。

```bash
git clone https://github.com/Qiuner/claude-nexus.git
cd claude-nexus
```

2. 安装依赖。

```bash
yarn install
```

3. 构建 Chrome 扩展。

```bash
yarn build:chrome
```

4. 在 Chrome 中加载已解压扩展。

- 打开 `chrome://extensions`
- 开启 **开发者模式**
- 点击 **加载已解压的扩展程序**
- 选择 `dist_chrome` 文件夹

## 说明

- 扩展只会注入到 `https://claude.ai/*`
- 文件夹和提示词等数据保存在浏览器本地
- claude-nexus 已上架 Chrome Web Store，手动安装仍适用于本地开发构建
