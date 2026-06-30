// pages/camera/camera.js
const app = getApp();
const request = require('../../utils/request.js');
const { MEAL_TYPES, MAIN_CATEGORIES, FOOD_CATEGORIES, calcStatus, validateCreateRecord } = require('../../utils/meal.js');

Page({
  data: {
    mealTypes: MEAL_TYPES,
    mainCategories: MAIN_CATEGORIES,
    foodCategories: FOOD_CATEGORIES,
    form: {
      mealType: '',        // breakfast/lunch/dinner/snack
      mainCategory: '',     // meal/fast
      foodCats: {},         // { staple: true, ... }
      note: ''
    },
    imageUrl: '',           // 云存储 fileID
    localImagePath: '',     // 本地临时路径（用于预览）
    photoEmoji: '🍱',
    thresholdHint: null,    // 延时提示
    submitting: false
  },

  onLoad() {
    // 不允许未登录进入
    if (!app.globalData.openid) {
      wx.reLaunch({ url: '/pages/login/login' });
    }
  },

  /* ============== 选择照片 ============== */
  onChooseImage() {
    wx.showActionSheet({
      itemList: ['📷 拍一张', '🖼 从相册选'],
      success: (res) => {
        if (res.tapIndex === 0) this.onCamera();
        else this.onAlbum();
      }
    });
  },

  onCamera() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      camera: 'back',
      success: (res) => this.handleImage(res.tempFiles[0]),
      fail: () => {}
    });
  },

  onAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => this.handleImage(res.tempFiles[0]),
      fail: () => {}
    });
  },

  async handleImage(file) {
    if (!file || !file.tempFilePath) return;
    this.setData({
      localImagePath: file.tempFilePath,
      photoEmoji: '⏳'
    });
    // 直接显示本地预览（不阻塞 UI）
    this.setData({ imageUrl: file.tempFilePath });
  },

  /* ============== 餐次选择 ============== */
  onSelectMealType(e) {
    const value = e.currentTarget.dataset.value;
    const form = { ...this.data.form, mealType: value };
    this.setData({ form, thresholdHint: this.computeThreshold(value) });
  },

  /* ============== 正餐/速食 ============== */
  onSelectMainCategory(e) {
    const value = e.currentTarget.dataset.value;
    const form = { ...this.data.form, mainCategory: value };
    this.setData({ form });
  },

  /* ============== 5 大食物类别（多选） ============== */
  onToggleFoodCat(e) {
    const value = e.currentTarget.dataset.value;
    const foodCats = { ...this.data.form.foodCats };
    foodCats[value] = !foodCats[value];
    this.setData({ 'form.foodCats': foodCats });
  },

  /* ============== 备注 ============== */
  onNoteInput(e) {
    this.setData({ 'form.note': e.detail.value });
  },

  /* ============== 阈值计算 ============== */
  computeThreshold(mealType) {
    if (!mealType) return null;
    if (mealType === 'snack') return null;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const rules = {
      breakfast: { deadline: 10 * 60, lateDeadline: 11 * 60, label: '早餐' },
      lunch:     { deadline: 14 * 60, lateDeadline: 15 * 60, label: '午餐' },
      dinner:    { deadline: 21 * 60, lateDeadline: 22 * 60, label: '晚餐' }
    };
    const r = rules[mealType];
    if (!r || nowMin <= r.deadline) return null;
    if (nowMin > r.lateDeadline) {
      // 超过延时截止，允许保存但提示"已缺卡"
      return {
        now: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        mealLabel: r.label,
        deadline: `${Math.floor(r.lateDeadline / 60)}:${String(r.lateDeadline % 60).padStart(2, '0')}`,
        lateMin: nowMin - r.deadline
      };
    }
    return {
      now: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      mealLabel: r.label,
      deadline: `${Math.floor(r.deadline / 60)}:${String(r.deadline % 60).padStart(2, '0')}`,
      lateMin: nowMin - r.deadline
    };
  },

  /* ============== 提交按钮可用性 ============== */
  get canSubmit() {
    const { form } = this.data;
    const foodCatList = Object.keys(form.foodCats).filter(k => form.foodCats[k]);
    return !!(form.mealType && form.mainCategory && foodCatList.length > 0 && !this.data.submitting);
  },

  /* ============== 提交 ============== */
  async onSubmit() {
    if (this.data.submitting) return;
    if (!this.canSubmit) {
      const foodCatList = Object.keys(this.data.form.foodCats).filter(k => this.data.form.foodCats[k]);
      if (!this.data.form.mealType)         return app.toast('请选择餐次');
      if (!this.data.form.mainCategory)     return app.toast('请选择正餐或速食');
      if (foodCatList.length === 0)         return app.toast('请至少选择 1 个食物类别');
      return;
    }

    this.setData({ submitting: true });
    app.loading('正在保存...');

    try {
      // 1. 上传图片到云存储（如果有）
      let imageUrl = '';
      if (this.data.localImagePath) {
        const { compressImage, uploadToCloud } = require('../../utils/imgSecCheck.js');
        const compressed = await compressImage(this.data.localImagePath);
        imageUrl = await uploadToCloud(compressed);
      }

      // 2. 组装入参
      const foodCatList = Object.keys(this.data.form.foodCats).filter(k => this.data.form.foodCats[k]);
      const params = {
        imageUrl,
        mealType: this.data.form.mealType,
        mainCategory: this.data.form.mainCategory,
        foodCats: foodCatList,
        note: this.data.form.note || ''
      };

      // 3. 客户端预校验
      const v = validateCreateRecord(params);
      if (!v.ok) {
        app.toast(v.message);
        return;
      }

      // 4. 调云函数
      const res = await request.createRecord(params);
      app.hideLoading();
      if (!res.success) {
        app.toast(res.message || '保存失败');
        return;
      }

      app.toast('晒一晒成功～', 'success');
      setTimeout(() => {
        wx.navigateBack({ delta: 1, fail: () => {
          wx.reLaunch({ url: '/pages/index/index' });
        }});
      }, 600);
    } catch (err) {
      console.error('[camera submit]', err);
      app.hideLoading();
      app.toast('保存失败，请重试');
    } finally {
      this.setData({ submitting: false });
    }
  },

  onBack() {
    wx.navigateBack({ delta: 1, fail: () => {
      wx.reLaunch({ url: '/pages/index/index' });
    }});
  }
});
