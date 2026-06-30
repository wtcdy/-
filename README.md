# 最佳干饭人 🍱

> 朋友间 1:1 配对干饭的趣味微信小程序 · 个人非盈利项目

## ✨ 功能

- 拍照打卡（早/午/晚/加餐 · 必选）
- 正餐 / 速食 二选一（必选）
- **5 大食物类别**多选（主食 / 蔬菜水果 / 肉蛋水产 / 汤粥饮品 / 甜品零食）
- 三态阈值（按时 / 延时 / 缺卡）
- 1:1 配对 + 搭子查看
- 周总结（仅工作日 5 天）

## 🛠 技术栈

- 微信小程序（基础库 3.0+）
- 微信云开发（云函数 + 云数据库 + 云存储）— 个人主体免费额度够 MVP
- 梦幻治愈设计（马卡龙色板 + 圆角胶囊 + 柔焦阴影）

## ⚡ 快速开始（本地 Mock 模式 · 推荐）

**如果您还没注册 AppID / 不想开通云开发**，本项目已内置本地 Mock 模拟层，**无需云开发环境即可完整体验所有功能**。

### 步骤 1：导入项目

1. 打开微信开发者工具
2. 左侧选"**小程序**" → 右上"+**"** → "**导入项目**"
3. 项目目录：`/workspace/ganfan-mini`
4. AppID：选"**测试号**"（无需注册）
5. 后端服务：选"**小程序·云开发**"（即使不用也要选，工具会跳过实际连接）
6. 点击"**导入**"

### 步骤 2：开启 Mock 模式

打开 `app.js`，确认：

```js
globalData: {
  mockMode: true,   // <-- 本地体验保持 true
  ...
}
```

**默认就是 true**，直接编译运行即可。

### 步骤 3：体验流程

| 步骤 | 操作 |
|---|---|
| 1 | 编译运行，扫码登录开发者工具 |
| 2 | 自动跳转登录页 → 勾选协议 → 点"**微信授权**"按钮（Mock 下也用同一按钮，内部跳过） |
| 3 | 进入"**今日**"页，4 个餐次卡 |
| 4 | 点击餐次卡 → 拍照/选图 → 选正餐/速食 → 选 5 大食物类别 → 提交 |
| 5 | 底部 Tab 切到"**搭子**"→ 发起配对（自动生成 6 位码） |
| 6 | 切到"**我的**"→ 看历史/周总结 |

### Mock 模式能力清单

| 功能 | Mock 支持 | 备注 |
|---|---|---|
| 登录 | ✅ | 自动生成 mock openid |
| 打卡 | ✅ | 状态判定同云函数逻辑 |
| 配对 | ✅ | 6 位配对码 + 10 分钟倒计时 |
| 搭子信息 | ✅ | 自动 mock 搭子数据 |
| 历史记录 | ✅ | 全部本地内存 |
| 周统计 | ✅ | 计算逻辑一致 |
| 点赞 | ✅ | 同一天限 1 次 |
| 图片上传 | ⚠️ | 跳过云存储，fileID = `mock://...` |
| 真实分享 | ❌ | 仅模拟器内可见 |

---

## 🔧 切换到真实云开发模式

当您准备好 AppID + 云开发环境时：

1. **开通云开发**：开发者工具 → "云开发" → 开通环境，记录环境 ID
2. **修改 `app.js`**：把 `mockMode` 改为 `false`，把 `env` 改为真实环境 ID
3. **部署云函数**：`cloudfunctions/` 下 12 个云函数，右键 → "**上传并部署：云端安装依赖**"
4. **初始化数据库集合**：`users / pairCodes / meals / likedPartnerDates / dailyStats / weeklyStats`
5. **真机预览**：工具栏"预览"→ 扫码

```
ganfan-mini/
├── app.js / app.json / app.wxss       # 全局骨架（T1）
├── project.config.json                 # IDE 配置
├── sitemap.json                        # 搜索索引
├── utils/                              # 工具层（T2/T3）
│   ├── auth.js          登录态
│   ├── request.js       云函数快捷调用
│   ├── date.js          日期/工作日/周范围
│   ├── meal.js          餐次/类别/状态/校验
│   └── imgSecCheck.js   UGC 安全 + 压缩上传
├── components/                         # 通用组件（占位）
├── pages/                              # 页面
│   ├── login/         登录（T5 ✅）
│   ├── index/         首页（待 T7）
│   ├── camera/        拍照（待 T6）
│   ├── pair/          配对（待 T8）
│   ├── partner/       搭子（待 T8）
│   ├── history/       历史（待 T9）
│   ├── week-summary/  周总结（待 T10）
│   └── profile/       我的（待 T11）
└── cloudfunctions/                     # 云函数（T4 部分 ✅）
    ├── login/          ✅ 微信登录 + 注册
    ├── createRecord/   ✅ 创建打卡（含 3 必填校验）
    ├── getRecords/     ✅ 历史列表（含 5 大类别统计）
    └── pairCreate/     ✅ 发起配对
```

## 🚀 快速开始

### 1. 准备工作

- 微信开发者工具：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
- 注册小程序账号（**个人主体**，类目选「工具-健康管理」）
- 获取 AppID（小程序后台 → 开发管理）
- 开通**微信云开发**（小程序后台 → 云开发 → 创建新环境，免费额度够 MVP）

### 2. 修改配置

打开 `app.js` 第 31 行：
```js
wx.cloud.init({
  env: 'ganfan-prod-xxx',   // ← 改成你的云开发环境 ID
  traceUser: true
});
```

打开 `project.config.json` 第 5 行：
```json
"appid": "请填入你的小程序AppID"  // ← 改成你的 AppID
```

### 3. 部署云函数

在微信开发者工具中：
1. 右键 `cloudfunctions/login` → 上传并部署：云端安装依赖
2. 同样部署 `createRecord` / `getRecords` / `pairCreate`
3. 数据库会自动创建 `users` / `meals` / `pairCodes` 集合（首次写入时）

### 4. 数据库集合

| 集合 | 字段 | 索引建议 |
|------|------|----------|
| `users` | `_openid`, `nickName`, `avatarUrl`, `partnerOpenid`, `pairedAt`, `likedPartnerDates[]`, `createdAt` | `_openid` 唯一 |
| `meals` | `_openid`, `date`, `time`, `timestamp`, `imageUrl`, `mealType`, `mainCategory`, `foodCats[]`, `note`, `status`, `createdAt` | `_openid+date` 复合 |
| `pairCodes` | `code`, `ownerOpenid`, `status`, `expireAt`, `createdAt` | `code` 唯一 |

### 5. 域名白名单

`https://apis.map.qq.com`（如使用地图）

### 6. 真机预览

- 微信开发者工具 → 预览 → 扫码

## 📋 上线 Checklist

- [ ] 小程序后台配置「服务类目」= 工具 / 健康管理
- [ ] 配置「用户隐私协议」（微信后台 → 设置 → 服务内容声明）
- [ ] `request 合法域名` 留空（个人主体 + 云开发 = 不需要外网 API）
- [ ] 上传体验版 → 提交审核
- [ ] 准备 1-2 个测试 openid 给审核员

## 📝 License

个人非盈利项目，仅供朋友间使用。
