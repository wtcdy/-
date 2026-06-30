// cloudfunctions/getCurrentWeekStats/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const mealsCol = db.collection('meals');

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

exports.main = async () => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID || wxContext.openid;
  if (!openid) return { success: false, code: 'NOT_LOGIN', message: '请先登录' };

  try {
    const now = new Date();
    const { arr, monday, friday } = getWeekDays();
    const mondayStr = dateStr(monday);
    const fridayStr = dateStr(friday);

    const res = await mealsCol.where({
      _openid: openid,
      date: _.gte(mondayStr).and(_.lte(fridayStr))
    }).get();
    const records = res.data || [];

    const onTime = records.filter(r => r.status === 'on_time').length;
    const total = records.length;
    const onTimeRate = total > 0 ? Math.round((onTime / total) * 100) : 0;
    const meal = records.filter(r => r.mainCategory === 'meal').length;
    const fast = records.filter(r => r.mainCategory === 'fast').length;
    const mealRate = (meal + fast) > 0 ? Math.round((meal / (meal + fast)) * 100) : 0;

    const day = now.getDay();
    let daysPassed = 0;
    if (day >= 1 && day <= 5) daysPassed = (day === 0 ? 6 : day - 1) + 1;
    else if (day === 0 || day === 6) daysPassed = 5;

    return {
      success: true,
      data: {
        rangeText: `${pad(monday.getMonth() + 1)}.${pad(monday.getDate())} - ${pad(friday.getMonth() + 1)}.${pad(friday.getDate())}`,
        onTimeRate,
        mealRate,
        total,
        onTime,
        daysPassed,
        totalWorkDays: 5
      }
    };
  } catch (err) {
    console.error('[getCurrentWeekStats]', err);
    return { success: false, code: 'DB_ERROR', message: '查询失败' };
  }
};
