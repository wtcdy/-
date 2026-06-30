// cloudfunctions/pairJoin/index.js
// 通过 6 位配对码加入（创建双向配对关系）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const pairCodesCol = db.collection('pairCodes');
const usersCol = db.collection('users');

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID || wxContext.openid;
  if (!openid) return { success: false, code: 'NOT_LOGIN', message: '请先登录' };

  const { code } = event || {};
  if (!code || !/^\d{6}$/.test(code)) {
    return { success: false, code: 'INVALID_CODE', message: '请输入 6 位配对码' };
  }

  try {
    // 检查自己是否已配对
    const meRes = await usersCol.where({ _openid: openid }).limit(1).get();
    if (meRes.data?.[0]?.partnerOpenid) {
      return { success: false, code: 'ALREADY_PAIRED', message: '你已配对，请先解除' };
    }

    // 找码
    const codeRes = await pairCodesCol.where({ code, status: 'pending' }).limit(1).get();
    if (!codeRes.data || codeRes.data.length === 0) {
      return { success: false, code: 'CODE_NOT_FOUND', message: '配对码无效' };
    }
    const codeDoc = codeRes.data[0];
    if (codeDoc.expireAt < Date.now()) {
      await pairCodesCol.doc(codeDoc._id).update({ data: { status: 'expired' } });
      return { success: false, code: 'CODE_EXPIRED', message: '配对码已过期' };
    }
    if (codeDoc.ownerOpenid === openid) {
      return { success: false, code: 'SELF_PAIR', message: '不能配对自己' };
    }

    // 双向写入 partnerOpenid
    const now = Date.now();
    const transaction = await db.startTransaction();

    try {
      await transaction.collection('users').where({ _openid: openid }).update({
        data: { partnerOpenid: codeDoc.ownerOpenid, pairedAt: now }
      });
      await transaction.collection('users').where({ _openid: codeDoc.ownerOpenid }).update({
        data: { partnerOpenid: openid, pairedAt: now }
      });
      await transaction.collection('pairCodes').doc(codeDoc._id).update({
        data: { status: 'used', usedBy: openid, usedAt: now }
      });
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }

    // 返回搭子信息
    const partnerRes = await usersCol.where({ _openid: codeDoc.ownerOpenid }).limit(1).get();
    const partner = partnerRes.data?.[0] || {};

    return {
      success: true,
      data: {
        partner: {
          openid: codeDoc.ownerOpenid,
          nickName: partner.nickName || '搭子',
          avatarUrl: partner.avatarUrl || ''
        }
      }
    };
  } catch (err) {
    console.error('[pairJoin]', err);
    return { success: false, code: 'DB_ERROR', message: '配对失败' };
  }
};
