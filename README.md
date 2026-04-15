# Perplexity Pro Counter

一个用于 Perplexity 网页端的 Userscript。

脚本会在页面右下角显示 Pro 查询剩余额度，并支持手动刷新与悬浮卡片拖拽位置记忆。

## 功能

- 自动请求 `https://www.perplexity.ai/rest/rate-limit/all`
- 读取并显示 `remaining_pro` 字段
- 支持手动刷新额度
- 支持拖拽浮窗位置
- 使用 localStorage 记忆浮窗位置
- 根据页面明暗主题自动调整卡片配色

## 环境要求

- 浏览器（Chrome / Edge / Firefox 等）
- Userscript 管理器扩展（推荐 Tampermonkey）
- 已登录 Perplexity 账号

## 安装

1. 安装 Tampermonkey（或其他 Userscript 管理器）。
2. 新建脚本。
3. 将 `perplexity-pro-counter.user.js` 的全部内容粘贴进去并保存。
4. 打开 `https://www.perplexity.ai/`，脚本会自动生效。

## 使用说明

- 打开 Perplexity 页面后，右下角会出现“Pro 查询剩余”浮窗。
- 点击右上角 `↻` 按钮可手动刷新。
- 按住浮窗顶部可拖动位置，松开后会自动保存。

## 常见问题

### 1) 显示“读取失败”

可能原因：

- 当前未登录 Perplexity
- 网络请求被浏览器扩展或策略拦截
- 接口暂时不可用

可尝试：

- 重新登录后刷新页面
- 检查浏览器开发者工具 Network 面板是否成功请求 `/rest/rate-limit/all`

### 2) 显示“未找到 remaining_pro”

说明接口响应结构可能发生变化。需要根据最新返回字段调整脚本解析逻辑。

## 文件结构

- `perplexity-pro-counter.user.js`：主脚本

## 免责声明

本项目为个人辅助工具，仅用于提升个人使用体验。请遵守 Perplexity 的服务条款与相关法律法规。
