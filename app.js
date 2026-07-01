// app.js
// 引入 Mock 模块（本地环境/测试号 启用）
const mock = require('./utils/mock.js');
const appConfig = require('./config/app.js');

App({
  globalData: {
    openid: '',
    userInfo: null,
    partnerOpenid: '',
    systemInfo: null,
    paired: false,

    // 模式与配置（来自 config/app.js）
    mode: appConfig.mode,           // 'mock' | 'cloud'
    cloudEnv: appConfig.cloudEnv,   // 云开发环境 ID
    appName: appConfig.appName,
    version: appConfig.version,
    config: appConfig,              // 完整配置

    // 兼容旧字段
    mockMode: appConfig.mode === 'mock',

    // 梦幻治愈主题色（马卡龙）
    theme: {
      pink: '#FFD3DA',
      cream: '#FFF4D6',
      mint: '#C8E6D9',
      sky: '#D6E5F5',
      lavender: '#E5D9F2',
      peach: '#FFD9B3',
      text: '#5A5A6E',
      subtext: '#9999A8',
      bg: '#FFFCF7',
      card: '#FFFFFF'
    },

    // 5 大食物类别配色
    foodCat: {
      staple:  { gradient: 'linear-gradient(135deg, #FFF4D6, #FFE7A0)', border: '#F0C95C', fg: '#8A6B1E' },
      veggie:  { gradient: 'linear-gradient(135deg, #D6EBDC, #C6EBC9)', border: '#7BC094', fg: '#3F7A56' },
      protein: { gradient: 'linear-gradient(135deg, #FFE0CC, #FFC7A0)', border: '#F0A36B', fg: '#8A4F25' },
      soup:    { gradient: 'linear-gradient(135deg, #DCE8F4, #C7E0F0)', border: '#7AAED1', fg: '#2E5A82' },
      dessert: { gradient: 'linear-gradient(135deg, #E8DEF5, #D7C7F0)', border: '#B69FE0', fg: '#5B4080' }
    }
  },

  onLaunch() {
    // 1. 模式判断
    if (this.globalData.mode === 'cloud' && wx.cloud) {
      wx.cloud.init({
        env: this.globalData.cloudEnv,
        traceUser: true
      });
      console.log(`[ganfan] 云开发模式已启用 env=${this.globalData.cloudEnv}`);
    } else {
      console.log('[ganfan] Mock 模式已启用，云函数走本地模拟');
    }

    // 2. 恢复本地登录态
    const openid = wx.getStorageSync('openid');
    const userInfo = wx.getStorageSync('userInfo');
    if (openid) {
      this.globalData.openid = openid;
      this.globalData.userInfo = userInfo || null;
    }

    // 3. 系统信息
    try {
      this.globalData.systemInfo = wx.getSystemInfoSync();
    } catch (e) {
      console.warn('getSystemInfoSync failed', e);
    }
  },

  /**
   * 运行时切换模式（控制台可调用 getApp().setMode('cloud')）
   * @param {'mock'|'cloud'} mode
   */
  setMode(mode) {
    if (mode !== 'mock' && mode !== 'cloud') {
      console.error('[ganfan] 无效模式:', mode);
      return false;
    }
    this.globalData.mode = mode;
    this.globalData.mockMode = mode === 'mock';
    // 重启云开发初始化
    if (mode === 'cloud' && wx.cloud) {
      wx.cloud.init({ env: this.globalData.cloudEnv, traceUser: true });
    }
    console.log(`[ganfan] 模式已切换为: ${mode}`);
    return true;
  },

  /**
   * 统一云函数调用封装
   * Mock 模式：走本地 mock 模拟数据
   * 云开发模式：走 wx.cloud.callFunction
   * @returns {Promise<{success: boolean, code?: string, message?: string, data?: any}>}
   */
  async call(name, data = {}) {
    if (this.globalData.mode === 'mock') {
      return mock.mockFn(name, data);
    }
    try {
      const res = await wx.cloud.callFunction({ name, data });
      const result = res.result || {};
      if (result.code === 'AUTH_EXPIRED' || result.code === 'NOT_LOGIN') {
        this.logout();
        wx.reLaunch({ url: '/pages/login/login' });
        return { success: false, code: result.code, message: result.message || '请重新登录' };
      }
      return result;
    } catch (err) {
      console.error(`[call ${name}]`, err);
      return { success: false, code: 'NETWORK_ERROR', message: '网络小情绪～请稍后再试' };
    }
  },

  /**
   * 退出登录（清空全局 + 缓存）
   */
  logout() {
    this.globalData.openid = '';
    this.globalData.userInfo = null;
    this.globalData.partnerOpenid = '';
    this.globalData.paired = false;
    wx.removeStorageSync('openid');
    wx.removeStorageSync('userInfo');
  },

  /**
   * 全局 toast
   */
  toast(title, icon = 'none', duration = 1800) {
    wx.showToast({ title, icon, duration });
  },

  /**
   * 全局 loading
   */
  loading(title = '加载中...') {
    wx.showLoading({ title, mask: true });
  },

  hideLoading() {
    wx.hideLoading();
  }
});
