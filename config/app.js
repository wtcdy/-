// config/app.js
// 应用配置：模式开关、云开发环境 ID、版本号
// 切换模式：修改本文件后保存即可

module.exports = {
  // ===== 模式开关 =====
  // - 'mock': 本地模拟模式（无需云开发，用于测试号或本地体验）
  // - 'cloud': 真云开发模式（部署云函数后使用）
  mode: 'mock',

  // ===== 微信云开发配置 =====
  // 在 mp.weixin.qq.com 申请云开发后，从控制台"概览"页获取
  // 格式：'your-env-id-xxxx'
  cloudEnv: 'ganfan-prod-xxxxxx',

  // ===== 应用元信息 =====
  appName: '最佳干饭人',
  version: '1.0.0',
  buildTime: '2026-07-01',

  // ===== 内容安全 =====
  // 上线前必须确保在云开发控制台开通了
  // 「设置 → 拓展功能 → 内容安全」
  enableImgSecCheck: true,
  enableTextSecCheck: true,

  // ===== 协议配置 =====
  // 从 docs/agreements/agreements.json 同步
  agreement: {
    userAgreement: {
      version: '1.0',
      effectiveDate: '2026-07-01'
    },
    privacyPolicy: {
      version: '1.0',
      effectiveDate: '2026-07-01'
    }
  },

  // ===== 业务开关 =====
  business: {
    // 1:1 配对最大数量（1 表示只能配对 1 个人）
    maxPartners: 1,
    // 同一天对搭子的点赞次数
    dailyLikeLimit: 1,
    // 打卡图片压缩质量 (0-100)
    imageQuality: 80,
    // 工作日统计（周一到周五）
    workdays: [1, 2, 3, 4, 5],
    // 配对码有效期（分钟）
    pairCodeExpireMinutes: 10
  }
};
