// cloudfunctions/getWeeklySummary/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const mealsCol = db.collection('meals');

const FOOD_CAT_META = {
  staple:  { label: '主食',     emoji: '🍚' },
  veggie:  { label: '蔬菜水果', emoji: '🥗' },
  protein: { label: '肉蛋水产', emoji: '🍗' },
  soup:    { label: '汤粥饮品', emoji: '🍵' },
  dessert: { label: '甜品零食', emoji: '🍰' }
};

function getWeekDays() {
  const now = new Date();
  const day = now.getDay();
  const offset = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - offset);
  const arr = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    arr.push(d);
  }
  return { arr, monday, friday: arr[4] };
}
function pad(n) { return n < 10 ? '0' + n : '' + n; }
function dateStr(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
const WEEKDAY_CN = ['日', '一', '二', '三', '四', '五', '六'];

exports.main = async () => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID || wxContext.openid;
  if (!openid) return { success: false, code: 'NOT_LOGIN', message: '请先登录' };

  try {
    const { arr, monday, friday } = getWeekDays();
    const mondayStr = dateStr(monday);
    const fridayStr = dateStr(friday);

    const res = await mealsCol.where({
      _openid: openid,
      date: _.gte(mondayStr).and(_.lte(fridayStr))
    }).get();
    const records = res.data || [];

    const onTime = records.filter(r => r.status === 'on_time').length;
    const late   = records.filter(r => r.status === 'late').length;
    const missed = records.filter(r => r.status === 'missed').length;
    const total  = records.length;
    const onTimeRate = total > 0 ? Math.round((onTime / total) * 100) : 0;

    const mealCount = records.filter(r => r.mainCategory === 'meal').length;
    const fastCount = records.filter(r => r.mainCategory === 'fast').length;
    const mealTotal = mealCount + fastCount;
    const mealRate = mealTotal > 0 ? Math.round((mealCount / mealTotal) * 100) : 0;
    const fastRate = mealTotal > 0 ? Math.round((fastCount / mealTotal) * 100) : 0;

    // 5 大类别统计
    const catCount = { staple: 0, veggie: 0, protein: 0, soup: 0, dessert: 0 };
    records.forEach(r => {
      (r.foodCats || []).forEach(c => {
        if (catCount[c] !== undefined) catCount[c]++;
      });
    });
    const catTotal = Object.values(catCount).reduce((a, b) => a + b, 0);
    const topCats = Object.keys(catCount)
      .map(value => ({
        value,
        label: FOOD_CAT_META[value].label,
        emoji: FOOD_CAT_META[value].emoji,
        count: catCount[value],
        percent: catTotal > 0 ? Math.round((catCount[value] / catTotal) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .filter(c => c.count > 0)
      .slice(0, 3);

    // 5 工作日
    const weekDays = arr.map(d => {
      const ds = dateStr(d);
      const recs = records.filter(r => r.date === ds);
      let status = 'none';
      if (recs.length > 0) {
        const allOn = recs.every(r => r.status === 'on_time');
        const hasLate = recs.some(r => r.status === 'late');
        const hasMissed = recs.some(r => r.status === 'missed');
        if (hasMissed) status = 'missed';
        else if (hasLate) status = 'late';
        else if (allOn) status = 'on_time';
      }
      return {
        date: ds,
        weekday: `周${WEEKDAY_CN[d.getDay()]}`,
        dateLabel: `${d.getMonth() + 1}/${d.getDate()}`,
        status,
        mealCount: recs.length
      };
    });

    return {
      success: true,
      data: {
        rangeText: `${pad(monday.getMonth() + 1)}.${pad(monday.getDate())} - ${pad(friday.getMonth() + 1)}.${pad(friday.getDate())}`,
        onTimeRate,
        onTime, late, missed, total,
        meal: mealCount, fast: fastCount,
        mealRate, fastRate,
        topCats,
        weekDays
      }
    };
  } catch (err) {
    console.error('[getWeeklySummary]', err);
    return { success: false, code: 'DB_ERROR', message: '查询失败' };
  }
};
