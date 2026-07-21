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
  'whey-protein': '#4d9fff',
  'plant-protein': '#3ecf8e',
  'creatine': '#f5a623',
  'pre-workout': '#f25c6e',
  'bcaa-eaa': '#38bdf8',
  'protein-bars': '#f472b6',
  'rtd-shakes': '#a78bfa',
  'mass-gainer': '#fbbf24',
  'electrolytes': '#38bdf8',
  'collagen': '#f472b6',
  'lean-fat-burner': '#f25c6e'
};

const COUNTRY_FLAGS = {
  'US': '🇺🇸', 'UK': '🇬🇧', 'DE': '🇩🇪', 'PT': '🇵🇹',
  'AU': '🇦🇺', 'NZ': '🇳🇿', 'CA': '🇨🇦', 'SE': '🇸🇪'
};

const CATEGORY_NAMES = {
  'whey-protein': '乳清蛋白', 'plant-protein': '植物蛋白',
  'creatine': '肌酸', 'pre-workout': '氮泵/Pre-Workout',
  'bcaa-eaa': 'BCAA/EAA', 'protein-bars': '蛋白棒',
  'rtd-shakes': '即饮蛋白', 'mass-gainer': '增肌粉',
  'electrolytes': '电解质', 'collagen': '胶原蛋白',
  'lean-fat-burner': '减脂类'
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
