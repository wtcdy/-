// pages/index/index.js
const app = getApp();
const request = require('../../utils/request.js');
const { MEAL_TYPES, MEAL_TYPE_MAP, calcStatus, STATUS_META } = require('../../utils/meal.js');
const { isWeekend, getCurrentWeek, formatTime, weekdayCn, today: todayStr } = require('../../utils/date.js');

Page({
  data: {
    userInfo: {},
    greetingText: '',
    dateText: '',
    isWeekend: false,
    todayRecords: [],
    mealSlots: [],          // 4 个餐次槽
    weekStats: {            // 本周统计
      rangeText: '',
      onTimeRate: 0,
      mealRate: 0,
      daysPassed: 0
    }
  },

  onLoad() {
    if (!app.globalData.openid) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    this.initGreeting();
    this.setData({
      userInfo: app.globalData.userInfo || {}
    });
  },

  onShow() {
    this.loadAll();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadAll().finally(() => wx.stopPullDownRefresh());
  },

  initGreeting() {
    const now = new Date();
    const h = now.getHours();
    let text = '你好呀';
    if (h < 6) text = '夜深了';
    else if (h < 11) text = '早上好';
    else if (h < 14) text = '中午好';
    else if (h < 18) text = '下午好';
    else if (h < 22) text = '晚上好';
    else text = '夜深了';

    this.setData({
      greetingText: text,
      dateText: `${now.getMonth() + 1} 月 ${now.getDate()} 日 · ${weekdayCn(now)}`,
      isWeekend: isWeekend(now)
    });
  },

  async loadAll() {
    // 并发拉取今日 + 本周
    await Promise.all([
      this.loadToday(),
      this.loadWeekStats()
    ]);
  },

  async loadToday() {
    const res = await request.getTodayRecords();
    if (!res.success) {
      this.setData({ todayRecords: [], mealSlots: this.buildSlots([]) });
      return;
    }
    const records = res.data?.list || [];
    this.setData({
      todayRecords: records,
      mealSlots: this.buildSlots(records)
    });
  },

  // 组装 4 个餐次槽
  buildSlots(records) {
    const recordMap = {};
    records.forEach(r => { recordMap[r.mealType] = r; });

    return MEAL_TYPES.map(t => {
      const record = recordMap[t.value];
      let status = 'pending';
      let statusText = '待开干';

      if (record) {
        status = record.status;
        statusText = STATUS_META[status]?.label || '已打卡';
      } else if (t.value !== 'snack') {
        // 计算理论状态（基于当前时间）
        const theoretical = calcStatus(t.value, Date.now());
        if (theoretical === 'missed') {
          status = 'missed';
          statusText = '已缺卡';
        }
      }
      return { ...t, record, status, statusText };
    });
  },

  async loadWeekStats() {
    const res = await request.getCurrentWeekStats();
    if (res.success && res.data) {
      this.setData({ weekStats: res.data });
    }
  },

  /* ============== 交互 ============== */
  onTapMealSlot(e) {
    const { slot } = e.currentTarget.dataset;
    if (slot.record) {
      // 跳详情
      wx.navigateTo({ url: `/pages/record-detail/record-detail?id=${slot.record._id}` });
    } else {
      // 跳拍照（预填 mealType）
      wx.navigateTo({ url: `/pages/camera/camera?mealType=${slot.value}` });
    }
  },

  onTapFab() {
    wx.navigateTo({ url: '/pages/camera/camera' });
  },

  onTapAvatar() {
    wx.switchTab({ url: '/pages/profile/profile' });
  },

  onTapWeekSummary() {
    wx.navigateTo({ url: '/pages/week-summary/week-summary' });
  }
});
