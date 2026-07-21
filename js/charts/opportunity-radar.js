// ===== Opportunity Radar - JD.com Gap Analysis =====

let opportunityChart = null;
let opportunityData = [];

function renderOpportunityRadar(data) {
  const { brands, products, social } = data;
  opportunityData = buildOpportunityData(brands, products, social);

  const categoryFilter = document.getElementById('opportunity-category-filter');
  categoryFilter.innerHTML = '<option value="all">全部品类</option>' +
    Object.entries(CATEGORY_NAMES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');

  categoryFilter.onchange = () => refreshOpportunityChart();

  refreshOpportunityChart();
}

function refreshOpportunityChart() {
  const categoryFilter = document.getElementById('opportunity-category-filter').value;
  let filtered = opportunityData;
  if (categoryFilter !== 'all') {
    filtered = opportunityData.filter(d => d.categories.includes(categoryFilter));
  }

  const points = filtered.map(d => ({
    x: d.avg_sales_rank,
    y: Math.log10(d.social_followers + 1),
    r: Math.min(Math.max(Math.log10(d.total_reviews + 1) * 5, 4), 30),
    brand_name: d.brand_name,
    country: d.country,
    jd_available: d.jd_available,
    tmall_available: d.tmall_available,
    followers: formatNumber(d.social_followers),
    reviews: formatNumber(d.total_reviews),
    rank: d.global_rank
  }));

  const ctx = document.getElementById('chart-opportunity-radar').getContext('2d');
  if (opportunityChart) opportunityChart.destroy();

  opportunityChart = new Chart(ctx, {
    type: 'bubble',
    data: {
      datasets: [{
        label: '未上架京东',
        data: points.filter(p => !p.jd_available),
        backgroundColor: 'rgba(242, 92, 110, 0.55)',
        borderColor: '#f25c6e',
        borderWidth: 1
      }, {
        label: '已上架京东',
        data: points.filter(p => p.jd_available),
        backgroundColor: 'rgba(62, 207, 142, 0.45)',
        borderColor: '#3ecf8e',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: '全球销售排名 (越低越好)', color: '#9ca0b0' },
          reverse: true,
          grid: { color: '#2a2d42' },
          ticks: { color: '#6b6f80' }
        },
        y: {
          title: { display: true, text: '社媒热度 (log 粉丝数)', color: '#9ca0b0' },
          grid: { color: '#2a2d42' },
          ticks: { color: '#6b6f80' }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => {
              const p = ctx.raw;
              return [
                `${p.brand_name} (${COUNTRY_FLAGS[p.country] || ''}${p.country})`,
                `全球排名: #${p.rank}`,
                `社媒粉丝: ${p.followers}`,
                `总评价数: ${p.reviews}`,
                `京东: ${p.jd_available ? '✅ 已上架' : '❌ 未上架'}`,
                `天猫: ${p.tmall_available ? '✅ 已上架' : '❌ 未上架'}`
              ];
            }
          }
        }
      }
    }
  });

  // Opportunity table
  const gaps = points.filter(p => !p.jd_available).sort((a, b) => b.r - a.r).slice(0, 15);
  const tbody = document.getElementById('opportunity-table-body');
  tbody.innerHTML = gaps.map((g, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><div class="brand-name-cell"><div class="brand-avatar">${g.brand_name[0]}</div>${g.brand_name}</div></td>
      <td>${COUNTRY_FLAGS[g.country] || ''} ${g.country}</td>
      <td>#${g.rank || 'N/A'}</td>
      <td>${g.followers}</td>
      <td>${g.reviews}</td>
      <td><span class="tag tag-red">未引入</span></td>
    </tr>
  `).join('');
}
