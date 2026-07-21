// ===== Brand Rankings - Sortable Table + Expandable Detail =====

let brandRankingsData = [];
let sortColumn = 'global_rank';
let sortAsc = true;

function renderBrandRankings(data) {
  const { brands, products, social } = data;

  brandRankingsData = brands.map(b => {
    const brandProducts = getProductsByBrand(products, b.brand_slug);
    const brandSocial = getSocialForBrand(social, b.brand_slug);
    const totalFollowers = brandSocial.reduce((s, s2) => s + (s2.follower_count || s2.subscriber_count || 0), 0);

    // Best rank across channels
    const bestRank = Math.min(...brandProducts.flatMap(p =>
      Object.values(p.channel_presence || {}).map(c => c.bestseller_rank || c.bestseller_position).filter(Boolean)
    ), Infinity);
    const bestChannel = brandProducts.flatMap(p =>
      Object.entries(p.channel_presence || {}).filter(([_, c]) =>
        (c.bestseller_rank || c.bestseller_position || Infinity) === bestRank
      ).map(([ch, _]) => ch)
    )[0] || '';

    return {
      ...b,
      product_count: brandProducts.length,
      total_followers: totalFollowers,
      best_rank: bestRank === Infinity ? null : bestRank,
      best_channel: bestChannel,
      composite_score: getCompositeScore(b, social, products),
      products: brandProducts,
      social: brandSocial
    };
  });

  const categoryFilter = document.getElementById('brand-category-filter');
  const cats = [...new Set(brands.flatMap(b => b.primary_categories))];
  categoryFilter.innerHTML = '<option value="all">全部品类</option>' +
    cats.map(c => `<option value="${c}">${CATEGORY_NAMES[c] || c}</option>`).join('');

  const regionFilter = document.getElementById('brand-region-filter');
  const regions = { 'north_america': '北美', 'europe': '欧洲', 'anz': '澳新', 'global': '全球' };
  regionFilter.innerHTML = '<option value="all">全部区域</option>' +
    Object.entries(regions).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');

  categoryFilter.onchange = () => renderBrandTable();
  regionFilter.onchange = () => renderBrandTable();
  document.getElementById('brand-search').oninput = () => renderBrandTable();

  sortColumn = 'global_rank';
  sortAsc = true;
  renderBrandTable();
}

function getRegion(country) {
  if (['US', 'CA'].includes(country)) return 'north_america';
  if (['UK', 'DE', 'PT', 'SE'].includes(country)) return 'europe';
  if (['AU', 'NZ'].includes(country)) return 'anz';
  return 'global';
}

function renderBrandTable() {
  const categoryFilter = document.getElementById('brand-category-filter').value;
  const regionFilter = document.getElementById('brand-region-filter').value;
  const search = document.getElementById('brand-search').value.toLowerCase();

  let filtered = brandRankingsData;
  if (categoryFilter !== 'all') filtered = filtered.filter(b => b.primary_categories.includes(categoryFilter));
  if (regionFilter !== 'all') filtered = filtered.filter(b => getRegion(b.headquarters_country) === regionFilter);
  if (search) filtered = filtered.filter(b =>
    b.brand_name.toLowerCase().includes(search) ||
    b.parent_company.toLowerCase().includes(search)
  );

  filtered.sort((a, b) => {
    let va = a[sortColumn];
    let vb = b[sortColumn];
    if (va == null) va = sortAsc ? Infinity : -Infinity;
    if (vb == null) vb = sortAsc ? Infinity : -Infinity;
    if (typeof va === 'string') {
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return sortAsc ? va - vb : vb - va;
  });

  const tbody = document.getElementById('brand-table-body');
  tbody.innerHTML = filtered.map(b => `
    <tr onclick="toggleBrandExpand('${b.brand_slug}', this)" data-brand="${b.brand_slug}">
      <td>#${b.global_rank || 'N/A'}</td>
      <td>
        <div class="brand-name-cell">
          <div class="brand-avatar">${b.brand_name[0]}</div>
          <div>
            <div style="font-weight:600">${b.brand_name}</div>
            <div style="font-size:11px;color:var(--text-muted)">${b.parent_company}</div>
          </div>
        </div>
      </td>
      <td>${COUNTRY_FLAGS[b.headquarters_country] || ''} ${b.headquarters_country}</td>
      <td>${b.primary_categories.map(c => CATEGORY_NAMES[c] || c).join(', ')}</td>
      <td>${b.best_rank ? '#' + b.best_rank : 'N/A'}</td>
      <td>${formatNumber(b.total_followers)}</td>
      <td><span class="tag tag-green">${b.composite_score}</span></td>
      <td>${b.jd_available ? '<span class="tag tag-green">✅ 已上架</span>' : '<span class="tag tag-red">❌ 未引入</span>'}</td>
    </tr>
    <tr class="expand-row" id="expand-${b.brand_slug}">
      <td colspan="8">
        <div class="expand-detail">
          <div>
            <div class="expand-item-label">成立年份</div>
            <div class="expand-item-value">${b.founded_year}</div>
          </div>
          <div>
            <div class="expand-item-label">旗舰产品</div>
            <div class="expand-item-value">${b.flagship_product}</div>
          </div>
          <div>
            <div class="expand-item-label">追踪商品数</div>
            <div class="expand-item-value">${b.product_count} SKU</div>
          </div>
          <div>
            <div class="expand-item-label">最佳渠道排名</div>
            <div class="expand-item-value">${b.best_rank ? '#' + b.best_rank + ' (' + b.best_channel + ')' : 'N/A'}</div>
          </div>
          <div>
            <div class="expand-item-label">京东状态</div>
            <div class="expand-item-value">${b.jd_available ? '✅ 已上架' : '❌ 未引入'}</div>
          </div>
          <div>
            <div class="expand-item-label">天猫状态</div>
            <div class="expand-item-value">${b.tmall_available ? '✅ 已上架' : '❌ 未引入'}</div>
          </div>
          <div>
            <div class="expand-item-label">社媒渠道数</div>
            <div class="expand-item-value">${b.social.length} 平台追踪中</div>
          </div>
          <div>
            <div class="expand-item-label">竞品集合</div>
            <div class="expand-item-value">${b.competitor_set.slice(0, 4).join(', ')}</div>
          </div>
          <div style="grid-column:1/-1">
            <div class="expand-item-label">备注</div>
            <div class="expand-item-value" style="color:var(--text-secondary)">${b.notes}</div>
          </div>
        </div>
      </td>
    </tr>
  `).join('');

  // Update sort indicators
  document.querySelectorAll('#brand-table th[data-sort]').forEach(th => {
    const col = th.dataset.sort;
    th.querySelector('.sort-arrow').textContent = col === sortColumn ? (sortAsc ? ' ▲' : ' ▼') : '';
  });
}

function toggleBrandExpand(slug, row) {
  const expandRow = document.getElementById('expand-' + slug);
  const isOpen = expandRow.classList.contains('show');
  document.querySelectorAll('.expand-row.show').forEach(r => r.classList.remove('show'));
  if (!isOpen) {
    expandRow.classList.add('show');
  }
}

// Table header click handler
document.addEventListener('click', function(e) {
  const th = e.target.closest('#brand-table th[data-sort]');
  if (!th) return;
  const col = th.dataset.sort;
  if (sortColumn === col) {
    sortAsc = !sortAsc;
  } else {
    sortColumn = col;
    sortAsc = true;
  }
  renderBrandTable();
});
