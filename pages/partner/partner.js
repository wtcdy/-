// pages/partner/partner.js
const app = getApp();
const request = require('../../utils/request.js');
const auth = require('../../utils/auth.js');
const { FOOD_CATEGORY_MAP, MEAL_TYPE_MAP } = require('../../utils/meal.js');
const { isWeekend, getCurrentWeek, today: todayStr, formatDate } = require('../../utils/date.js');

Page({
  data: {
    partner: null,
    pairedDays: 0,
    weekDays: [],
    weekRangeText: '',
    todayRecords: [],
    foodCatMap: FOOD_CATEGORY_MAP,
    mealLabelMap: {
      breakfast: '🌅 早餐',
      lunch: '☀️ 午餐',
      dinner: '🌙 晚餐',
      snack: '🍪 加餐'
    },
    mealEmojiMap: {
      breakfast: '🌅',
      lunch: '☀️',
      dinner: '🌙',
      snack: '🍪'
    },
    likedToday: false
  },

  onShow() {
    if (!app.globalData.openid) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    this.loadPartner();
  },

  async loadPartner() {
    app.loading();
    const res = await request.getPartner();
    app.hideLoading();
    if (!res.success || !res.data?.partner) {
      this.setData({ partner: null, todayRecords: [], weekDays: [], weekRangeText: '' });
      return;
    }
    const data = res.data;
    const partner = data.partner;
    const todayRecords = data.todayRecords || [];
    const weekDays = data.weekDays || [];
    const weekRangeText = data.weekRangeText || '';
    const pairedDays = data.pairedDays || 0;
    const likedToday = (data.likedDates || []).includes(todayStr());
    this.setData({ partner, pairedDays, todayRecords, weekDays, weekRangeText, likedToday });
  },

  onGoPair() {
    wx.navigateTo({ url: '/pages/pair/pair' });
  },

  async onSendLike(e) {
    if (this.data.likedToday) {
      return app.toast('今天已经点过赞啦～');
    }
    const recordId = e.currentTarget.dataset.id;
    const res = await request.sendLike({ recordId });
    if (res.success) {
      this.setData({ likedToday: true });
      app.toast('加油～', 'success');
    } else {
      app.toast(res.message || '点赞失败');
    }
  },

  onUnbind() {
    wx.showModal({
      title: '解除配对？',
      content: '解除后将看不到搭子的打卡，需要重新配对',
      confirmText: '解除',
      confirmColor: '#FF6B8B',
      success: async (r) => {
        if (!r.confirm) return;
        app.loading();
        const res = await request.pairUnbind();
        app.hideLoading();
        if (res.success) {
          auth.clearLogin();
          wx.reLaunch({ url: '/pages/login/login' });
        } else {
          app.toast(res.message || '解除失败');
        }
      }
    });
  }
});
