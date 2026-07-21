// ===== Category Map - Market Share + Growth Visualization =====

let categoryChart = null;

function renderCategoryMap(data) {
  const { categories, products, brands } = data;

  const ctx = document.getElementById('chart-category-treemap').getContext('2d');
  if (categoryChart) categoryChart.destroy();

  // Doughnut chart for market share
  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categories.map(c => CATEGORY_NAMES[c.category_slug] || c.category_name),
      datasets: [{
        data: categories.map(c => c.estimated_global_market_size_usd_bn),
        backgroundColor: categories.map(c => {
          if (c.yoy_growth_pct >= 10) return '#3ecf8ecc';
          if (c.yoy_growth_pct >= 7) return '#4d9fffcc';
          if (c.yoy_growth_pct >= 5) return '#fbbf24cc';
          return '#6b6f80cc';
        }),
        borderColor: '#1a1d2e',
        borderWidth: 2,
        hoverBorderColor: '#e8eaed'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#9ca0b0',
            padding: 12,
            font: { size: 11 },
            generateLabels: function(chart) {
              const data = chart.data;
              return data.labels.map((label, i) => ({
                text: `${label}  $${data.datasets[0].data[i]}B`,
                fillStyle: data.datasets[0].backgroundColor[i],
                strokeStyle: data.datasets[0].backgroundColor[i],
                lineWidth: 0,
                hidden: false,
                index: i,
                fontColor: '#9ca0b0'
              }));
            }
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const cat = categories[ctx.dataIndex];
              return [
                `市场规模: $${cat.estimated_global_market_size_usd_bn}B`,
                `YoY增速: ${cat.yoy_growth_pct}%`,
                `趋势: ${cat.trend_direction === 'growing' ? '📈 增长' : cat.trend_direction === 'stable' ? '➡️ 稳定' : '📉 下滑'}`
              ];
            }
          }
        }
      }
    }
  });

  // Category detail table
  const tbody = document.getElementById('category-table-body');
  tbody.innerHTML = categories.map(c => {
    const productCount = products.filter(p => p.category === c.category_slug).length;
    const brandCount = c.top_brands.length;
    const jdScore = c.jd_presence_score;
    const jdBadge = jdScore === 'high' ? 'tag-green' : jdScore === 'medium' ? 'tag-orange' : jdScore === 'low' ? 'tag-red' : 'tag-red';
    const jdLabel = jdScore === 'high' ? '覆盖充分' : jdScore === 'medium' ? '部分覆盖' : jdScore === 'low' ? '覆盖不足' : '极少覆盖';
    return `
    <tr>
      <td><strong>${CATEGORY_NAMES[c.category_slug] || c.category_name}</strong></td>
      <td>$${c.estimated_global_market_size_usd_bn}B</td>
      <td><span class="tag ${c.yoy_growth_pct >= 10 ? 'tag-green' : c.yoy_growth_pct >= 5 ? 'tag-blue' : 'tag-orange'}">${formatPct(c.yoy_growth_pct)}</span></td>
      <td>${c.trending_ingredients.slice(0, 3).join(', ')}</td>
      <td>${brandCount} 品牌 · ${productCount} SKU</td>
      <td><span class="tag ${jdBadge}">${jdLabel}</span></td>
    </tr>
    `;
  }).join('');
}
