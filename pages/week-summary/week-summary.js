// pages/week-summary/week-summary.js
const app = getApp();
const request = require('../../utils/request.js');

Page({
  data: {
    summary: {}
  },

  onLoad() {
    this.load();
  },

  onShow() {
    this.load();
  },

  async load() {
    app.loading();
    const res = await request.getWeeklySummary();
    app.hideLoading();
    if (!res.success) {
      app.toast(res.message || '加载失败');
      return;
    }
    this.setData({ summary: res.data || {} });
  },

  onBack() {
    wx.navigateBack({ delta: 1, fail: () => wx.switchTab({ url: '/pages/index/index' }) });
  }
});
