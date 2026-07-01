// 性能优化方案 v1.0
// 当前项目 192KB（主包），2MB 内足够，无需立即分包
// 但提供分包配置作为未来扩展预案

module.exports = {
  // ===== 当前状态 =====
  current: {
    mainPackage: '~192KB',
    subPackages: 'none',
    limit: '2MB',
    usage: '9.6%',
    needSplit: false
  },

  // ===== 分包触发条件 =====
  triggerConditions: {
    mainPackageOver: '1.5MB',  // 主包超过 1.5MB 应分包
    totalCodeOver: '4MB',      // 总代码超 4MB 应考虑代码精简
  },

  // ===== 未来分包建议 =====
  futurePlan: {
    'subpackage-detail': {
      // 记录详情 + 编辑页（如未来添加）
      pages: ['pages/record-detail/record-detail', 'pages/edit-meal/edit-meal'],
      reason: '这些页面是低频访问，独立分包'
    },
    'subpackage-about': {
      // 关于页 + 协议页（如未来添加）
      pages: ['pages/about/about'],
      reason: '冷启动不需要'
    }
  }
};
