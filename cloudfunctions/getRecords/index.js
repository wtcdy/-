// cloudfunctions/getRecords/index.js
// 获取历史打卡记录（v3.1 含 foodCats）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const mealsCol = db.collection('meals');

/**
 * 入参：
 *   - targetOpenid?: string  指定他人 openid（搭子查看时用）
 *   - date?: string          'YYYY-MM-DD' 某日（用于 getTodayRecords）
 *   - startDate?: string     范围起点
 *   - endDate?: string       范围终点
 *   - limit?: number         默认 50
 *   - skip?: number          默认 0
 *   - onlyWeekdays?: boolean 是否仅工作日
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID || wxContext.openid;
  if (!openid) {
    return { success: false, code: 'NOT_LOGIN', message: '请先登录' };
  }

  const {
    targetOpenid,           // 看别人（搭子）
    date,                   // 某日
    startDate,              // 范围
    endDate,
    limit = 50,
    skip = 0,
    onlyWeekdays = false
  } = event || {};

  // 安全：只能查自己或自己的搭子（不在此处校验，留给上层 createRecord 时绑定的 partnerOpenid 关系）
  const queryOpenid = targetOpenid || openid;

  // 组装查询条件
  const where = { _openid: queryOpenid };
  if (date) {
    where.date = date;
  } else if (startDate || endDate) {
    const dateCond = {};
    if (startDate) Object.assign(dateCond, { $gte: startDate });
    if (endDate)   Object.assign(dateCond, { $lte: endDate });
    where.date = dateCond;
  }

  try {
    // 工作日过滤（仅 v2 周统计时）
    let records = [];
    const res = await mealsCol
      .where(where)
      .orderBy('timestamp', 'desc')
      .skip(skip)
      .limit(limit)
      .get();

    records = res.data || [];

    if (onlyWeekdays) {
      records = records.filter(r => {
        const d = new Date(r.timestamp);
        const day = d.getDay();
        return day >= 1 && day <= 5;
      });
    }

    // 计算分布（v3.1）
    const stats = {
      total: records.length,
      onTime: records.filter(r => r.status === 'on_time').length,
      late:   records.filter(r => r.status === 'late').length,
      missed: records.filter(r => r.status === 'missed').length,
      meal:   records.filter(r => r.mainCategory === 'meal').length,
      fast:   records.filter(r => r.mainCategory === 'fast').length,
      foodCatCount: { staple: 0, veggie: 0, protein: 0, soup: 0, dessert: 0 }
    };
    records.forEach(r => {
      (r.foodCats || []).forEach(c => {
        if (stats.foodCatCount[c] !== undefined) stats.foodCatCount[c]++;
      });
    });
    stats.onTimeRate = stats.total > 0 ? Math.round((stats.onTime / stats.total) * 100) : 0;
    stats.mealRate   = (stats.meal + stats.fast) > 0
      ? Math.round((stats.meal / (stats.meal + stats.fast)) * 100) : 0;

    return {
      success: true,
      data: {
        list: records,
        stats,
        hasMore: records.length === limit
      }
    };
  } catch (err) {
    console.error('[getRecords]', err);
    return { success: false, code: 'DB_ERROR', message: '查询失败' };
  }
};
