// ===== Overview Dashboard - KPI Cards + Top 10 Bar Chart =====

function renderOverview(data) {
  const { brands, products, channels, social, metadata } = data;

  // KPI cards
  const totalBrands = brands.length;
  const totalProducts = products.length;
  const activeChannels = channels.filter(c => c.status === 'active').length;
  const jdMissing = brands.filter(b => !b.jd_available).length;
  const totalSocialFollowers = social.reduce((sum, s) => sum + (s.follower_count || s.subscriber_count || 0), 0);

  document.getElementById('kpi-brands').textContent = totalBrands;
  document.getElementById('kpi-products').textContent = totalProducts;
  document.getElementById('kpi-channels').textContent = activeChannels;
  document.getElementById('kpi-jd-gap').textContent = jdMissing;
  document.getElementById('kpi-social').textContent = formatNumber(totalSocialFollowers);

  document.getElementById('kpi-jd-gap-pct').textContent = ((jdMissing / totalBrands) * 100).toFixed(0) + '%';
  document.getElementById('kpi-jd-gap-pct').className = 'kpi-change ' + (jdMissing / totalBrands > 0.6 ? 'down' : 'up');

  // Last update
  const lastRun = metadata.last_scrape_run ? new Date(metadata.last_scrape_run) : null;
  document.getElementById('header-last-update').textContent =
    lastRun ? `最后更新: ${lastRun.toLocaleDateString('zh-CN')} ${lastRun.toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'})}` : '最后更新: 暂无';

  const freshness = metadata.data_freshness || {};
  const latestDate = Object.values(freshness).filter(Boolean).sort().pop();
  const statusDot = document.getElementById('header-status-dot');
  if (!latestDate) {
    statusDot.className = 'status-dot error';
  } else {
    const daysAgo = (Date.now() - new Date(latestDate).getTime()) / 86400000;
    statusDot.className = 'status-dot' + (daysAgo > 3 ? ' stale' : '');
  }

  // Top 10 brands bar chart
  const scored = brands.map(b => ({
    name: b.brand_name,
    score: getCompositeScore(b, social, products),
    country: b.headquarters_country
  })).sort((a, b) => b.score - a.score).slice(0, 10);

  const ctx = document.getElementById('chart-top-brands').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: scored.map(b => b.name),
      datasets: [{
        label: '综合评分',
        data: scored.map(b => b.score),
        backgroundColor: scored.map((_, i) => {
          const alpha = 1 - i * 0.07;
          return `rgba(62, 207, 142, ${alpha})`;
        }),
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `综合评分: ${ctx.raw}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: '#2a2d42' },
          ticks: { color: '#6b6f80', font: { size: 11 } }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#e8eaed', font: { size: 12 } }
        }
      }
    }
  });

  // Channel status grid
  const sourceGrid = document.getElementById('source-grid');
  sourceGrid.innerHTML = channels.map(ch => `
    <div class="source-card">
      <div class="source-icon ${ch.status}">
        ${ch.type === 'social_media' ? '📱' : ch.type === 'specialty_online' ? '🛒' : '🏪'}
      </div>
      <div class="source-info">
        <div class="source-name">${ch.channel_name}</div>
        <div class="source-status-line">
          <span style="color:${ch.status === 'active' ? '#3ecf8e' : ch.status === 'limited' ? '#f5a623' : '#6b6f80'}">
            ${ch.status === 'active' ? '● 活跃' : ch.status === 'limited' ? '● 受限' : '● 手动'}
          </span>
          ${ch.products_tracked > 0 ? ` · ${ch.products_tracked} 商品追踪` : ''}
        </div>
        <div class="source-meta">
          难度: ${ch.scrape_difficulty === 'high' ? '🔴 高' : ch.scrape_difficulty === 'medium' ? '🟡 中' : ch.scrape_difficulty === 'low' ? '🟢 低' : '⚫ 极高'} ·
          更新: ${formatDate(ch.last_successful_scrape)}
        </div>
      </div>
    </div>
  `).join('');
}
