// utils/imgSecCheck.js
// 图片内容安全检测（云函数统一调用）
// Mock 模式：跳过云端上传，返回本地路径作为 fileID

/**
 * 客户端先压缩再减少云函数耗时
 */
const compressImage = (src) => {
  return new Promise((resolve) => {
    // Mock 模式不压缩
    if (getApp()?.globalData?.mockMode) return resolve(src);
    wx.compressImage({
      src,
      quality: 80,
      success: (res) => resolve(res.tempFilePath),
      fail: () => resolve(src)
    });
  });
};

/**
 * 上传图片到云存储
 * Mock 模式：直接返回本地路径作为 fileID（不真上传）
 */
const uploadToCloud = async (filePath) => {
  // Mock 模式短路
  if (getApp()?.globalData?.mockMode) {
    return 'mock://' + (filePath || 'local-image');
  }
  const timestamp = Date.now();
  const ext = (filePath || '').match(/\.(\w+)$/)?.[1] || 'jpg';
  const cloudPath = `meal-images/${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const res = await wx.cloud.uploadFile({
    cloudPath,
    filePath
  });
  return res.fileID;
};

module.exports = {
  compressImage,
  uploadToCloud
};
