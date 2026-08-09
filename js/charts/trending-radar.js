// ===== Trending Radar - 12-Platform Real-time Search =====
// Calls friend's backend at localhost:18787

const RADAR_API = 'http://localhost:18787';
let radarState = {
  backendOnline: false,
  search: null,
  summary: null,
  content: [],
  creators: [],
  opportunities: [],
  activeTab: 'content',
  selectedId: null,
  loading: false
};

function renderTrendingRadar(data) {
  document.getElementById('radar-search-btn').disabled =false;
  setupRadarUI();
  checkBackend();
}

async function checkBackend() {
  const dot = document.getElementById('radar-status-dot');
  const text = document.getElementById('radar-status-text');
  const panel = document.getElementById('radar-search-panel');

  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 5000);
    const resp = await fetch(`${RADAR_API}/api/bootstrap`, { signal: ctrl.signal });
    if (resp.ok) {
      const payload = await resp.json();
      applyRadarPayload(payload);
      radarState.backendOnline = true;
      dot.className = 'radar-status-dot online';
      text.textContent = '后端已连接 · 12平台实时搜索可用';
      panel.style.opacity = '1';
      document.getElementById('radar-search-btn').disabled = false;
      renderRadarAll();
      return;
    }
  } catch (e) {
    // backend not reachable
  }
  radarState.backendOnline = false;
  dot.className = 'radar-status-dot offline';
  text.textContent = '后端未启动 · 双击"启动看板.bat"启动后端，然后刷新页面';
  panel.style.opacity = '1';
  document.getElementById('radar-search-btn').disabled = false;
}

function applyRadarPayload(payload) {
  radarState.search = payload.search;
  radarState.summary = payload.summary;
  radarState.content = (payload.content || []).filter(i => i.url && i.source_url_type !== 'sample');
  radarState.creators = (payload.creators || []).filter(i => i.url && i.source_url_type !== 'sample');
  radarState.opportunities = (payload.opportunities || []).filter(i => i.url && i.source_url_type !== 'sample');
  if (!['content','creators','opportunities'].includes(radarState.activeTab)) {
    radarState.activeTab = 'content';
  }
  // Auto-select first item
  const items = radarState[radarState.activeTab] || [];
  radarState.selectedId = items.length ? items[0].id : null;
}

function setupRadarUI() {
  document.getElementById('radar-search-form').addEventListener('submit', radarSearch);
  document.querySelectorAll('.radar-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      radarState.activeTab = tab.dataset.radarTab;
      const items = radarState[radarState.activeTab] || [];
      radarState.selectedId = items.length ? items[0].id : null;
      renderRadarAll();
    });
  });
}

async function radarSearch(e) {
  e.preventDefault();

  const query = document.getElementById('radar-query-input').value.trim();
  if (!query) { alert('请输入搜索关键词'); return; }

  const windowDays = parseInt(document.getElementById('radar-window-select').value);
  const markets = [...document.querySelectorAll('.radar-market-toggles input:checked')].map(cb => cb.value);

  if (!markets.length) { alert('请至少选择一个市场'); return; }

  radarState.loading = true;
  const btn = document.getElementById('radar-search-btn');
  btn.disabled = true;
  btn.textContent = '搜索中...';

  try {
    const createdResp = await fetch(`${RADAR_API}/api/trend-searches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, window_days: windowDays, markets })
    });

    if (!createdResp.ok) {
      throw new Error(`服务器返回 ${createdResp.status}`);
    }

    const created = await createdResp.json();
    const searchId = created.search.id;

    // Fetch rankings in parallel
    const [content, creators, opportunities] = await Promise.all([
      fetch(`${RADAR_API}/api/rankings/content?search_id=${searchId}`).then(r => r.json()),
      fetch(`${RADAR_API}/api/rankings/creators?search_id=${searchId}`).then(r => r.json()),
      fetch(`${RADAR_API}/api/rankings/opportunities?search_id=${searchId}`).then(r => r.json())
    ]);

    applyRadarPayload({
      search: created.search,
      summary: created.summary,
      content: content.items || [],
      creators: creators.items || [],
      opportunities: opportunities.items || []
    });

    radarState.backendOnline = true;
    checkBackend(); // refresh status dot
    renderRadarAll();
  } catch (err) {
    console.error('Radar search failed:', err);
    radarState.backendOnline = false;
    checkBackend();
    alert('搜索失败：无法连接到后端服务 (localhost:18787)\n\n请确认已双击"启动看板.bat"启动后端。');
  } finally {
    radarState.loading = false;
    btn.disabled = false;
    btn.textContent = '🔍 生成雷达';
  }
}

// ===== RENDER ALL =====

function renderRadarAll() {
  renderRadarMetrics();
  renderRadarNarrative();
  renderRadarTabs();
  renderRadarTable();
  renderRadarDetail();
}

function renderRadarMetrics() {
  const strip = document.getElementById('radar-metric-strip');
  if (!radarState.summary) { strip.innerHTML = ''; return; }

  const items = [
    { label: '内容入口', count: radarState.content.length, desc: '可直达帖子/视频' },
    { label: '达人入口', count: radarState.creators.length, desc: '可直达主页' },
    { label: '机会入口', count: radarState.opportunities.length, desc: '可验证来源' }
  ];

  strip.innerHTML = items.map(m => `
    <div class="radar-metric ${m.count ? '' : 'radar-metric-empty'}">
      <strong>${m.count}</strong>
      <span>${m.label} · ${m.desc}</span>
    </div>
  `).join('');
}

function renderRadarNarrative() {
  const content = radarState.content;
  const creators = radarState.creators;
  const opps = radarState.opportunities;
  const list = document.getElementById('radar-narrative-list');

  let html = '';
  if (content[0]) {
    html += `<div class="radar-insight-row"><span class="radar-insight-label">内容需求</span><div class="radar-insight-copy"><strong>${content.length} 条可打开内容</strong><span>先看 ${content[0].platform}：${escapeHtml(content[0].title)}</span></div></div>`;
  }
  if (creators[0]) {
    html += `<div class="radar-insight-row"><span class="radar-insight-label">达人验证</span><div class="radar-insight-copy"><strong>${creators.length} 个可打开主页</strong><span>先核对 ${creators[0].platform}：${escapeHtml(creators[0].author || creators[0].title)}</span></div></div>`;
  }
  if (opps[0]) {
    const priceText = opps[0].price ? `已抓到价格 $${Number(opps[0].price).toFixed(2)}` : '价格需点开确认';
    html += `<div class="radar-insight-row"><span class="radar-insight-label">商品机会</span><div class="radar-insight-copy"><strong>${opps.length} 个可打开商详</strong><span>先核对 ${opps[0].platform}：${escapeHtml((opps[0].title || '').replace('机会：',''))}</span></div><span class="radar-insight-note">${priceText}</span></div>`;
  }
  if (!html) {
    html = '<div class="radar-insight-row"><span class="radar-insight-label">等待搜索</span><div class="radar-insight-copy"><strong>输入关键词搜索</strong><span>搜索12个海外平台的实时趋势数据</span></div></div>';
  }
  list.innerHTML = html;

  // Tag cloud
  const tags = (radarState.summary?.top_tags || []).filter(t => t.tag && t.tag.trim() && t.tag.trim() !== '#').slice(0, 8);
  document.getElementById('radar-tag-cloud').innerHTML = tags.length
    ? tags.map(t => `<span class="radar-tag"><span>${escapeHtml(t.tag)}</span><strong>${t.count}</strong></span>`).join('')
    : '<span class="radar-tag radar-tag-empty">搜索后将展示关联线索</span>';
}

function renderRadarTabs() {
  document.querySelectorAll('.radar-tab').forEach(tab => {
    const key = tab.dataset.radarTab;
    const count = (radarState[key] || []).length;
    tab.textContent = `${tab.textContent.split('（')[0]}（${count}）`;
    tab.classList.toggle('active', key === radarState.activeTab);
  });
}

function renderRadarTable() {
  const items = radarState[radarState.activeTab] || [];
  const isContent = radarState.activeTab === 'content';
  const isCreator = radarState.activeTab === 'creators';
  document.getElementById('radar-ranking-head').innerHTML = `
    <tr>
      <th>#</th>
      <th>对象 / 入口</th>
      <th>平台 / 市场</th>
      <th>${isContent ? '播放量' : isCreator ? '主页状态' : '验证信号'}</th>
    </tr>
  `;

  if (!items.length) {
    document.getElementById('radar-ranking-body').innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:24px;">暂无结果 — 请搜索或检查后端服务状态</td></tr>`;
    return;
  }

  document.getElementById('radar-ranking-body').innerHTML = items.map((item, i) => {
    const metric = getRadarMetric(item);
    return `
      <tr class="radar-row ${radarState.selectedId === item.id ? 'radar-row-selected' : ''}" data-radar-id="${item.id}">
        <td><span class="radar-rank-idx">${i + 1}</span></td>
        <td>
          ${item.url ? `<a class="radar-title-link" href="${item.url}" target="_blank" rel="noreferrer" onclick="event.stopPropagation()">${escapeHtml(item.title)}</a>` : `<div class="radar-title">${escapeHtml(item.title)}</div>`}
          <div class="radar-sub">${escapeHtml(item.author || item.platform)} · ${sourceTargetText(item)}</div>
          ${item.url ? `<a class="radar-source-link" href="${item.url}" target="_blank" rel="noreferrer" onclick="event.stopPropagation()"><small>${urlPreview(item.url)}</small></a>` : ''}
        </td>
        <td>
          <div class="radar-platform">${item.platform}</div>
          <span class="radar-market-badge market-${(item.market || 'GLOBAL').toLowerCase()}">${item.market || 'GLOBAL'}</span>
        </td>
        <td>
          <div class="radar-metric-val">
            <strong>${metric.value}</strong>
            ${metric.note ? `<span>${metric.note}</span>` : ''}
          </div>
        </td>
      </tr>`;
  }).join('');

  // Click handlers
  document.querySelectorAll('#radar-ranking-body tr').forEach(row => {
    row.addEventListener('click', async (e) => {
      if (e.target.closest('a')) return;
      const id = row.dataset.radarId;
      radarState.selectedId = id;
      renderRadarTable();
      await fetchRadarDetail(id);
    });
  });
}

async function fetchRadarDetail(id) {
  const typeMap = { content: 'content', creators: 'creator', opportunities: 'opportunity' };
  const entityType = typeMap[radarState.activeTab];
  const searchId = radarState.search?.id || '';
  try {
    const resp = await fetch(`${RADAR_API}/api/entities/${entityType}/${id}?search_id=${searchId}`);
    if (resp.ok) {
      const data = await resp.json();
      renderRadarDetailContent(data.entity, data.related || []);
    }
  } catch (e) {
    console.error('Failed to fetch detail:', e);
  }
}

function renderRadarDetail() {
  const card = document.getElementById('radar-detail-card');
  const items = radarState[radarState.activeTab] || [];
  const item = items.find(i => i.id === radarState.selectedId);
  if (!item) { card.style.display = 'none'; return; }
  card.style.display = '';
  document.getElementById('radar-detail-title').textContent = '📌 ' + escapeHtml(item.title || '详情');
}

function renderRadarDetailContent(entity, related) {
  const content = document.getElementById('radar-detail-content');
  const evidence = getEvidenceEntries(entity);
  const missing = getMissingEntries(entity);

  content.innerHTML = `
    <div class="radar-detail-grid">
      <div class="radar-detail-section">
        <h4>已抓到的数据</h4>
        ${evidence.length ? evidence.map(e => `<div class="radar-evidence-row"><span>${e.label}</span><strong>${e.value}</strong>${e.note ? `<small>${e.note}</small>` : ''}</div>`).join('') : '<p style="color:var(--text-muted)">只拿到了可打开入口，暂无可展示的真实指标。</p>'}
      </div>
      <div class="radar-detail-section">
        <h4>待人工确认</h4>
        <ul class="radar-check-list">${missing.map(m => `<li>${m}</li>`).join('')}</ul>
      </div>
    </div>
    ${entity.url ? `<a class="btn btn-primary" href="${entity.url}" target="_blank" rel="noreferrer" style="display:inline-block;margin-top:12px;text-decoration:none;">🔗 打开原始页面</a>` : ''}
    ${related.length ? `<div style="margin-top:12px;"><h4 style="color:var(--text-primary);margin-bottom:8px;">相关入口 (${related.length})</h4>${related.slice(0,5).map(r => `<p style="margin:4px 0;font-size:12px;">${r.url ? `<a href="${r.url}" target="_blank" rel="noreferrer" style="color:var(--accent-green)">${escapeHtml(r.title)}</a>` : escapeHtml(r.title)} <span style="color:var(--text-muted)">${r.platform}</span></p>`).join('')}</div>` : ''}
  `;
}

// ===== HELPERS =====

function getRadarMetric(item) {
  if (item.entity_type === 'content') {
    const views = item.metrics?.views;
    if (views && item.platform === 'YouTube') return { value: `${formatNum(views)} 次播放`, note: '' };
    return { value: '播放量未抓到', note: '该平台未公开或未解析到' };
  }
  if (item.entity_type === 'creator') {
    return item.url ? { value: '主页可打开', note: '' } : { value: '待点开确认', note: '' };
  }
  if (item.price) return { value: `$${Number(item.price).toFixed(2)}`, note: '可打开商详核对' };
  if (item.url) return { value: '商详可打开', note: '价格需点开确认' };
  return { value: '待确认', note: '本轮未拿到可验证入口' };
}

function getEvidenceEntries(entity) {
  const m = entity.metrics || {};
  const entries = [];
  if (entity.entity_type === 'content') {
    if (m.views && entity.platform === 'YouTube') entries.push({ label: '播放量', value: `${formatNum(m.views)} 次播放`, note: '平台公开内容页' });
    if (m.comments > 0) entries.push({ label: '评论数', value: `${formatNum(m.comments)} 条` });
    if (m.likes > 0) entries.push({ label: '点赞数', value: `${formatNum(m.likes)} 次` });
  } else if (entity.entity_type === 'creator') {
    if (m.followers > 0) entries.push({ label: '粉丝量', value: `${formatNum(m.followers)} 粉丝`, note: '平台公开主页' });
    if (m.total_views > 0) entries.push({ label: '频道总播放', value: `${formatNum(m.total_views)} 次` });
  } else {
    if (entity.price) entries.push({ label: '价格', value: `$${Number(entity.price).toFixed(2)}`, note: '公开商品页解析' });
    if (entity.discount) entries.push({ label: '折扣', value: `${Math.round(entity.discount * 100)}%` });
    if (m.reviews > 0) entries.push({ label: '评价数', value: `${formatNum(m.reviews)} 条` });
    if (m.rating && !([4, 4.1, 4.2, 4.3].includes(Number(m.rating.toFixed(1))))) entries.push({ label: '评分', value: String(m.rating) });
    if (m.related_content > 0) entries.push({ label: '相关内容', value: `${formatNum(m.related_content)} 条` });
    if (m.related_creators > 0) entries.push({ label: '相关达人', value: `${formatNum(m.related_creators)} 个` });
  }
  return entries;
}

function getMissingEntries(entity) {
  const m = entity.metrics || {};
  const missing = [];
  if (!entity.url) missing.push('缺少可打开链接');
  if (entity.entity_type === 'content') {
    if (!(m.views && entity.platform === 'YouTube')) missing.push('播放量未抓到');
    if (!(m.comments > 0)) missing.push('评论数未抓到');
  } else if (entity.entity_type === 'creator') {
    if (!(m.followers > 0)) missing.push('粉丝量未抓到');
  } else {
    if (!entity.price) missing.push('价格未抓到');
    if (!(m.reviews > 0)) missing.push('评价数未抓到');
  }
  return missing.length ? missing : ['关键字段已抓到，建议点开原始页面复核'];
}

function sourceTargetText(entity) {
  if (entity.entity_type === 'content') return '内容详情';
  if (entity.entity_type === 'creator') return '达人主页';
  return '商品详情';
}

function urlPreview(url) {
  try { const u = new URL(url); return u.hostname + (u.pathname === '/' ? '' : u.pathname.substring(0, 30)); }
  catch { return ''; }
}

function formatNum(n) { return new Intl.NumberFormat('zh-CN').format(Math.round(Number(n || 0))); }

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
