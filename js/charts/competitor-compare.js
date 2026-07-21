// ===== Competitor Comparison - Radar Chart + Side-by-Side Table =====

let compareRadarChart = null;
let selectedBrands = [];

function renderCompetitorCompare(data) {
  const { brands, products, social } = data;

  // Brand selector chips
  const selector = document.getElementById('compare-selector');
  const topBrands = brands.sort((a, b) => a.global_rank - b.global_rank).slice(0, 20);
  selector.innerHTML = topBrands.map(b => `
    <div class="compare-chip" data-brand="${b.brand_slug}" onclick="toggleCompareBrand('${b.brand_slug}')">
      ${b.brand_name}
    </div>
  `).join('');

  // Default select top 4
  selectedBrands = topBrands.slice(0, 4).map(b => b.brand_slug);
  updateCompareChips();
  renderCompareChart(brands, products, social);
}

function toggleCompareBrand(slug) {
  if (selectedBrands.includes(slug)) {
    if (selectedBrands.length > 1) selectedBrands = selectedBrands.filter(s => s !== slug);
  } else {
    if (selectedBrands.length < 5) selectedBrands.push(slug);
  }
  updateCompareChips();
  const data = window._dashboardData;
  renderCompareChart(data.brands, data.products, data.social);
}

function updateCompareChips() {
  document.querySelectorAll('.compare-chip').forEach(chip => {
    const slug = chip.dataset.brand;
    chip.classList.toggle('selected', selectedBrands.includes(slug));
  });
}

function renderCompareChart(brands, products, social) {
  const selectedData = selectedBrands.map(slug => {
    const brand = getBrandBySlug(brands, slug);
    const brandProducts = getProductsByBrand(products, slug);
    const brandSocial = getSocialForBrand(social, slug);

    // Average price
    const prices = brandProducts.flatMap(p =>
      Object.values(p.channel_presence || {}).map(c => c.current_price_usd).filter(Boolean)
    );
    const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

    // Average rating
    const ratings = brandProducts.flatMap(p =>
      Object.values(p.channel_presence || {}).map(c => c.rating).filter(Boolean)
    );
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    // Total reviews
    const totalReviews = brandProducts.reduce((sum, p) =>
      sum + Object.values(p.channel_presence || {}).reduce((s, c) => s + (c.review_count || 0), 0), 0);

    // Social followers
    const totalFollowers = brandSocial.reduce((sum, s) =>
      sum + (s.follower_count || s.subscriber_count || 0), 0);

    // Social growth
    const avgGrowth = brandSocial.length ?
      brandSocial.reduce((sum, s) => sum + (s.growth_rate_30d_pct || 0), 0) / brandSocial.length : 0;

    return {
      brand_name: brand.brand_name,
      avg_price: Math.round(avgPrice),
      avg_rating: avgRating.toFixed(1),
      total_reviews: totalReviews,
      total_followers: totalFollowers,
      sku_count: brandProducts.length,
      avg_growth: avgGrowth.toFixed(1)
    };
  });

  // Radar chart
  const ctx = document.getElementById('chart-radar-compare').getContext('2d');
  if (compareRadarChart) compareRadarChart.destroy();

  // Normalize for radar
  const maxPrice = Math.max(...selectedData.map(d => d.avg_price), 1);
  const maxReviews = Math.max(...selectedData.map(d => d.total_reviews), 1);
  const maxFollowers = Math.max(...selectedData.map(d => d.total_followers), 1);
  const maxSKU = Math.max(...selectedData.map(d => d.sku_count), 1);

  const colors = ['#4d9fff', '#3ecf8e', '#f25c6e', '#a78bfa', '#fbbf24'];

  compareRadarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['价格竞争力', '平均评分', '评价数量', '社媒粉丝', 'SKU广度', '社媒增速'],
      datasets: selectedData.map((d, i) => ({
        label: d.brand_name,
        data: [
          Math.round((1 - d.avg_price / maxPrice) * 100),
          parseFloat(d.avg_rating) * 20,
          Math.round(Math.log10(d.total_reviews + 1) / Math.log10(maxReviews + 1) * 100),
          Math.round(Math.log10(d.total_followers + 1) / Math.log10(maxFollowers + 1) * 100),
          Math.round(d.sku_count / maxSKU * 100),
          Math.max(0, Math.round(parseFloat(d.avg_growth) * 5))
        ],
        backgroundColor: colors[i] + '20',
        borderColor: colors[i],
        borderWidth: 2,
        pointBackgroundColor: colors[i]
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#9ca0b0', usePointStyle: true, padding: 16 }
        }
      },
      scales: {
        r: {
          grid: { color: '#2a2d42' },
          angleLines: { color: '#2a2d42' },
          pointLabels: { color: '#9ca0b0', font: { size: 11 } },
          ticks: { display: false, maxTicksLimit: 5 },
          suggestedMin: 0,
          suggestedMax: 100
        }
      }
    }
  });

  // Comparison table
  const tbody = document.getElementById('compare-table-body');
  tbody.innerHTML = selectedData.map((d, i) => `
    <tr>
      <td><div class="brand-name-cell"><div class="brand-avatar" style="background:${colors[i]}">${d.brand_name[0]}</div>${d.brand_name}</div></td>
      <td>${formatPrice(d.avg_price)}</td>
      <td><span class="rating-stars">${d.avg_rating}</span></td>
      <td>${formatNumber(d.total_reviews)}</td>
      <td>${formatNumber(d.total_followers)}</td>
      <td>${d.sku_count}</td>
      <td><span class="tag ${parseFloat(d.avg_growth) > 5 ? 'tag-green' : 'tag-blue'}">${formatPct(parseFloat(d.avg_growth))}</span></td>
    </tr>
  `).join('');
}
