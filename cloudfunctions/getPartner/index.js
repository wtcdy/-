// cloudfunctions/getPartner/index.js
// 返回搭子信息、今日打卡、本周 5 工作日状态
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const usersCol = db.collection('users');
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
  return arr;
}

function pad(n) { return n < 10 ? '0' + n : '' + n; }
function dateStr(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
const WEEKDAY_CN = ['日', '一', '二', '三', '四', '五', '六'];

exports.main = async () => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID || wxContext.openid;
  if (!openid) return { success: false, code: 'NOT_LOGIN', message: '请先登录' };

  try {
    const meRes = await usersCol.where({ _openid: openid }).limit(1).get();
    const me = meRes.data?.[0];
    if (!me || !me.partnerOpenid) {
      return { success: true, data: { partner: null } };
    }

    // 拉搭子信息
    const partnerRes = await usersCol.where({ _openid: me.partnerOpenid }).limit(1).get();
    const partner = partnerRes.data?.[0] || { _openid: me.partnerOpenid, nickName: '搭子' };

    // 今日打卡
    const today = dateStr(new Date());
    const todayRes = await mealsCol.where({ _openid: me.partnerOpenid, date: today }).orderBy('timestamp', 'asc').get();

    // 本周 5 工作日
    const weekDays = getWeekDays();
    const mondayStr = dateStr(weekDays[0]);
    const fridayStr = dateStr(weekDays[4]);
    const weekRes = await mealsCol.where({
      _openid: me.partnerOpenid,
      date: _.gte(mondayStr).and(_.lte(fridayStr))
    }).get();
    const weekRecords = weekRes.data || [];

    // 按日期聚合状态
    const weekDayStatus = weekDays.map(d => {
      const ds = dateStr(d);
      const recs = weekRecords.filter(r => r.date === ds);
      let status = 'none';
      if (recs.length > 0) {
        const hasLate = recs.some(r => r.status === 'late');
        const allOnTime = recs.every(r => r.status === 'on_time');
        if (allOnTime) status = 'on_time';
        else if (hasLate) status = 'late';
        else status = 'partial';
      }
      return {
        date: ds,
        weekday: `周${WEEKDAY_CN[d.getDay()]}`,
        dateLabel: `${d.getMonth() + 1}/${d.getDate()}`,
        status,
        mealCount: recs.length
      };
    });

    const weekRangeText = `${pad(weekDays[0].getMonth() + 1)}.${pad(weekDays[0].getDate())} - ${pad(weekDays[4].getMonth() + 1)}.${pad(weekDays[4].getDate())}`;

    // 配对天数
    const pairedDays = me.pairedAt ? Math.max(1, Math.floor((Date.now() - me.pairedAt) / 86400000)) : 0;

    return {
      success: true,
      data: {
        partner: {
          openid: partner._openid,
          nickName: partner.nickName,
          avatarUrl: partner.avatarUrl
        },
        todayRecords: todayRes.data || [],
        weekDays: weekDayStatus,
        weekRangeText,
        pairedDays,
        likedDates: me.likedPartnerDates || []
      }
    };
  } catch (err) {
    console.error('[getPartner]', err);
    return { success: false, code: 'DB_ERROR', message: '查询失败' };
  }
};
