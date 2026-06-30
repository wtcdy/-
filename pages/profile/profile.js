// pages/profile/profile.js
const app = getApp();
const auth = require('../../utils/auth.js');

Page({
  data: {
    userInfo: {}
  },

  onShow() {
    if (!app.globalData.openid) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    this.setData({ userInfo: app.globalData.userInfo || {} });
  },

  onTapWeekSummary() {
    wx.navigateTo({ url: '/pages/week-summary/week-summary' });
  },

  onTapHistory() {
    wx.navigateTo({ url: '/pages/history/history' });
  },

  onTapPartner() {
    if (this.data.userInfo.partnerOpenid) {
      wx.switchTab({ url: '/pages/partner/partner' });
    } else {
      wx.navigateTo({ url: '/pages/pair/pair' });
    }
  },

  onTapAbout() {
    app.toast('最佳干饭人 v1.0\n梦幻治愈 · 个人项目');
  }
});
