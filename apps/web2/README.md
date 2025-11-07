# Web2 - 旧版 JavaScript 文件归档

## 📁 目录说明

这个文件夹包含了从 `apps/web/src` 迁移过来的所有重复的 `.js` 文件。

## 🔄 迁移原因

在项目升级到 TypeScript 过程中，`apps/web/src` 目录下同时存在 `.js` 和 `.tsx` 两个版本的文件，造成了以下问题：

1. **代码冗余**：同一功能存在两个版本
2. **维护困难**：修改时容易遗漏某个版本
3. **构建混乱**：Vite 可能加载错误的版本
4. **类型不一致**：TypeScript 类型检查无法覆盖 JS 文件

## 📋 迁移的文件列表

### 根目录文件
- `api.js` → 使用 `api.ts`
- `App.js` → 使用 `App.tsx`
- `main.js` → 使用 `main.tsx`
- `store.js` → 使用 `store.ts`

### Components 组件
- `components/ChatList.js` → 使用 `ChatList.tsx`
- `components/ChatSearch.js` → 使用 `ChatSearch.tsx`
- `components/MessagePane.js` → 使用 `MessagePane.tsx`
- `components/QRPanel.js` → 使用 `QRPanel.tsx`
- `components/Sidebar.js` → 使用 `Sidebar.tsx`

### Pages 页面
- `pages/Chat.js` → 使用 `Chat.tsx`
- `pages/Dashboard.js` → 使用 `Dashboard.tsx`
- `pages/Login.js` → 使用 `Login.tsx`
- `pages/Register.js` → 使用 `Register.tsx`
- `pages/Settings.js` → 使用 `Settings.tsx`

### Services 服务
- `services/dbSync.js` → 使用 `dbSync.ts`

### Utils 工具
- `utils/chatHistory.js` → 使用 `chatHistory.ts`

## ✅ 迁移后状态

**apps/web/src** 目录现在只包含 `.tsx` 和 `.ts` 文件，完全使用 TypeScript：

```
apps/web/src/
├── api.ts ✅
├── App.tsx ✅
├── main.tsx ✅
├── store.ts ✅
├── components/
│   ├── ChatList.tsx ✅
│   ├── ChatSearch.tsx ✅
│   ├── MessagePane.tsx ✅
│   ├── QRPanel.tsx ✅
│   └── Sidebar.tsx ✅
├── pages/
│   ├── AISettings.tsx ✅ (新增)
│   ├── Chat.tsx ✅
│   ├── Dashboard.tsx ✅
│   ├── Login.tsx ✅
│   ├── Register.tsx ✅
│   └── Settings.tsx ✅
├── services/
│   └── dbSync.ts ✅
└── utils/
    └── chatHistory.ts ✅
```

## 🚀 下一步

1. **保留归档**：这些 JS 文件作为历史记录保留
2. **仅使用 TypeScript**：所有新开发都使用 `.ts` 和 `.tsx`
3. **定期清理**：如果 TypeScript 版本运行稳定，可以考虑删除此目录

## ⚠️ 重要提示

- **不要修改** 这个目录下的文件
- **不要引用** 这个目录下的文件
- **不要构建** 这个目录（没有 package.json）
- 这个目录仅供参考和备份

## 📅 迁移记录

- **迁移日期**：2025-11-07
- **迁移文件数**：16 个
- **迁移原因**：消除 JS/TSX 重复，统一使用 TypeScript
- **当前状态**：已完成，仅供归档

---

如需恢复任何文件，请参考此目录内容，但建议使用 TypeScript 版本进行开发。
