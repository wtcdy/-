// utils/imgSecCheck.js
// 图片内容安全检测
// Mock 模式：跳过云端上传，返回本地路径作为 fileID
// 真云开发模式：调用 wx.cloud.uploadFile 上传到云存储

const app = getApp();

/**
 * 客户端先压缩再上传
 * @param {string} src 本地临时路径
 * @returns {Promise<string>} 压缩后的临时路径
 */
const compressImage = (src) => {
  return new Promise((resolve) => {
    // Mock 模式不压缩
    if (app?.globalData?.mode === 'mock') return resolve(src);
    const quality = app?.globalData?.config?.business?.imageQuality || 80;
    wx.compressImage({
      src,
      quality,
      success: (res) => resolve(res.tempFilePath),
      fail: () => resolve(src)
    });
  });
};

/**
 * 上传图片到云存储
 * @param {string} filePath 本地临时路径
 * @returns {Promise<string>} fileID
 */
const uploadToCloud = async (filePath) => {
  // Mock 模式短路
  if (app?.globalData?.mode === 'mock') {
    return 'mock://' + (filePath || 'local-image');
  }
  const timestamp = Date.now();
  const ext = (filePath || '').match(/\.(\w+)$/)?.[1] || 'jpg';
  const random = Math.random().toString(36).slice(2, 8);
  const cloudPath = `meal-images/${timestamp}-${random}.${ext}`;

  const res = await wx.cloud.uploadFile({
    cloudPath,
    filePath
  });
  return res.fileID;
};

/**
 * 检测开关：是否启用 imgSecCheck
 */
const isImgSecCheckEnabled = () => {
  return app?.globalData?.config?.enableImgSecCheck !== false;
};

/**
 * 检测开关：是否启用 textSecCheck
 */
const isTextSecCheckEnabled = () => {
  return app?.globalData?.config?.enableTextSecCheck !== false;
};

module.exports = {
  compressImage,
  uploadToCloud,
  isImgSecCheckEnabled,
  isTextSecCheckEnabled
};
