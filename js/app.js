// ===== Sports Nutrition Dashboard - App Router & Init =====

window._dashboardData = null;

// Tab routing
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      // Update active states
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      panels.forEach(p => p.classList.remove('active'));
      const panel = document.getElementById('panel-' + target);
      if (panel) panel.classList.add('active');

      // Update URL hash
      window.location.hash = target;

      // Lazy render on first visit
      if (target === 'overview' && !tab._rendered) { tab._rendered = true; renderOverview(window._dashboardData); }
      if (target === 'brands' && !tab._rendered) { tab._rendered = true; renderBrandRankings(window._dashboardData); }
      if (target === 'radar' && !tab._rendered) { tab._rendered = true; renderTrendingRadar(window._dashboardData); }
      if (target === 'compare' && !tab._rendered) { tab._rendered = true; renderCompetitorCompare(window._dashboardData); }
      if (target === 'trending' && !tab._rendered) { tab._rendered = true; renderTrendingTopics(window._dashboardData); }
      if (target === 'category' && !tab._rendered) { tab._rendered = true; renderCategoryMap(window._dashboardData); }
      if (target === 'sources' && !tab._rendered) { tab._rendered = true; renderSourcesDetail(window._dashboardData); }

      // Resize charts if needed
      window.dispatchEvent(new Event('resize'));
    });
  });

  // Handle initial hash
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    const tab = document.querySelector(`.tab-btn[data-tab="${hash}"]`);
    if (tab) tab.click();
    else document.querySelector('.tab-btn[data-tab="overview"]').click();
  } else {
    document.querySelector('.tab-btn[data-tab="overview"]').click();
  }
}

// Main init
async function initDashboard() {
  const loadingEl = document.getElementById('loading-overlay');
  if (loadingEl) loadingEl.style.display = 'flex';

  const data = await loadAllData();
  window._dashboardData = data;

  if (loadingEl) loadingEl.style.display = 'none';

  initTabs();
}

// Start on DOM ready
document.addEventListener('DOMContentLoaded', initDashboard);

// ===== Sources Detail Tab =====
function renderSourcesDetail(data) {
  const { channels, metadata } = data;
  const grid = document.getElementById('sources-full-grid');
  if (!grid) return;

  document.getElementById('sources-count-badge').textContent = channels.length + ' 渠道';

  grid.innerHTML = channels.map(ch => {
    const freshness = metadata.data_freshness || {};
    const lastUpdate = freshness[ch.channel_slug] || ch.last_successful_scrape;
    const daysAgo = lastUpdate ? Math.round((Date.now() - new Date(lastUpdate).getTime()) / 86400000) : null;

    return `
    <div class="source-card">
      <div class="source-icon ${ch.status}">
        ${ch.type === 'social_media' ? '📱' : ch.type === 'specialty_online' ? '🛒' : ch.type === 'membership_warehouse' ? '🏬' : '🏪'}
      </div>
      <div class="source-info">
        <div class="source-name">${ch.channel_name}</div>
        <div class="source-status-line">
          <span style="color:${ch.status === 'active' ? '#3ecf8e' : ch.status === 'limited' ? '#f5a623' : '#6b6f80'}">
            ${ch.status === 'active' ? '● 活跃' : ch.status === 'limited' ? '● 受限' : '● 手动'}
          </span>
          · ${ch.region === 'north_america' ? '北美' : ch.region === 'europe' ? '欧洲' : ch.region === 'global' ? '全球' : ch.region}
          · ${ch.type === 'mass_retail_online' ? '综合电商' : ch.type === 'specialty_online' ? '垂直电商' : ch.type === 'social_media' ? '社交媒体' : ch.type === 'specialty_retail' ? '专业零售' : ch.type === 'vertical_specialty' ? '垂直专业' : ch.type}
        </div>
        ${ch.products_tracked > 0 ? `<div class="source-status-line">追踪商品: <strong>${ch.products_tracked}</strong></div>` : ''}
        <div class="source-meta">
          爬取难度: ${ch.scrape_difficulty === 'very-high' ? '⚫ 极高' : ch.scrape_difficulty === 'high' ? '🔴 高' : ch.scrape_difficulty === 'medium' ? '🟡 中' : '🟢 低'} ·
          方式: ${ch.scrape_method === 'playwright_stealth' ? 'Playwright自动化' : ch.scrape_method === 'official_api' ? '官方API' : '手动录入'} ·
          更新: ${lastUpdate ? formatDate(lastUpdate) + (daysAgo !== null ? ` (${daysAgo}天前)` : '') : '暂无'}
        </div>
        ${ch.notes ? `<div class="source-meta" style="margin-top:4px;color:var(--text-secondary)">📝 ${ch.notes}</div>` : ''}
      </div>
    </div>
    `;
  }).join('');
}
