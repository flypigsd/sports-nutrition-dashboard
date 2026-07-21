// ===== Trending Topics - Social Media Heat + Trend Lines =====

let trendingChart = null;
let velocityChart = null;

function renderTrendingTopics(data) {
  const { social, categories } = data;
  const trends = buildTrendData(social, categories);

  // Horizontal bar chart
  const top15 = trends.slice(0, 15);
  const ctxBar = document.getElementById('chart-trending-bars').getContext('2d');
  if (trendingChart) trendingChart.destroy();

  trendingChart = new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels: top15.map(t => t.name),
      datasets: [{
        label: '热度指数',
        data: top15.map(t => t.count),
        backgroundColor: top15.map((_, i) => {
          const colors = ['#f25c6e', '#f472b6', '#a78bfa', '#4d9fff', '#3ecf8e', '#fbbf24'];
          return colors[i % colors.length] + '99';
        }),
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: '#2a2d42' }, ticks: { color: '#6b6f80' } },
        y: { grid: { display: false }, ticks: { color: '#e8eaed', font: { size: 12 } } }
      }
    }
  });

  // Category growth chart
  const ctxLine = document.getElementById('chart-trending-line').getContext('2d');
  if (velocityChart) velocityChart.destroy();

  velocityChart = new Chart(ctxLine, {
    type: 'bar',
    data: {
      labels: categories.map(c => CATEGORY_NAMES[c.category_slug] || c.category_name),
      datasets: [{
        label: 'YoY 增长率 (%)',
        data: categories.map(c => c.yoy_growth_pct),
        backgroundColor: categories.map(c => {
          if (c.yoy_growth_pct >= 10) return 'rgba(62, 207, 142, 0.7)';
          if (c.yoy_growth_pct >= 5) return 'rgba(77, 159, 255, 0.7)';
          return 'rgba(156, 160, 176, 0.5)';
        }),
        borderRadius: 6,
        borderSkipped: false
      }, {
        label: '全球市场规模 ($B)',
        data: categories.map(c => c.estimated_global_market_size_usd_bn),
        backgroundColor: 'rgba(167, 139, 250, 0.25)',
        borderColor: '#a78bfa',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#9ca0b0', usePointStyle: true, padding: 20 }
        }
      },
      scales: {
        x: {
          grid: { color: '#2a2d42' },
          ticks: { color: '#6b6f80', maxRotation: 45, font: { size: 10 } }
        },
        y: {
          grid: { color: '#2a2d42' },
          ticks: { color: '#6b6f80' }
        }
      }
    }
  });

  // Topic tags
  document.getElementById('topic-tags-container').innerHTML = trends.slice(0, 18).map((t, i) => {
    const cls = i < 4 ? 'hot' : i < 8 ? 'trending' : '';
    return `<span class="topic-tag ${cls}">${t.name}</span>`;
  }).join('');
}
