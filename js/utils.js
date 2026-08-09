// ===== Sports Nutrition Dashboard - Utility Functions =====

const PALETTE = {
  green: '#3ecf8e',
  red: '#f25c6e',
  orange: '#f5a623',
  blue: '#4d9fff',
  purple: '#a78bfa',
  cyan: '#38bdf8',
  pink: '#f472b6',
  yellow: '#fbbf24',
  gray: '#6b6f80',
  white: '#e8eaed'
};

const CATEGORY_COLORS = {
  // Sport nutrition
  'whey-protein': '#4d9fff', 'plant-protein': '#3ecf8e',
  'creatine': '#f5a623', 'pre-workout': '#f25c6e',
  'bcaa-eaa': '#38bdf8', 'protein-bars': '#f472b6',
  'rtd-shakes': '#a78bfa', 'mass-gainer': '#fbbf24',
  'electrolytes': '#06b6d4', 'collagen': '#ec4899',
  'lean-fat-burner': '#ef4444',
  // Vitamins & Minerals
  'vitamins-multivitamins': '#8b5cf6', 'vitamin-d': '#f59e0b',
  'vitamin-c': '#f97316', 'vitamin-b': '#84cc16',
  'calcium': '#e2e8f0', 'magnesium': '#6366f1',
  'zinc': '#94a3b8', 'iron': '#dc2626',
  // Specialty Supplements
  'fish-oil-omega3': '#fbbf24', 'probiotics': '#22c55e',
  'melatonin-sleep': '#1e293b', 'coq10': '#eab308',
  'glucosamine-joint': '#d97706', 'milk-thistle-liver': '#65a30d',
  'lutein-eye': '#06b6d4', 'ashwagandha': '#a855f7',
  'brain-cognitive': '#7c3aed', 'immunity': '#10b981',
  'digestive-enzymes': '#14b8a6', 'digestive-health': '#059669',
  'hair-skin-nails': '#db2777', 'antioxidant': '#b45309',
  'turmeric-curcumin': '#f59e0b', 'green-tea-extract': '#15803d',
  'apple-cider-vinegar': '#a3e635'
};

const COUNTRY_FLAGS = {
  'US': '🇺🇸', 'UK': '🇬🇧', 'DE': '🇩🇪', 'PT': '🇵🇹',
  'AU': '🇦🇺', 'NZ': '🇳🇿', 'CA': '🇨🇦', 'SE': '🇸🇪',
  'JP': '🇯🇵', 'FR': '🇫🇷', 'IT': '🇮🇹', 'CH': '🇨🇭',
  'KR': '🇰🇷', 'NL': '🇳🇱'
};

const CATEGORY_NAMES = {
  // Sport nutrition
  'whey-protein': '乳清蛋白', 'plant-protein': '植物蛋白',
  'creatine': '肌酸', 'pre-workout': '氮泵/Pre-Workout',
  'bcaa-eaa': 'BCAA/EAA', 'protein-bars': '蛋白棒',
  'rtd-shakes': '即饮蛋白', 'mass-gainer': '增肌粉',
  'electrolytes': '电解质', 'collagen': '胶原蛋白',
  'lean-fat-burner': '减脂类',
  // Vitamins & Minerals
  'vitamins-multivitamins': '综合维生素', 'vitamin-d': '维生素D',
  'vitamin-c': '维生素C', 'vitamin-b': '维生素B族',
  'calcium': '钙', 'magnesium': '镁',
  'zinc': '锌', 'iron': '铁/补血',
  // Specialty Supplements
  'fish-oil-omega3': '鱼油/Omega-3', 'probiotics': '益生菌',
  'melatonin-sleep': '褪黑素/睡眠', 'coq10': '辅酶Q10',
  'glucosamine-joint': '氨糖/关节', 'milk-thistle-liver': '奶蓟草/护肝',
  'lutein-eye': '叶黄素/护眼', 'ashwagandha': '南非醉茄',
  'brain-cognitive': '脑力认知', 'immunity': '免疫力',
  'digestive-enzymes': '消化酶', 'digestive-health': '肠胃健康',
  'hair-skin-nails': '头发皮肤指甲', 'antioxidant': '抗氧化',
  'turmeric-curcumin': '姜黄素', 'green-tea-extract': '绿茶提取物',
  'apple-cider-vinegar': '苹果醋'
};

function formatPrice(usd) {
  if (usd == null) return 'N/A';
  return '$' + usd.toFixed(2);
}

function formatNumber(n) {
  if (n == null) return 'N/A';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function formatPct(n) {
  if (n == null) return 'N/A';
  return (n >= 0 ? '+' : '') + n.toFixed(1) + '%';
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function getRatingStars(rating) {
  if (rating == null) return 'N/A';
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}

function getCompositeScore(brand, socialData, products) {
  let score = 0;
  // Global rank component
  if (brand.global_rank) score += Math.max(0, 50 - brand.global_rank);
  // Social heat
  const brandSocial = socialData.filter(s => s.brand_slug === brand.brand_slug);
  const totalFollowers = brandSocial.reduce((sum, s) => sum + (s.follower_count || s.subscriber_count || 0), 0);
  score += Math.log10(totalFollowers + 1) * 5;
  // Product count
  const brandProducts = products.filter(p => p.brand_slug === brand.brand_slug);
  score += Math.min(brandProducts.length * 2, 20);
  // JD presence bonus
  if (brand.jd_available) score += 5;
  return Math.round(score);
}

// Chart.js defaults
Chart.defaults.color = '#9ca0b0';
Chart.defaults.borderColor = '#2a2d42';
Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif";
Chart.defaults.plugins.tooltip.backgroundColor = '#1e2135';
Chart.defaults.plugins.tooltip.borderColor = '#333752';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.titleColor = '#e8eaed';
Chart.defaults.plugins.tooltip.bodyColor = '#9ca0b0';
