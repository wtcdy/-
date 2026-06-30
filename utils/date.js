// utils/date.js
// 日期 / 工作日 / 周范围 工具

const pad = (n) => (n < 10 ? '0' + n : '' + n);

const formatDate = (timestamp) => {
  const d = timestamp ? new Date(timestamp) : new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const formatTime = (timestamp) => {
  const d = timestamp ? new Date(timestamp) : new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDateTime = (timestamp) => {
  return `${formatDate(timestamp)} ${formatTime(timestamp)}`;
};

const today = () => formatDate();

const getRelativeDay = (dateStr) => {
  const todayStr = today();
  if (dateStr === todayStr) return '今天';
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  const yestStr = formatDate(yest.getTime());
  if (dateStr === yestStr) return '昨天';
  return dateStr;
};

const diffDays = (startTs, endTs) => {
  return Math.floor((endTs - startTs) / 86400000);
};

/* ============ 工作日判断（周一~周五） ============ */
const isWorkday = (date = new Date()) => {
  const day = date.getDay();   // 0=Sun, 6=Sat
  return day >= 1 && day <= 5;
};

const isWeekend = (date = new Date()) => !isWorkday(date);

/* ============ 星期几中文 ============ */
const WEEKDAY_CN = ['日', '一', '二', '三', '四', '五', '六'];
const weekdayCn = (date = new Date()) => `周${WEEKDAY_CN[date.getDay()]}`;

/* ============ 本周工作日范围（周一~周五） ============ */
/**
 * @returns {{
 *   weekStart: Date,      // 本周周一的 00:00
 *   weekEnd: Date,        // 本周周五的 23:59
 *   workDays: Date[],     // 5 个工作日 Date 数组
 *   daysPassed: number,   // 已过工作日数（不含未来）
 *   rangeText: string     // '11.11 - 11.15'
 * }}
 */
const getCurrentWeek = (now = new Date()) => {
  const day = now.getDay();   // 0=Sun, 1=Mon, ..., 6=Sat
  const offset = day === 0 ? 6 : day - 1;  // 周日算 6，周一算 0
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - offset);

  const workDays = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    workDays.push(d);
  }
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  let daysPassed = 0;
  if (isWorkday(now)) {
    daysPassed = offset + 1;
  } else if (day === 0 || day === 6) {
    daysPassed = 5;   // 周末 = 工作日已全过
  }

  const rangeText = `${pad(monday.getMonth() + 1)}.${pad(monday.getDate())} - ${pad(friday.getMonth() + 1)}.${pad(friday.getDate())}`;

  return {
    weekStart: monday,
    weekEnd: friday,
    workDays,
    daysPassed,
    rangeText
  };
};

/* ============ 上周工作日范围 ============ */
const getLastWeek = (now = new Date()) => {
  const cur = getCurrentWeek(now);
  const last = new Date(cur.weekStart);
  last.setDate(last.getDate() - 7);
  return getCurrentWeek(last);
};

module.exports = {
  formatDate,
  formatTime,
  formatDateTime,
  today,
  getRelativeDay,
  diffDays,
  isWorkday,
  isWeekend,
  weekdayCn,
  getCurrentWeek,
  getLastWeek,
  WEEKDAY_CN
};
