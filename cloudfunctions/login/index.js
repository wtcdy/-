// cloudfunctions/login/index.js
// 微信登录 + 用户注册（首登自动写入 users 集合）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const usersCol = db.collection('users');

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID || wxContext.openid;
  const appid = wxContext.APPID;
  const unionid = wxContext.UNIONID || '';

  if (!openid) {
    return { success: false, code: 'NO_OPENID', message: '获取 openid 失败' };
  }

  const { code, nickName = '干饭人', avatarUrl = '' } = event || {};
  if (!code) {
    return { success: false, code: 'NO_CODE', message: '缺少 code' };
  }

  // 文本安全：昵称（个人主体也建议做）
  try {
    const check = await cloud.openapi.security.msgSecCheck({
      content: nickName
    });
    if (check.errCode && check.errCode !== 0) {
      return { success: false, code: 'TEXT_REJECT', message: '昵称含敏感内容' };
    }
  } catch (e) {
    // 安全接口异常不阻塞登录
    console.warn('msgSecCheck fail', e);
  }

  const now = Date.now();

  try {
    // 查 user
    const exist = await usersCol.where({ _openid: openid }).limit(1).get();
    let user;

    if (exist.data && exist.data.length > 0) {
      user = exist.data[0];
      // 更新昵称头像（如果用户重新授权）
      const upd = {};
      if (nickName && nickName !== user.nickName) upd.nickName = nickName;
      if (avatarUrl && avatarUrl !== user.avatarUrl) upd.avatarUrl = avatarUrl;
      upd.lastLoginAt = now;
      if (Object.keys(upd).length > 0) {
        await usersCol.doc(user._id).update({ data: upd });
        Object.assign(user, upd);
      }
    } else {
      // 新建
      const addRes = await usersCol.add({
        data: {
          _openid: openid,
          nickName,
          avatarUrl,
          partnerOpenid: '',
          pairedAt: 0,
          likedPartnerDates: [],   // v2 简化：用数组代替 likes 集合
          createdAt: now,
          lastLoginAt: now
        }
      });
      user = {
        _id: addRes._id,
        _openid: openid,
        nickName,
        avatarUrl,
        partnerOpenid: '',
        pairedAt: 0,
        likedPartnerDates: [],
        createdAt: now,
        lastLoginAt: now
      };
    }

    return {
      success: true,
      data: {
        openid,
        appid,
        unionid,
        user: {
          _id: user._id,
          openid,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
          partnerOpenid: user.partnerOpenid,
          pairedAt: user.pairedAt,
          createdAt: user.createdAt
        }
      }
    };
  } catch (err) {
    console.error('[login]', err);
    return { success: false, code: 'DB_ERROR', message: '登录服务异常' };
  }
};
