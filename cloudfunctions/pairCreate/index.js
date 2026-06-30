// cloudfunctions/pairCreate/index.js
// 发起配对：生成 6 位数字配对码，10 分钟内有效
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const pairCodesCol = db.collection('pairCodes');
const usersCol = db.collection('users');

/* ===== 生成不重复的 6 位配对码 ===== */
async function generateUniqueCode() {
  for (let i = 0; i < 10; i++) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const exist = await pairCodesCol.where({ code, status: 'pending' }).limit(1).get();
    if (!exist.data || exist.data.length === 0) {
      return code;
    }
  }
  // 兜底：用时间戳后 6 位
  return String(Date.now()).slice(-6);
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID || wxContext.openid;
  if (!openid) {
    return { success: false, code: 'NOT_LOGIN', message: '请先登录' };
  }

  // 检查自己是否已配对
  try {
    const meRes = await usersCol.where({ _openid: openid }).limit(1).get();
    if (meRes.data && meRes.data[0] && meRes.data[0].partnerOpenid) {
      return { success: false, code: 'ALREADY_PAIRED', message: '你已配对，请先解除' };
    }
  } catch (e) {
    console.warn('check paired fail', e);
  }

  // 清理自己之前过期的 pending 码
  try {
    await pairCodesCol.where({
      ownerOpenid: openid,
      status: 'pending',
      expireAt: _.lt(Date.now())
    }).remove();
  } catch (e) { /* ignore */ }

  const code = await generateUniqueCode();
  const now = Date.now();
  const expireAt = now + 10 * 60 * 1000;  // 10 分钟

  try {
    const addRes = await pairCodesCol.add({
      data: {
        code,
        ownerOpenid: openid,
        status: 'pending',
        expireAt,
        createdAt: now
      }
    });

    return {
      success: true,
      data: {
        pairCodeId: addRes._id,
        code,
        expireAt,
        expiresIn: 600   // 秒
      }
    };
  } catch (err) {
    console.error('[pairCreate]', err);
    return { success: false, code: 'DB_ERROR', message: '生成配对码失败' };
  }
};
