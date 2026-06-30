// utils/request.js
// 业务层云函数调用封装（基于 app.call）
// 适用于需要在多个页面复用的云函数

const app = getApp();

/**
 * 通用云函数调用
 * @param {string} name 云函数名
 * @param {object} data 入参
 * @returns {Promise<{success, data?, message?, code?}>}
 */
const callFn = (name, data = {}) => {
  if (!app || !app.call) {
    return Promise.resolve({ success: false, code: 'NO_APP', message: '系统未就绪' });
  }
  return app.call(name, data);
};

/* ===== 业务快捷调用 ===== */

// 登录
const login = (params) => callFn('login', params);

// 打卡相关
const createRecord  = (params) => callFn('createRecord', params);
const getRecords    = (params) => callFn('getRecords', params);
const getRecordDetail = (recordId) => callFn('getRecordDetail', { recordId });
const getTodayRecords = () => callFn('getTodayRecords');

// 配对
const pairCreate = () => callFn('pairCreate');
const pairJoin   = (code) => callFn('pairJoin', { code });
const pairUnbind = () => callFn('pairUnbind');

// 搭子
const getPartner = () => callFn('getPartner');

// 周统计
const getCurrentWeekStats = () => callFn('getCurrentWeekStats');
const getWeeklySummary    = (weekStart) => callFn('getWeeklySummary', { weekStart });

// 点赞
const sendLike = (params) => callFn('sendLike', params);

module.exports = {
  callFn,
  login,
  createRecord,
  getRecords,
  getRecordDetail,
  getTodayRecords,
  pairCreate,
  pairJoin,
  pairUnbind,
  getPartner,
  getCurrentWeekStats,
  getWeeklySummary,
  sendLike
};
