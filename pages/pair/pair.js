// pages/pair/pair.js
const app = getApp();
const request = require('../../utils/request.js');
const auth = require('../../utils/auth.js');

Page({
  data: {
    tab: 'create',        // 'create' | 'input'
    pairCode: '',         // 6 位配对码
    pairCodeDigits: [],
    remainSeconds: 600,
    remainMinutes: 10,
    inputCode: ['', '', '', '', '', ''],
    timer: null
  },

  onLoad(options) {
    if (options.tab) this.setData({ tab: options.tab });
  },

  onUnload() {
    if (this.data.timer) clearInterval(this.data.timer);
  },

  onBack() {
    wx.navigateBack({ delta: 1, fail: () => wx.switchTab({ url: '/pages/index/index' }) });
  },

  onSwitchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab });
  },

  /* ============== 发起配对 ============== */
  async onGenerateCode() {
    app.loading('生成配对码...');
    const res = await request.pairCreate();
    app.hideLoading();
    if (!res.success) {
      app.toast(res.message || '生成失败');
      return;
    }
    const code = res.data.code;
    this.setData({
      pairCode: code,
      pairCodeDigits: code.split(''),
      remainSeconds: res.data.expiresIn || 600
    });
    this.startTimer();
  },

  startTimer() {
    if (this.data.timer) clearInterval(this.data.timer);
    const timer = setInterval(() => {
      const remain = this.data.remainSeconds - 1;
      if (remain <= 0) {
        clearInterval(timer);
        this.setData({
          pairCode: '',
          pairCodeDigits: [],
          remainSeconds: 0,
          remainMinutes: 0,
          timer: null
        });
        app.toast('配对码已过期');
        return;
      }
      this.setData({
        remainSeconds: remain,
        remainMinutes: Math.floor(remain / 60)
      });
    }, 1000);
    this.setData({ timer });
  },

  /* ============== 输入配对码 ============== */
  onCodeInput(e) {
    const idx = e.currentTarget.dataset.index;
    const val = e.detail.value.replace(/\D/g, '').slice(0, 1);
    const inputCode = [...this.data.inputCode];
    inputCode[idx] = val;
    this.setData({ inputCode });
    if (val && idx < 5) {
      // 自动跳到下一格
      wx.nextTick(() => {
        const query = wx.createSelectorQuery();
        query.selectAll('.code-input').fields({ node: true, size: true });
        query.exec((res) => {
          if (res[idx + 1] && res[idx + 1].node) {
            res[idx + 1].node.focus();
          }
        });
      });
    }
  },

  onCodeFocus(e) {
    // focus 时清空当前格（便于重新输入）
    // 不实现：避免误操作
  },

  async onJoinPair() {
    const code = this.data.inputCode.join('');
    if (code.length !== 6) {
      app.toast('请输入完整 6 位配对码');
      return;
    }
    app.loading('配对中...');
    const res = await request.pairJoin(code);
    app.hideLoading();
    if (!res.success) {
      app.toast(res.message || '配对失败');
      return;
    }
    app.toast('配对成功～', 'success');
    // 更新本地配对状态
    if (res.data?.partner) {
      auth.setPartnerOpenid(res.data.partner.openid);
      app.globalData.partnerOpenid = res.data.partner.openid;
      app.globalData.paired = true;
    }
    setTimeout(() => {
      wx.switchTab({ url: '/pages/partner/partner' });
    }, 600);
  }
});
