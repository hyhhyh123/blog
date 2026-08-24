# 个人博客（Hank 风格）

一个仿制 Typecho Hank 主题风格的纯静态博客：左侧固定边栏、中间 banner + 文章卡片、右侧小工具。文章用 Markdown 管理，托管在 GitHub 公开仓库，通过 GitHub Pages 免费访问。

## 本地预览

双击 `start.bat`，浏览器会自动打开 `http://localhost:8323`。

未部署到 GitHub 时，页面会显示仓库自带的示例文章；部署后自动读取你的真实文章。

## 部署状态 ✅ 已上线

- **线上地址**：https://hyhhyh123.github.io/blog/
- **仓库**：https://github.com/hyhhyh123/blog （公开）

### 发新文章（日常操作，只需 1 步）

把 Markdown 文件上传到仓库的 `articles/` 文件夹即可（文件名格式：`2026-08-24-文章标题.md`），
上传后 1~2 分钟首页自动出现。也可以在本地编辑好，用 git push。

### 手动部署步骤（重新部署时才需要看）

### 1. 准备 GitHub 账号

- 注册/登录 [github.com](https://github.com)
- 记住你的用户名，假设是 `hyhhyh123`

### 2. 创建公开仓库

- 点击右上角 `+` → `New repository`
- Repository name 填 `blog`（也可以填 `hyhhyh123.github.io`，见下方说明）
- 勾选 **Public**
- 点击 **Create repository**

### 3. 上传本项目文件

在新仓库页面点击 **uploading an existing file**，把 `D:\dev\blog-hyhhyh123` 里的这些文件拖进去：

```
index.html
css/
js/
articles/
README.md
```

点击 **Commit changes**。

### 4. 修改配置

编辑仓库里的 `js/config.js`：

```js
githubUser: "你的用户名",
githubRepo: "blog",
```

把 `hyhhyh123` 改成你的 GitHub 用户名。顺便把 `title`、`author`、`avatar` 等改成你的信息。

### 5. 开启 GitHub Pages

- 仓库 → **Settings** → 左侧 **Pages**
- Source 选择 **Deploy from a branch**
- Branch 选 **main** / **root**，点击 **Save**
- 等待 1~2 分钟，页面会显示你的博客地址

**访问地址会是**：

```
https://hyhhyh123.github.io/blog
```

（如果你的仓库名是 `hyhhyh123.github.io`，则地址是 `https://hyhhyh123.github.io`）

## 发新文章

1. 在仓库的 `articles/` 目录点击 **Add file → Create new file**
2. 文件名格式：`2026-08-24-文章标题.md`
3. 文件内容示例：

```markdown
---
title: 文章标题
date: 2026-08-24
category: 生活
tags: [生活, 随笔]
cover: images/photo.jpg
---

这里是正文，支持 Markdown。
```

4. 点击 **Commit changes**
5. 等 30 秒左右刷新博客首页，新文章就会出现

## 自定义说明

- 头像 / banner：`js/config.js` 里的 `avatar` 和 `banner` 改成你自己的图片 URL
- 菜单 / 社交链接 / 右侧小工具：都在 `js/config.js` 里
- 配色：修改 `css/style.css` 里的 CSS 变量 `--accent` 等
- 背景音乐：页面右下角可切换。音乐由 Web Audio API 实时合成一段轻柔 Lo-fi 和弦循环，无需外部音频文件

## 关于网址

- 免费方案：`https://用户名.github.io/仓库名`
- 想要 `https://hyhhyh123` 这种短域名，需要去域名商购买并绑定（一年约 60~90 元）

## 文件结构

```
blog-hyhhyh123/
├── index.html          # 博客主页
├── css/
│   ├── style.css       # 主题样式
│   └── github.min.css  # 代码高亮主题
├── js/
│   ├── config.js       # 站点配置
│   ├── app.js          # 核心逻辑
│   ├── marked.min.js   # Markdown 解析
│   └── highlight.min.js# 代码高亮
├── articles/           # Markdown 文章
│   ├── 2026-08-24-第一篇博客.md
│   └── 2026-08-23-博客搭建记录.md
├── preview-server.js   # 本地预览服务器
├── start.bat           # 本地预览
└── README.md           # 本说明
```
