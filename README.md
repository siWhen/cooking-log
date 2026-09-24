# 做饭记录（Cooking Log）

一个开源、轻量的个人做饭记录工具，以 PWA 形式运行：手机上"添加到主屏幕"后就像 App 一样使用。

- 🥬 **食材库存**：数量、单位、保质期、自定义标签，临近过期提醒
- 📔 **饮食日记**：照片、评分、评价、感悟、使用的食材
- ✨ **AI 功能（可选，自带 Key）**：营养点评、食谱推荐
- 📦 **数据导出/导入**：JSON / ZIP 备份，CSV 分析

> 🚧 开发中。完整的部署教程会在后续阶段补全。

<!-- 截图占位 -->

## 本地开发

需要 Node.js 20 以上（推荐当前 LTS）。

```bash
npm install
npm run dev
```

常用命令：

| 命令 | 作用 |
|---|---|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本到 `dist/` |
| `npm run preview` | 本地预览构建结果（可测试 PWA） |
| `npm test` | 运行单元测试 |
| `npm run lint` | 代码检查 |
| `npm run generate-pwa-assets` | 根据 `public/favicon.svg` 重新生成 App 图标 |

## 许可证

[MIT](LICENSE)
