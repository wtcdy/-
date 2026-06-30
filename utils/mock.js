// utils/mock.js
// 本地 Mock 数据层 — 用于本地环境（测试号 / 暂无云开发）时模拟云函数返回
// 启用方法：在 app.js 的 globalData 中设置 mockMode: true，或在调试器 console 中执行
//   getApp().globalData.mockMode = true
// 关闭云函数调用走 app.call，启用则走本文件中的 mockFn

const MOCK_FLAG = '__GANFAN_MOCK_MODE__';

const mockStorage = {
  user: null,
  partner: null,
  records: [],
  pairCode: null,
  pairCodeExpire: 0,
  likedDates: []
};

// 生成 6 位配对码
const genCode = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

// 生成 mock openid
const genOpenid = () => 'mock_' + Math.random().toString(36).slice(2, 12);

// 今日字符串 YYYY-MM-DD
const todayStr = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// 阈值计算（与云函数一致）
const calcStatus = (mealType, ts) => {
  const t = new Date(ts);
  const h = t.getHours();
  const m = t.getMinutes();
  const cur = h * 60 + m;
  const rules = {
    breakfast: { deadline: 600,  grace: 60, label: '早餐' },
    lunch:     { deadline: 840,  grace: 60, label: '午餐' },
    dinner:    { deadline: 1260, grace: 60, label: '晚餐' },
    extra:     { deadline: 9999, grace: 0,  label: '加餐' }
  };
  const r = rules[mealType] || rules.extra;
  if (cur <= r.deadline) return 'on_time';
  if (cur <= r.deadline + r.grace) return 'late';
  return 'missed';
};

/**
 * 模拟云函数路由
 * @param {string} name 云函数名
 * @param {object} data 入参
 */
const mockFn = async (name, data = {}) => {
  await new Promise((r) => setTimeout(r, 200)); // 模拟网络延迟

  switch (name) {
    case 'login': {
      const openid = mockStorage.user?.openid || genOpenid();
      mockStorage.user = {
        openid,
        nickName: data.nickName || '小干饭人',
        avatarUrl: data.avatarUrl || 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTKvNxk/132',
        partnerOpenid: mockStorage.user?.partnerOpenid || '',
        createdAt: Date.now()
      };
      return { success: true, data: { user: mockStorage.user, isNew: true } };
    }

    case 'createRecord': {
      if (!mockStorage.user) return { success: false, code: 'NOT_LOGIN' };
      const status = calcStatus(data.mealType, Date.now());
      const rec = {
        _id: 'mock_' + Date.now(),
        openid: mockStorage.user.openid,
        mealType: data.mealType,
        mainCategory: data.mainCategory,
        foodCats: data.foodCats || [],
        remark: data.remark || '',
        imageFileID: data.imageFileID || '',
        status,
        date: todayStr(),
        createdAt: Date.now()
      };
      mockStorage.records.unshift(rec);
      return { success: true, data: { record: rec } };
    }

    case 'getTodayRecords': {
      const today = todayStr();
      const mine = mockStorage.records.filter((r) => r.openid === mockStorage.user?.openid && r.date === today);
      return { success: true, data: { records: mine } };
    }

    case 'getRecords': {
      const { targetOpenid, date, startDate, endDate, onlyWeekdays, page = 1, pageSize = 20 } = data;
      const owner = targetOpenid || mockStorage.user?.openid;
      let list = mockStorage.records.filter((r) => r.openid === owner);
      if (date) list = list.filter((r) => r.date === date);
      if (startDate) list = list.filter((r) => r.date >= startDate);
      if (endDate) list = list.filter((r) => r.date <= endDate);
      if (onlyWeekdays) {
        list = list.filter((r) => {
          const d = new Date(r.date);
          const day = d.getDay();
          return day >= 1 && day <= 5;
        });
      }
      // 统计 foodCatCount
      const foodCatCount = { staple: 0, veggie: 0, protein: 0, soup: 0, dessert: 0 };
      list.forEach((r) => (r.foodCats || []).forEach((c) => { if (foodCatCount[c] !== undefined) foodCatCount[c]++; }));
      const total = list.length;
      const start = (page - 1) * pageSize;
      return { success: true, data: { list: list.slice(start, start + pageSize), total, foodCatCount } };
    }

    case 'getRecordDetail': {
      const rec = mockStorage.records.find((r) => r._id === data.recordId);
      if (!rec) return { success: false, code: 'NOT_FOUND', message: '记录不存在' };
      return { success: true, data: { record: rec } };
    }

    case 'pairCreate': {
      if (mockStorage.user?.partnerOpenid) {
        return { success: false, code: 'ALREADY_PAIRED', message: '已配对，请先解除' };
      }
      const code = genCode();
      mockStorage.pairCode = code;
      mockStorage.pairCodeExpire = Date.now() + 10 * 60 * 1000;
      return { success: true, data: { code, expireAt: mockStorage.pairCodeExpire } };
    }

    case 'pairJoin': {
      if (!mockStorage.pairCode) return { success: false, code: 'CODE_INVALID', message: '配对码无效' };
      if (Date.now() > mockStorage.pairCodeExpire) return { success: false, code: 'CODE_EXPIRED', message: '配对码已过期' };
      if (data.code !== mockStorage.pairCode) return { success: false, code: 'CODE_MISMATCH', message: '配对码错误' };
      // 模拟搭子信息
      mockStorage.partner = {
        openid: 'mock_partner_' + genOpenid().slice(5),
        nickName: '搭子小可爱',
        avatarUrl: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTKvNxk/132'
      };
      mockStorage.user.partnerOpenid = mockStorage.partner.openid;
      mockStorage.pairCode = null;
      return { success: true, data: { partner: mockStorage.partner } };
    }

    case 'pairUnbind': {
      mockStorage.partner = null;
      if (mockStorage.user) mockStorage.user.partnerOpenid = '';
      return { success: true };
    }

    case 'getPartner': {
      if (!mockStorage.partner) return { success: true, data: { partner: null } };
      // 5 个工作日状态
      const days = [];
      const today = new Date();
      for (let i = 4; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = todayStr(d);
        const rec = mockStorage.records.find((r) => r.openid === mockStorage.partner.openid && r.date === dateStr);
        days.push({ date: dateStr, weekday: d.getDay(), status: rec?.status || 'empty' });
      }
      const todayRec = mockStorage.records.find((r) => r.openid === mockStorage.partner.openid && r.date === todayStr());
      return {
        success: true,
        data: {
          partner: mockStorage.partner,
          weekdayDays: days,
          todayRecord: todayRec || null
        }
      };
    }

    case 'getCurrentWeekStats': {
      const today = new Date();
      const day = today.getDay();
      const offsetToMon = day === 0 ? -6 : 1 - day;
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + offsetToMon);
      const weekStartStr = todayStr(weekStart);
      const me = mockStorage.records.filter((r) => r.openid === mockStorage.user?.openid && r.date >= weekStartStr);
      const onTime = me.filter((r) => r.status === 'on_time').length;
      const late = me.filter((r) => r.status === 'late').length;
      const total = me.length;
      return {
        success: true,
        data: {
          weekStart: weekStartStr,
          total,
          onTime,
          late,
          mealCount: me.length
        }
      };
    }

    case 'getWeeklySummary': {
      const today = new Date();
      const day = today.getDay();
      const offsetToMon = day === 0 ? -6 : 1 - day;
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + offsetToMon);
      const weekStartStr = todayStr(weekStart);
      const me = mockStorage.records.filter((r) => r.openid === mockStorage.user?.openid && r.date >= weekStartStr);
      const total = me.length;
      const mealCount = me.filter((r) => r.mainCategory === 'meal').length;
      const fastCount = me.filter((r) => r.mainCategory === 'fast').length;
      const onTime = me.filter((r) => r.status === 'on_time').length;
      const onTimeRate = total ? Math.round((onTime / total) * 100) : 0;
      // 5 大类别计数
      const foodCatCount = { staple: 0, veggie: 0, protein: 0, soup: 0, dessert: 0 };
      me.forEach((r) => (r.foodCats || []).forEach((c) => { if (foodCatCount[c] !== undefined) foodCatCount[c]++; }));
      // Top3
      const top3 = Object.entries(foodCatCount)
        .map(([k, v]) => ({ key: k, label: k, count: v }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      // 5 工作日日历
      const days = [];
      for (let i = 0; i < 5; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        const dateStr = todayStr(d);
        const recList = me.filter((r) => r.date === dateStr);
        days.push({ date: dateStr, weekday: d.getDay(), recordCount: recList.length, status: recList[0]?.status || 'empty' });
      }
      return {
        success: true,
        data: { weekStart: weekStartStr, total, mealCount, fastCount, onTimeRate, foodCatCount, top3, days }
      };
    }

    case 'sendLike': {
      if (!mockStorage.partner) return { success: false, code: 'NO_PARTNER' };
      const today = todayStr();
      if (mockStorage.likedDates.includes(today)) {
        return { success: false, code: 'ALREADY_LIKED', message: '今天已点过赞' };
      }
      mockStorage.likedDates.push(today);
      return { success: true };
    }

    default:
      return { success: false, code: 'MOCK_NOT_IMPL', message: `Mock 未实现: ${name}` };
  }
};

module.exports = {
  MOCK_FLAG,
  mockFn,
  mockStorage,
  calcStatus,
  todayStr,
  // 暴露内部状态供调试
  _state: mockStorage
};
