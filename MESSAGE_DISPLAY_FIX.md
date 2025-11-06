# 消息显示问题修复

## 问题描述
用户反馈：发送的消息显示为对方发送的消息，即消息的发送者显示错误。

## 根本原因
在消息处理逻辑中，`from` 字段的处理有误：
1. 在加载历史消息时，错误地将所有incoming消息的`from`都设置为当前联系人ID
2. 没有保持原始消息的发送者信息

## 修复内容

### 1. 修复历史消息加载逻辑
**原代码：**
```typescript
const localMessages = localHistory.map(msg => ({
  from: msg.direction === 'incoming' ? active : 'me',
  text: msg.text,
  ts: msg.timestamp
}));
```

**修复后：**
```typescript
const localMessages = localHistory.map(msg => ({
  from: msg.from, // 保持原始的 from 字段
  text: msg.text,
  ts: msg.timestamp
}));
```

### 2. 修复数据库消息加载逻辑
**原代码：**
```typescript
const formattedDbMessages = dbMessages.messages.map((msg: any) => ({
  from: msg.direction === 'INCOMING' ? active : 'me',
  text: msg.content,
  ts: new Date(msg.sentAt).getTime()
}));
```

**修复后：**
```typescript
const formattedDbMessages = dbMessages.messages.map((msg: any) => ({
  from: msg.direction === 'INCOMING' ? msg.sender?.whatsappId || active : 'me',
  text: msg.content,
  ts: new Date(msg.sentAt).getTime()
}));
```

### 3. 确保消息接收时保持正确的发送者信息
**修复后的接收消息逻辑：**
```typescript
const incomingMessage = {
  from: m.from,  // 保持原始发送方
  text: m.text,
  ts: m.ts
};
```

### 4. 添加调试输出
- 加载联系人消息时的调试信息
- 发送消息时的调试信息
- 接收消息时的调试信息
- 消息列表更新后的调试信息

## 消息显示逻辑
在MessagePane组件中：
- `m.from === 'me'` 的消息显示在右边（蓝色气泡）
- `m.from !== 'me'` 的消息显示在左边（灰色气泡）

## 验证方法
1. 发送消息应该显示在右边（蓝色）
2. 接收到的消息应该显示在左边（灰色）
3. 检查浏览器控制台的调试输出，确认`from`字段正确

## 关键点
- 消息的`from`字段必须准确反映真实的发送者
- 对于发送的消息，`from`应该是`'me'`
- 对于接收的消息，`from`应该是发送方的WhatsApp ID
- 不应该根据消息方向人为修改`from`字段

## 影响范围
- 聊天界面的消息显示
- 本地存储的消息历史
- 数据库同步的消息记录