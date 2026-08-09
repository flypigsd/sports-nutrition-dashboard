// ===== Trending Radar - 12-Platform Real-time Search =====
// Calls friend's backend at localhost:18787

var RADAR_API = 'http://localhost:18787';
var radarState = {
  backendOnline: false,
  search: null,
  summary: null,
  content: [],
  creators: [],
  opportunities: [],
  activeTab: 'content',
  selectedId: null
};

function renderTrendingRadar(data) {
  setupRadarUI();
  checkBackend();
}

function setupRadarUI() {
  var btn = document.getElementById('radar-search-btn');
  if (btn) {
    btn.disabled = false;
    btn.onclick = radarSearch;
  }

  var tabs = document.querySelectorAll('.radar-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function() {
      radarState.activeTab = this.dataset.radarTab;
      var items = radarState[radarState.activeTab] || [];
      radarState.selectedId = items.length ? items[0].id : null;
      renderRadarAll();
    });
  }
}

async function checkBackend() {
  var dot = document.getElementById('radar-status-dot');
  var text = document.getElementById('radar-status-text');
  var panel = document.getElementById('radar-search-panel');
  if (!dot || !text) return;

  try {
    var ctrl = new AbortController();
    setTimeout(function() { ctrl.abort(); }, 5000);
    var resp = await fetch(RADAR_API + '/api/bootstrap', { signal: ctrl.signal });
    if (resp.ok) {
      var payload = await resp.json();
      applyRadarPayload(payload);
      radarState.backendOnline = true;
      dot.className = 'radar-status-dot online';
      text.textContent = '后端已连接 · 12平台实时搜索可用';
      if (panel) panel.style.opacity = '1';
      renderRadarAll();
      return;
    }
  } catch (e) {}

  radarState.backendOnline = false;
  dot.className = 'radar-status-dot offline';
  text.textContent = '后端未启动 · 双击启动看板.bat启动后端后刷新页面';
  if (panel) panel.style.opacity = '1';
}

function applyRadarPayload(payload) {
  radarState.search = payload.search;
  radarState.summary = payload.summary;
  radarState.content = (payload.content || []).filter(function(i) { return i.url && i.source_url_type !== 'sample'; });
  radarState.creators = (payload.creators || []).filter(function(i) { return i.url && i.source_url_type !== 'sample'; });
  radarState.opportunities = (payload.opportunities || []).filter(function(i) { return i.url && i.source_url_type !== 'sample'; });
  var keys = ['content','creators','opportunities'];
  if (keys.indexOf(radarState.activeTab) === -1) radarState.activeTab = 'content';
  var items = radarState[radarState.activeTab] || [];
  radarState.selectedId = items.length ? items[0].id : null;
}

async function radarSearch() {
  var queryEl = document.getElementById('radar-query-input');
  var query = queryEl ? queryEl.value.trim() : '';
  if (!query) { alert('请输入搜索关键词'); return; }

  var markets = [];
  var checked = document.querySelectorAll('.radar-market-toggles input:checked');
  for (var i = 0; i < checked.length; i++) markets.push(checked[i].value);
  if (!markets.length) { alert('请至少选择一个市场'); return; }

  var windowEl = document.getElementById('radar-window-select');
  var windowDays = windowEl ? parseInt(windowEl.value) : 30;

  var btn = document.getElementById('radar-search-btn');
  if (!btn) return;
  btn.disabled = true;
  btn.textContent = '搜索中...';

  try {
    var createdResp = await fetch(RADAR_API + '/api/trend-searches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query, window_days: windowDays, markets: markets })
    });

    if (!createdResp.ok) {
      var errMsg = '服务器返回 ' + createdResp.status;
      if (createdResp.status === 0) errMsg = '无法连接后端 - 请确认已启动看板.bat';
      alert('搜索失败：' + errMsg);
      btn.disabled = false;
      btn.textContent = '🔍 生成雷达';
      return;
    }

    var created = await createdResp.json();
    var searchId = created.search.id;

    var results = await Promise.all([
      fetch(RADAR_API + '/api/rankings/content?search_id=' + searchId).then(function(r) { return r.json(); }),
      fetch(RADAR_API + '/api/rankings/creators?search_id=' + searchId).then(function(r) { return r.json(); }),
      fetch(RADAR_API + '/api/rankings/opportunities?search_id=' + searchId).then(function(r) { return r.json(); })
    ]);

    applyRadarPayload({
      search: created.search,
      summary: created.summary,
      content: results[0].items || [],
      creators: results[1].items || [],
      opportunities: results[2].items || []
    });

    radarState.backendOnline = true;
    checkBackend();
    renderRadarAll();
  } catch (err) {
    console.error('Radar error:', err);
    alert('搜索失败：无法连接后端服务 (localhost:18787)\n\n请确认已双击启动看板.bat启动后端。');
    radarState.backendOnline = false;
    checkBackend();
  }

  btn.disabled = false;
  btn.textContent = '🔍 生成雷达';
}

// ===== RENDER =====

function renderRadarAll() {
  renderRadarMetrics();
  renderRadarNarrative();
  renderRadarTabs();
  renderRadarTable();
  renderRadarDetail();
}

function renderRadarMetrics() {
  var strip = document.getElementById('radar-metric-strip');
  if (!strip) return;
  if (!radarState.summary) { strip.innerHTML = ''; return; }
  var items = [
    { label: '内容入口', count: radarState.content.length, desc: '可直达帖子/视频' },
    { label: '达人入口', count: radarState.creators.length, desc: '可直达主页' },
    { label: '机会入口', count: radarState.opportunities.length, desc: '可验证来源' }
  ];
  strip.innerHTML = items.map(function(m) {
    return '<div class="radar-metric' + (m.count ? '' : ' radar-metric-empty') + '"><strong>' + m.count + '</strong><span>' + m.label + ' · ' + m.desc + '</span></div>';
  }).join('');
}

function renderRadarNarrative() {
  var list = document.getElementById('radar-narrative-list');
  if (!list) return;
  var content = radarState.content, creators = radarState.creators, opps = radarState.opportunities;
  var html = '';
  if (content[0]) {
    html += '<div class="radar-insight-row"><span class="radar-insight-label">内容需求</span><div class="radar-insight-copy"><strong>' + content.length + ' 条可打开内容</strong><span>先看 ' + esc(content[0].platform) + '：' + esc(content[0].title) + '</span></div></div>';
  }
  if (creators[0]) {
    html += '<div class="radar-insight-row"><span class="radar-insight-label">达人验证</span><div class="radar-insight-copy"><strong>' + creators.length + ' 个可打开主页</strong><span>先核对 ' + esc(creators[0].platform) + '：' + esc(creators[0].author || creators[0].title) + '</span></div></div>';
  }
  if (opps[0]) {
    var pt = opps[0].price ? '已抓到价格 $' + Number(opps[0].price).toFixed(2) : '价格需点开确认';
    html += '<div class="radar-insight-row"><span class="radar-insight-label">商品机会</span><div class="radar-insight-copy"><strong>' + opps.length + ' 个可打开商详</strong><span>先核对 ' + esc(opps[0].platform) + '：' + esc((opps[0].title || '').replace('机会：','')) + '</span></div><span class="radar-insight-note">' + pt + '</span></div>';
  }
  if (!html) {
    html = '<div class="radar-insight-row"><span class="radar-insight-label">等待搜索</span><div class="radar-insight-copy"><strong>输入关键词搜索</strong><span>搜索12个海外平台的实时趋势数据</span></div></div>';
  }
  list.innerHTML = html;

  var tagCloud = document.getElementById('radar-tag-cloud');
  if (!tagCloud) return;
  var tags = (radarState.summary && radarState.summary.top_tags || []).filter(function(t) { return t.tag && t.tag.trim() && t.tag.trim() !== '#'; }).slice(0, 8);
  tagCloud.innerHTML = tags.length
    ? tags.map(function(t) { return '<span class="radar-tag"><span>' + esc(t.tag) + '</span><strong>' + t.count + '</strong></span>'; }).join('')
    : '<span class="radar-tag radar-tag-empty">搜索后将展示关联线索</span>';
}

function renderRadarTabs() {
  var tabs = document.querySelectorAll('.radar-tab');
  for (var i = 0; i < tabs.length; i++) {
    var key = tabs[i].dataset.radarTab;
    var count = (radarState[key] || []).length;
    var label = tabs[i].textContent.split('（')[0];
    tabs[i].textContent = label + '（' + count + '）';
    tabs[i].classList.toggle('active', key === radarState.activeTab);
  }
}

function renderRadarTable() {
  var items = radarState[radarState.activeTab] || [];
  var head = document.getElementById('radar-ranking-head');
  var body = document.getElementById('radar-ranking-body');
  if (!head || !body) return;

  var isContent = radarState.activeTab === 'content';
  var isCreator = radarState.activeTab === 'creators';
  head.innerHTML = '<tr><th>#</th><th>对象/入口</th><th>平台/市场</th><th>' + (isContent ? '播放量' : isCreator ? '主页状态' : '验证信号') + '</th></tr>';

  if (!items.length) {
    body.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:24px;">暂无结果 — 请搜索或检查后端服务</td></tr>';
    return;
  }

  body.innerHTML = items.map(function(item, i) {
    var m = getRadarMetric(item);
    var cls = radarState.selectedId === item.id ? ' radar-row-selected' : '';
    return '<tr class="radar-row' + cls + '" data-radar-id="' + item.id + '">' +
      '<td><span class="radar-rank-idx">' + (i + 1) + '</span></td>' +
      '<td>' +
        (item.url ? '<a class="radar-title-link" href="' + item.url + '" target="_blank" rel="noreferrer" onclick="event.stopPropagation()">' + esc(item.title) + '</a>' : '<div class="radar-title">' + esc(item.title) + '</div>') +
        '<div class="radar-sub">' + esc(item.author || item.platform) + ' · ' + sourceTargetText(item) + '</div>' +
        (item.url ? '<a class="radar-source-link" href="' + item.url + '" target="_blank" rel="noreferrer" onclick="event.stopPropagation()"><small>' + urlPreview(item.url) + '</small></a>' : '') +
      '</td>' +
      '<td><div class="radar-platform">' + item.platform + '</div><span class="radar-market-badge">' + (item.market || 'GLOBAL') + '</span></td>' +
      '<td><div class="radar-metric-val"><strong>' + m.value + '</strong>' + (m.note ? '<span>' + m.note + '</span>' : '') + '</div></td>' +
      '</tr>';
  }).join('');

  var rows = document.querySelectorAll('#radar-ranking-body tr');
  for (var r = 0; r < rows.length; r++) {
    rows[r].addEventListener('click', function(e) {
      if (e.target.closest('a')) return;
      radarState.selectedId = this.dataset.radarId;
      renderRadarTable();
      fetchRadarDetail(this.dataset.radarId);
    });
  }
}

async function fetchRadarDetail(id) {
  var typeMap = { content: 'content', creators: 'creator', opportunities: 'opportunity' };
  var entityType = typeMap[radarState.activeTab];
  var searchId = radarState.search ? radarState.search.id : '';
  try {
    var resp = await fetch(RADAR_API + '/api/entities/' + entityType + '/' + id + '?search_id=' + searchId);
    if (resp.ok) {
      var data = await resp.json();
      renderRadarDetailContent(data.entity, data.related || []);
    }
  } catch (e) {}
}

function renderRadarDetail() {
  var card = document.getElementById('radar-detail-card');
  if (!card) return;
  var items = radarState[radarState.activeTab] || [];
  var item = items.find(function(i) { return i.id === radarState.selectedId; });
  if (!item) { card.style.display = 'none'; return; }
  card.style.display = '';
  var titleEl = document.getElementById('radar-detail-title');
  if (titleEl) titleEl.textContent = '📌 ' + esc(item.title || '详情');
}

function renderRadarDetailContent(entity, related) {
  var el = document.getElementById('radar-detail-content');
  if (!el) return;
  var evidence = getEvidenceEntries(entity);
  var missing = getMissingEntries(entity);
  el.innerHTML = '' +
    '<div class="radar-detail-grid">' +
    '<div class="radar-detail-section"><h4>已抓到的数据</h4>' +
      (evidence.length ? evidence.map(function(e) { return '<div class="radar-evidence-row"><span>' + e.label + '</span><strong>' + e.value + '</strong>' + (e.note ? '<small>' + e.note + '</small>' : '') + '</div>'; }).join('') : '<p style="color:var(--text-muted)">只拿到了可打开入口，暂无可展示的真实指标。</p>') +
    '</div>' +
    '<div class="radar-detail-section"><h4>待人工确认</h4>' +
      '<ul class="radar-check-list">' + missing.map(function(m) { return '<li>' + m + '</li>'; }).join('') + '</ul>' +
    '</div></div>' +
    (entity.url ? '<a href="' + entity.url + '" target="_blank" rel="noreferrer" style="display:inline-block;margin-top:12px;color:var(--accent-green);text-decoration:none;">🔗 打开原始页面</a>' : '') +
    (related.length ? '<div style="margin-top:12px;"><h4 style="color:var(--text-primary);margin-bottom:8px;">相关入口 (' + related.length + ')</h4>' + related.slice(0,5).map(function(r) { return '<p style="margin:4px 0;font-size:12px;">' + (r.url ? '<a href="' + r.url + '" target="_blank" rel="noreferrer" style="color:var(--accent-green)">' + esc(r.title) + '</a>' : esc(r.title)) + ' <span style="color:var(--text-muted)">' + r.platform + '</span></p>'; }).join('') + '</div>' : '');
}

// ===== HELPERS =====

function getRadarMetric(item) {
  if (item.entity_type === 'content') {
    var views = item.metrics && item.metrics.views;
    if (views && item.platform === 'YouTube') return { value: fmtNum(views) + ' 次播放', note: '' };
    return { value: '播放量未抓到', note: '' };
  }
  if (item.entity_type === 'creator') {
    return item.url ? { value: '主页可打开', note: '' } : { value: '待点开确认', note: '' };
  }
  if (item.price) return { value: '$' + Number(item.price).toFixed(2), note: '可打开商详核对' };
  if (item.url) return { value: '商详可打开', note: '价格需点开确认' };
  return { value: '待确认', note: '' };
}

function getEvidenceEntries(entity) {
  var m = entity.metrics || {}, entries = [];
  if (entity.entity_type === 'content') {
    if (m.views && entity.platform === 'YouTube') entries.push({ label: '播放量', value: fmtNum(m.views) + ' 次播放', note: '平台公开内容页' });
    if (m.comments > 0) entries.push({ label: '评论数', value: fmtNum(m.comments) + ' 条' });
    if (m.likes > 0) entries.push({ label: '点赞数', value: fmtNum(m.likes) + ' 次' });
  } else if (entity.entity_type === 'creator') {
    if (m.followers > 0) entries.push({ label: '粉丝量', value: fmtNum(m.followers) + ' 粉丝', note: '平台公开主页' });
    if (m.total_views > 0) entries.push({ label: '频道总播放', value: fmtNum(m.total_views) + ' 次' });
  } else {
    if (entity.price) entries.push({ label: '价格', value: '$' + Number(entity.price).toFixed(2), note: '公开商品页解析' });
    if (entity.discount) entries.push({ label: '折扣', value: Math.round(entity.discount * 100) + '%' });
    if (m.reviews > 0) entries.push({ label: '评价数', value: fmtNum(m.reviews) + ' 条' });
    if (m.rating && [4,4.1,4.2,4.3].indexOf(Number(m.rating.toFixed(1))) === -1) entries.push({ label: '评分', value: String(m.rating) });
    if (m.related_content > 0) entries.push({ label: '相关内容', value: fmtNum(m.related_content) + ' 条' });
    if (m.related_creators > 0) entries.push({ label: '相关达人', value: fmtNum(m.related_creators) + ' 个' });
  }
  return entries;
}

function getMissingEntries(entity) {
  var m = entity.metrics || {}, missing = [];
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
  try { var u = new URL(url); return u.hostname + (u.pathname === '/' ? '' : u.pathname.substring(0, 30)); }
  catch (e) { return ''; }
}

function fmtNum(n) { return new Intl.NumberFormat('zh-CN').format(Math.round(Number(n || 0))); }

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
