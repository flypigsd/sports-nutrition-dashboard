// ===== Sports Nutrition Dashboard - Data Loader =====

const DATA_CACHE_KEY = 'sports-nutrition-dashboard-data';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min cache

async function loadAllData() {
  // Check session cache
  const cached = sessionStorage.getItem(DATA_CACHE_KEY);
  if (cached) {
    const parsed = JSON.parse(cached);
    if (Date.now() - parsed._ts < CACHE_TTL_MS) {
      return parsed;
    }
  }

  const files = ['brands', 'products', 'channels', 'social', 'reviews', 'categories', 'metadata'];
  const results = {};

  try {
    const fetches = files.map(f =>
      fetch(`data/${f}.json?t=${Date.now()}`)
        .then(r => r.json())
        .then(d => { results[f] = d; })
        .catch(err => {
          console.warn(`Failed to load ${f}.json:`, err);
          results[f] = [];
        })
    );
    await Promise.all(fetches);
  } catch (e) {
    console.error('Data loading error:', e);
  }

  results._ts = Date.now();
  try { sessionStorage.setItem(DATA_CACHE_KEY, JSON.stringify(results)); } catch (e) {}

  return results;
}

function filterProductsByCategory(products, categorySlug) {
  if (!categorySlug || categorySlug === 'all') return products;
  return products.filter(p => p.category === categorySlug);
}

function getBrandBySlug(brands, slug) {
  return brands.find(b => b.brand_slug === slug);
}

function getSocialForBrand(social, brandSlug) {
  return social.filter(s => s.brand_slug === brandSlug);
}

function getReviewsForProduct(reviews, productId) {
  return reviews.filter(r => r.product_id === productId);
}

function getProductsByBrand(products, brandSlug) {
  return products.filter(p => p.brand_slug === brandSlug);
}

// Build a "opportunity" score for JD gap analysis
function buildOpportunityData(brands, products, social) {
  return brands.map(brand => {
    const brandProducts = products.filter(p => p.brand_slug === brand.brand_slug);
    const brandSocial = social.filter(s => s.brand_slug === brand.brand_slug);

    // Global sales rank proxy (lower number = better)
    const avgRank = brandProducts.reduce((sum, p) => {
      const ranks = Object.values(p.channel_presence || {})
        .filter(c => c.bestseller_rank)
        .map(c => c.bestseller_rank);
      return sum + (ranks.length ? ranks.reduce((a, b) => a + b, 0) / ranks.length : 100);
    }, 0) / (brandProducts.length || 1);

    // Social heat
    const totalFollowers = brandSocial.reduce((sum, s) =>
      sum + (s.follower_count || s.subscriber_count || 0), 0);

    // Review count
    const totalReviews = brandProducts.reduce((sum, p) =>
      sum + Object.values(p.channel_presence || {}).reduce((s, c) => s + (c.review_count || 0), 0), 0);

    return {
      brand_slug: brand.brand_slug,
      brand_name: brand.brand_name,
      country: brand.headquarters_country,
      categories: brand.primary_categories,
      global_rank: brand.global_rank,
      avg_sales_rank: Math.round(avgRank),
      social_followers: totalFollowers,
      total_reviews: totalReviews,
      jd_available: brand.jd_available,
      tmall_available: brand.tmall_available,
      composite_score: getCompositeScore(brand, social, products)
    };
  });
}

// Build trend data from social + categories
function buildTrendData(social, categories) {
  const ingredientMentions = {};

  social.forEach(s => {
    if (s.top_video_tags) {
      s.top_video_tags.forEach(tag => {
        const key = tag.toLowerCase();
        ingredientMentions[key] = (ingredientMentions[key] || 0) + 1;
      });
    }
  });

  // Merge with category trending ingredients
  categories.forEach(cat => {
    if (cat.trending_ingredients) {
      cat.trending_ingredients.forEach(ing => {
        const key = ing.toLowerCase();
        ingredientMentions[key] = (ingredientMentions[key] || 0) + 2; // higher weight
      });
    }
  });

  return Object.entries(ingredientMentions)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}
