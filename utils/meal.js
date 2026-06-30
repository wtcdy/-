// utils/meal.js
// 餐次 / 正餐速食 / 5 大食物类别 定义（v3.1）

/* ============ 餐次（4 选 1，必填） ============ */
const MEAL_TYPES = [
  { value: 'breakfast', label: '早餐',  emoji: '🌅', deadline: '10:00', color: 'cream' },
  { value: 'lunch',     label: '午餐',  emoji: '☀️', deadline: '14:00', color: 'peach' },
  { value: 'dinner',    label: '晚餐',  emoji: '🌙', deadline: '21:00', color: 'lavender' },
  { value: 'snack',     label: '加餐',  emoji: '🍪', deadline: '无限制', color: 'mint' }
];

const MEAL_TYPE_MAP = MEAL_TYPES.reduce((m, t) => (m[t.value] = t, m), {});

/* ============ 正餐 / 速食（2 选 1，必填） ============ */
const MAIN_CATEGORIES = [
  { value: 'meal', label: '正餐', emoji: '🍱', bg: '#FFE3E8', fg: '#FF6B8B' },
  { value: 'fast', label: '速食', emoji: '🍔', bg: '#FFD9B3', fg: '#B58A3F' }
];

const MAIN_CATEGORY_MAP = MAIN_CATEGORIES.reduce((m, c) => (m[c.value] = c, m), {});

/* ============ 5 大食物类别（多选 ≥1，必填） v3.1 ============ */
const FOOD_CATEGORIES = [
  { value: 'staple',  label: '主食',     emoji: '🍚', range: '米饭/面食/面包/馒头等',
    gradient: 'linear-gradient(135deg, #FFF4D6, #FFE7A0)', border: '#F0C95C', fg: '#8A6B1E' },
  { value: 'veggie',  label: '蔬菜水果', emoji: '🥗', range: '各种蔬菜、水果',
    gradient: 'linear-gradient(135deg, #D6EBDC, #C6EBC9)', border: '#7BC094', fg: '#3F7A56' },
  { value: 'protein', label: '肉蛋水产', emoji: '🍗', range: '肉/鱼/虾/蛋/奶',
    gradient: 'linear-gradient(135deg, #FFE0CC, #FFC7A0)', border: '#F0A36B', fg: '#8A4F25' },
  { value: 'soup',    label: '汤粥饮品', emoji: '🍵', range: '汤/粥/豆浆/咖啡/茶',
    gradient: 'linear-gradient(135deg, #DCE8F4, #C7E0F0)', border: '#7AAED1', fg: '#2E5A82' },
  { value: 'dessert', label: '甜品零食', emoji: '🍰', range: '蛋糕/巧克力/饼干/薯片等',
    gradient: 'linear-gradient(135deg, #E8DEF5, #D7C7F0)', border: '#B69FE0', fg: '#5B4080' }
];

const FOOD_CATEGORY_MAP = FOOD_CATEGORIES.reduce((m, c) => (m[c.value] = c, m), {});

/* ============ 状态映射 ============ */
const STATUS = {
  ON_TIME: 'on_time',
  LATE:    'late',
  MISSED:  'missed'
};

const STATUS_META = {
  [STATUS.ON_TIME]: { label: '按时', emoji: '🟢', color: '#5C8C72', bg: 'rgba(200,230,217,0.3)' },
  [STATUS.LATE]:    { label: '延时', emoji: '🟡', color: '#B58A3F', bg: 'rgba(255,217,179,0.3)' },
  [STATUS.MISSED]:  { label: '缺卡', emoji: '⚪', color: '#6B89AD', bg: 'rgba(214,229,245,0.3)' }
};

/* ============ 状态计算（v2 阈值规则） ============ */
/**
 * 根据餐次和打卡时间计算状态
 * - 加餐：始终 on_time
 * - 早 10:00 截止 / 11:00 延期截止
 * - 午 14:00 截止 / 15:00 延期截止
 * - 晚 21:00 截止 / 22:00 延期截止
 */
const calcStatus = (mealType, timestamp = Date.now()) => {
  if (mealType === 'snack') return STATUS.ON_TIME;

  const d = new Date(timestamp);
  const now = d.getHours() * 60 + d.getMinutes();

  const rules = {
    breakfast: { deadline: 10 * 60, lateDeadline: 11 * 60 },
    lunch:     { deadline: 14 * 60, lateDeadline: 15 * 60 },
    dinner:    { deadline: 21 * 60, lateDeadline: 22 * 60 }
  };
  const r = rules[mealType];
  if (!r) return STATUS.ON_TIME;
  if (now <= r.deadline)     return STATUS.ON_TIME;
  if (now <= r.lateDeadline) return STATUS.LATE;
  return STATUS.MISSED;
};

/* ============ 校验函数（v3.1 三必填） ============ */
const validateCreateRecord = ({ mealType, mainCategory, foodCats }) => {
  if (!mealType || !MEAL_TYPE_MAP[mealType]) {
    return { ok: false, message: '请选择餐次' };
  }
  if (!mainCategory || !MAIN_CATEGORY_MAP[mainCategory]) {
    return { ok: false, message: '请选择正餐或速食' };
  }
  if (!Array.isArray(foodCats) || foodCats.length === 0) {
    return { ok: false, message: '请至少选择 1 个食物类别' };
  }
  if (foodCats.length > 5) {
    return { ok: false, message: '食物类别最多 5 个' };
  }
  for (const cat of foodCats) {
    if (!FOOD_CATEGORY_MAP[cat]) {
      return { ok: false, message: `食物类别"${cat}"无效` };
    }
  }
  return { ok: true };
};

module.exports = {
  MEAL_TYPES,
  MEAL_TYPE_MAP,
  MAIN_CATEGORIES,
  MAIN_CATEGORY_MAP,
  FOOD_CATEGORIES,
  FOOD_CATEGORY_MAP,
  STATUS,
  STATUS_META,
  calcStatus,
  validateCreateRecord
};
