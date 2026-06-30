// cloudfunctions/getRecordDetail/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const mealsCol = db.collection('meals');

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID || wxContext.openid;
  if (!openid) return { success: false, code: 'NOT_LOGIN', message: '请先登录' };

  const { recordId } = event || {};
  if (!recordId) return { success: false, code: 'NO_ID', message: '缺少 recordId' };

  try {
    const res = await mealsCol.doc(recordId).get();
    if (!res.data) return { success: false, code: 'NOT_FOUND', message: '记录不存在' };
    // 权限：只能看自己的；或搭子的
    if (res.data._openid !== openid) {
      const me = await db.collection('users').where({ _openid: openid }).limit(1).get();
      const myPartner = me.data?.[0]?.partnerOpenid;
      if (myPartner !== res.data._openid) {
        return { success: false, code: 'NO_PERMISSION', message: '无权查看' };
      }
    }
    return { success: true, data: res.data };
  } catch (err) {
    console.error('[getRecordDetail]', err);
    return { success: false, code: 'DB_ERROR', message: '查询失败' };
  }
};
