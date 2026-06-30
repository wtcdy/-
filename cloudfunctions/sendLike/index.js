// cloudfunctions/sendLike/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const usersCol = db.collection('users');

function pad(n) { return n < 10 ? '0' + n : '' + n; }
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

exports.main = async () => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID || wxContext.openid;
  if (!openid) return { success: false, code: 'NOT_LOGIN', message: '请先登录' };

  try {
    const meRes = await usersCol.where({ _openid: openid }).limit(1).get();
    const me = meRes.data?.[0];
    if (!me) return { success: false, code: 'USER_NOT_FOUND', message: '用户不存在' };

    const today = todayStr();
    const likedDates = me.likedPartnerDates || [];
    if (likedDates.includes(today)) {
      return { success: false, code: 'ALREADY_LIKED', message: '今天已经点过赞啦～' };
    }

    await usersCol.doc(me._id).update({
      data: { likedPartnerDates: _.push([today]) }
    });

    return { success: true, data: { date: today } };
  } catch (err) {
    console.error('[sendLike]', err);
    return { success: false, code: 'DB_ERROR', message: '点赞失败' };
  }
};
