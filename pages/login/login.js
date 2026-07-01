// pages/login/login.js
const app = getApp();
const auth = require('../../utils/auth.js');

Page({
  data: {
    loading: false,
    accepted: false,
    avatarUrl: '',
    nickName: ''
  },

  onLoad() {
    // 已登录则跳过
    if (auth.isLogin()) {
      wx.reLaunch({ url: '/pages/index/index' });
    }
  },

  onShow() {
    // 重置勾选状态（防止上次未完成）
    // 不重置，避免用户每次都要勾
  },

  // 用户勾选协议
  onAccept(e) {
    // checkbox-group change 事件，detail.value 是数组
    const checked = Array.isArray(e.detail.value) && e.detail.value.length > 0;
    this.setData({ accepted: checked });
  },

  // 头像选择（基础库 2.21.2+）
  onChooseAvatar(e) {
    this.setData({ avatarUrl: e.detail.avatarUrl });
  },

  // 昵称输入
  onNicknameInput(e) {
    this.setData({ nickName: e.detail.value });
  },

  // 跳转协议
  onOpenAgreement(e) {
    // about 页面待补：先 toast 提示，协议内容从云存储 agreements/ 读取
    const type = e.currentTarget.dataset.type;
    const label = type === 'user' ? '用户协议' : '隐私政策';
    app.toast(`${label}内容请见云存储 agreements/ 目录`);

    // 调试：控制台输出当前生效版本
    console.log(`[agreement] 查看 ${label}, 详见 config/app.js → agreement.${type === 'user' ? 'userAgreement' : 'privacyPolicy'}`);
  },

  // 一键登录
  async handleLogin() {
    if (this.data.loading) return;
    if (!this.data.accepted) {
      app.toast('请先勾选并同意协议');
      return;
    }
    this.setData({ loading: true });

    try {
      // Mock 模式：跳过 wx.login
      if (app.globalData.mockMode) {
        const res = await app.call('login', {
          code: 'mock_code_' + Date.now(),
          nickName: (this.data.nickName || '干饭人').slice(0, 12),
          avatarUrl: this.data.avatarUrl || ''
        });
        if (res.success) {
          auth.setLogin(res.data.user.openid, res.data.user);
          app.globalData.openid = res.data.user.openid;
          app.globalData.userInfo = res.data.user;
          app.globalData.partnerOpenid = res.data.user.partnerOpenid || '';
          app.toast('欢迎回来～', 'success');
          setTimeout(() => wx.reLaunch({ url: '/pages/index/index' }), 500);
        } else {
          app.toast(res.message || '登录失败');
        }
        return;
      }

      // 1. wx.login 拿 code
      const loginRes = await wx.login();
      const { code } = loginRes;
      if (!code) {
        app.toast('登录失败，请重试');
        return;
      }

      // 2. 调云函数 login
      const res = await app.call('login', {
        code,
        nickName: (this.data.nickName || '干饭人').slice(0, 12),
        avatarUrl: this.data.avatarUrl || ''
      });

      if (!res.success) {
        app.toast(res.message || '登录失败');
        return;
      }

      // 3. 缓存登录态
      auth.setLogin(res.data.openid, res.data.user);
      app.globalData.openid = res.data.openid;
      app.globalData.userInfo = res.data.user;
      app.globalData.partnerOpenid = res.data.user.partnerOpenid || '';

      app.toast('欢迎回来～', 'success');

      setTimeout(() => {
        wx.reLaunch({ url: '/pages/index/index' });
      }, 600);
    } catch (err) {
      console.error('[login]', err);
      app.toast('网络小情绪～');
    } finally {
      this.setData({ loading: false });
    }
  }
});
