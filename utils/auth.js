// utils/auth.js
// 登录态管理（openid / userInfo / partnerOpenid）

const getOpenid = () => wx.getStorageSync('openid') || '';
const setOpenid = (openid) => wx.setStorageSync('openid', openid);

const getUserInfo = () => wx.getStorageSync('userInfo') || null;
const setUserInfo = (userInfo) => {
  if (userInfo) wx.setStorageSync('userInfo', userInfo);
};

const getPartnerOpenid = () => wx.getStorageSync('partnerOpenid') || '';
const setPartnerOpenid = (partnerOpenid) => {
  wx.setStorageSync('partnerOpenid', partnerOpenid || '');
};

/**
 * 写入完整登录态
 */
const setLogin = (openid, userInfo = null) => {
  setOpenid(openid);
  if (userInfo) {
    setUserInfo(userInfo);
    if (userInfo.partnerOpenid !== undefined) {
      setPartnerOpenid(userInfo.partnerOpenid);
      const app = getApp();
      if (app) app.globalData.partnerOpenid = userInfo.partnerOpenid;
    }
  }
};

/**
 * 清空登录态
 */
const clearLogin = () => {
  wx.removeStorageSync('openid');
  wx.removeStorageSync('userInfo');
  wx.removeStorageSync('partnerOpenid');
  const app = getApp();
  if (app) {
    app.globalData.openid = '';
    app.globalData.userInfo = null;
    app.globalData.partnerOpenid = '';
    app.globalData.paired = false;
  }
};

const isLogin = () => !!getOpenid();

module.exports = {
  getOpenid,
  setOpenid,
  getUserInfo,
  setUserInfo,
  getPartnerOpenid,
  setPartnerOpenid,
  setLogin,
  clearLogin,
  isLogin
};
