// cloudfunctions/pairUnbind/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const usersCol = db.collection('users');

exports.main = async () => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID || wxContext.openid;
  if (!openid) return { success: false, code: 'NOT_LOGIN', message: '请先登录' };

  try {
    const meRes = await usersCol.where({ _openid: openid }).limit(1).get();
    const me = meRes.data?.[0];
    if (!me || !me.partnerOpenid) {
      return { success: false, code: 'NOT_PAIRED', message: '你还没有配对' };
    }
    const partnerOpenid = me.partnerOpenid;

    // 双向解除
    const transaction = await db.startTransaction();
    try {
      await transaction.collection('users').where({ _openid: openid }).update({
        data: { partnerOpenid: '', pairedAt: 0 }
      });
      await transaction.collection('users').where({ _openid: partnerOpenid }).update({
        data: { partnerOpenid: '', pairedAt: 0 }
      });
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }

    return { success: true };
  } catch (err) {
    console.error('[pairUnbind]', err);
    return { success: false, code: 'DB_ERROR', message: '解除失败' };
  }
};
