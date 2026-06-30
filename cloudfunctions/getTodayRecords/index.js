// cloudfunctions/getTodayRecords/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const mealsCol = db.collection('meals');

exports.main = async () => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID || wxContext.openid;
  if (!openid) return { success: false, code: 'NOT_LOGIN', message: '请先登录' };

  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  try {
    const res = await mealsCol.where({ _openid: openid, date }).orderBy('timestamp', 'asc').get();
    return { success: true, data: { list: res.data || [] } };
  } catch (err) {
    console.error('[getTodayRecords]', err);
    return { success: false, code: 'DB_ERROR', message: '查询失败' };
  }
};
