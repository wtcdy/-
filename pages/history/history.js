// pages/history/history.js
const app = getApp();
const request = require('../../utils/request.js');
const { FOOD_CATEGORY_MAP, MEAL_TYPE_MAP } = require('../../utils/meal.js');
const { getRelativeDay, formatDate } = require('../../utils/date.js');

const PAGE_SIZE = 30;

Page({
  data: {
    loading: false,
    list: [],
    groupedList: [],
    stats: {},
    hasMore: true,
    skip: 0,
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
    }
  },

  onLoad() {
    this.load(true);
  },

  onShow() {
    // 每次显示刷新一次（用户可能刚打卡）
    this.load(true);
  },

  onPullDownRefresh() {
    this.load(true).finally(() => wx.stopPullDownRefresh());
  },

  async load(reset = false) {
    if (this.data.loading) return;
    this.setData({ loading: true });
    const skip = reset ? 0 : this.data.skip;
    const res = await request.getRecords({ limit: PAGE_SIZE, skip });
    this.setData({ loading: false });
    if (!res.success) {
      app.toast(res.message || '加载失败');
      return;
    }
    const newList = res.data.list || [];
    const list = reset ? newList : [...this.data.list, ...newList];
    const groupedList = this.groupByDate(list);
    this.setData({
      list,
      groupedList,
      stats: res.data.stats || {},
      hasMore: res.data.hasMore,
      skip: skip + newList.length
    });
  },

  onLoadMore() {
    this.load(false);
  },

  // 按日期分组
  groupByDate(list) {
    const map = {};
    list.forEach(r => {
      if (!map[r.date]) map[r.date] = [];
      map[r.date].push(r);
    });
    return Object.keys(map)
      .sort((a, b) => b.localeCompare(a))
      .map(date => ({
        date,
        dateLabel: this.formatDateLabel(date),
        list: map[date].sort((a, b) => b.timestamp - a.timestamp)
      }));
  },

  formatDateLabel(dateStr) {
    const today = formatDate();
    const yest = new Date(); yest.setDate(yest.getDate() - 1);
    const yestStr = formatDate(yest.getTime());
    if (dateStr === today) return '今天';
    if (dateStr === yestStr) return '昨天';
    const d = new Date(dateStr);
    const weekday = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    return `${d.getMonth() + 1} 月 ${d.getDate()} 日 · 周${weekday}`;
  },

  onTapRecord(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/record-detail/record-detail?id=${id}` });
  },

  onTapFab() {
    wx.navigateTo({ url: '/pages/camera/camera' });
  },

  onBack() {
    wx.navigateBack({ delta: 1, fail: () => wx.switchTab({ url: '/pages/index/index' }) });
  }
});
