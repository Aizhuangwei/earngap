/**
 * main.js — EarnGap v2 全量动态渲染引擎
 * 所有数据从 data/opportunities.json 读取
 */

// ====== 工具 ======
const fmtNum = n => n.toLocaleString('zh-CN');
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const fmtTime = d => d.toTimeString().slice(0, 8);

const AD_ITEMS = [
  { icon: 'fa-rocket', title_cn: '烁腾云控 Pro', title_en: 'EarnGap Pro', sub_cn: 'AI 驱动信息差引擎 · 立即体验', sub_en: 'AI-powered gap engine · Try now' },
  { icon: 'fa-robot', title_cn: 'AI 机会扫描器', title_en: 'AI Scanner', sub_cn: '7×24h 自动化扫描全球信号', sub_en: '24/7 automated global scanning' },
  { icon: 'fa-envelope', title_cn: 'Alpha 简报', title_en: 'Alpha Brief', sub_cn: '每日精选信息差机会推送', sub_en: 'Daily curated gap opportunities' },
  { icon: 'fa-chart-line', title_cn: '企业情报平台', title_en: 'Enterprise Intel', sub_cn: '定制化竞争情报解决方案', sub_en: 'Custom competitive intel solutions' },
  { icon: 'fa-users', title_cn: '烁腾社区', title_en: 'Gap Community', sub_cn: '与 1000+ 套利者交流情报', sub_en: 'Connect with 1000+ arbitrageurs' },
  { icon: 'fa-book', title_cn: '套利方法论', title_en: 'Arb Methodology', sub_cn: '系统化信息差套利课程', sub_en: 'Systematic gap trading courses' },
  { icon: 'fa-globe', title_cn: '跨境套利指南', title_en: 'Cross-border Guide', sub_cn: '跨市场价差实时追踪与分析', sub_en: 'Cross-market spread tracking' },
  { icon: 'fa-shield-alt', title_cn: '风险预警系统', title_en: 'Risk Alert', sub_cn: '机会窗口关闭前自动推送提醒', sub_en: 'Auto push before window closes' },
  { icon: 'fa-database', title_cn: '情报数据库', title_en: 'Intel Database', sub_cn: '历史机会回溯与模式识别分析', sub_en: 'Historical pattern analysis' },
];

// ====== 文本助手 ======
function t(key) { return I18N[currentLang]?.[key] || key; }
function _t(obj) { return currentLang === 'en' ? obj.en : obj.cn; }
function _tl(label) { return currentLang === 'en' ? label.en : label.cn; }

// ====== 数字滚动动画 ======
function animateCount(el, target, suffix = '') {
  if (!el) return;
  const numEl = el.querySelector('.count-num') || el;
  const start = 0;
  const duration = 1000;
  const startTime = performance.now();
  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (target - start) * eased);
    numEl.textContent = fmtNum(current) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ====== 渲染：数据概览 ======
function renderOverview(data) {
  const s = data.stats;
  animateCount(document.getElementById('today-count'), s.today_total);
  animateCount(document.getElementById('high-count'), s.high_count);
  animateCount(document.getElementById('new-count'), s.new_count);
  const avgEl = document.getElementById('avg-score');
  if (avgEl) {
    const numEl = avgEl.querySelector('.count-num');
    if (numEl) numEl.textContent = s.avg_score + '/10';
  }

  const alertEl = document.getElementById('high-alert');
  if (alertEl) {
    const numEl = alertEl.querySelector('.count-num');
    if (numEl) numEl.textContent = fmtNum(s.high_alert);
  }

  const fmtDelta = (v) => (v >= 0 ? '↑' : '↓') + ' ' + Math.abs(v) + (v > 10 ? '%' : '');
  setText('delta-total', fmtDelta(s.delta_total));
  setText('delta-high', fmtDelta(s.delta_high));
  setText('delta-new', fmtDelta(s.delta_new));
  setText('delta-avg', (s.delta_avg >= 0 ? '↑' : '↓') + ' ' + Math.abs(s.delta_avg));
  setText('delta-alert', fmtDelta(s.delta_alert));
}
function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }

// ====== 渲染：Top 3 ======
function renderTop3(data) {
  const grid = document.getElementById('top3-grid');
  if (!grid) return;
  const top3 = [...data.opportunities].sort((a, b) => b.score - a.score).slice(0, 3);
  grid.innerHTML = top3.map((o, i) => {
    const type = _tl({ cn: o.type_cn, en: o.type_en });
    const window = _tl({ cn: o.window_cn, en: o.window_en });
    const action = _tl({ cn: o.action_cn, en: o.action_en });
    return `
      <div class="top3-card rank-${i + 1}">
        <div class="top3-rank">${i + 1}</div>
        <div class="top3-title">${_tl({ cn: o.title_cn, en: o.title_en }).slice(0, 40)}${_tl({ cn: o.title_cn, en: o.title_en }).length > 40 ? '…' : ''}</div>
        <div class="top3-tags">
          <span class="tag tag-green">${type}</span>
          <span class="tag tag-gray">${window}</span>
          ${o.is_new ? '<span class="tag tag-new">' + t('label_new') + '</span>' : ''}
        </div>
        <div class="top3-score">${o.score}</div>
        <div class="top3-status"><i class="fas fa-circle text-[8px] text-[#4ADE80] mr-1"></i>${action}</div>
      </div>
    `;
  }).join('');
}

// ====== 渲染：广告位 ======
function renderAds() {
  const grid = document.getElementById('ad-grid');
  if (!grid) return;
  grid.innerHTML = AD_ITEMS.map(ad => {
    const title = currentLang === 'en' ? ad.title_en : ad.title_cn;
    const sub = currentLang === 'en' ? ad.sub_en : ad.sub_cn;
    return `<div class="ad-card"><i class="fas ${ad.icon}"></i><div class="ad-title">${title}</div><div class="ad-sub">${sub}</div></div>`;
  }).join('');
}

// ====== 渲染：机会面板 ======
function renderOpportunityPanels(data) {
  const container = document.getElementById('opportunity-list');
  if (!container) return;
  const opps = data.opportunities;
  container.innerHTML = opps.map((o, idx) => {
    const isFirst = idx === 0;
    const type = _tl({ cn: o.type_cn, en: o.type_en });
    const window = _tl({ cn: o.window_cn, en: o.window_en });
    const action = _tl({ cn: o.action_cn, en: o.action_en });
    const title = _tl({ cn: o.title_cn, en: o.title_en });
    const desc = title + ' — ' + t('filter_type') + ': ' + type + '，' + t('filter_range') + ': ' + window + '。' + t('filter_score') + ' ' + o.score + '/10，' + t('filter_btn') + ': ' + action + '。';
    const scoreDims = currentLang === 'en'
      ? ['Confidence', 'Timeliness', 'Executability', 'Asymmetry', 'Market Heat', 'Competition', 'Scalability']
      : ['可信度', '时效性', '执行力', '不对称性', '市场热度', '竞争程度', '可扩展性'];
    const s = o.scores;
    const scoreMap = currentLang === 'en' ? s.en : s.cn;

    const scoreBars = scoreDims.map(dim => {
      const val = scoreMap[dim] || 7;
      const pct = (val / 10) * 100;
      const color = val >= 8 ? '#4ADE80' : val >= 6 ? '#FBBF24' : '#EF4444';
      return `<div class="score-item"><div class="score-label"><span>${dim}</span><span>${val}/10</span></div><div class="score-bar-track"><div class="score-bar-fill" style="width:0%;background:${color}" data-target="${pct}%"></div></div></div>`;
    }).join('');

    const decisions = (currentLang === 'en' ? o.decisions_en : o.decisions_cn).map(d =>
      `<div class="decision-item"><i class="fas fa-check-circle"></i>${d}</div>`
    ).join('');

    const paths = (currentLang === 'en' ? o.path_en : o.path_cn).map(p =>
      `<span class="path-step"><i class="fas fa-arrow-right"></i>${p}</span>`
    ).join('');

    const tags = [type, window].map(t => `<span class="tag tag-green">${t}</span>`).join('');
    const newTag = o.is_new ? `<span class="tag tag-new">${t('label_new')}</span>` : '';

    return `
      <div class="opp-panel ${isFirst ? 'expanded' : ''}">
        <div class="opp-panel-header" onclick="togglePanel(this)">
          <div class="opp-panel-title">
            <span class="opp-panel-name">${title}</span>
            <span class="opp-panel-score">${o.score}</span>
          </div>
          <div class="opp-panel-toggle"><i class="fas fa-chevron-${isFirst ? 'up' : 'down'}"></i></div>
        </div>
        <div class="opp-panel-body">
          <div class="opp-panel-inner">
            <div class="opp-tags">${tags} ${newTag}</div>
            <div class="score-grid">${scoreBars}</div>
            <div class="decision-section"><div class="decision-section-title"><i class="fas fa-bolt"></i>${t('decision_title')}</div>${decisions}</div>
            <div><div class="path-section-title"><i class="fas fa-road"></i>${t('path_title')}</div><div class="path-steps">${paths}</div></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  // 评分条动画
  setTimeout(() => {
    document.querySelectorAll('.score-bar-fill').forEach(bar => { bar.style.width = bar.dataset.target; });
  }, 400);
}

// ====== 渲染：右侧图表 ======
function renderAlerts(data) {
  const container = document.getElementById('alert-list');
  if (!container) return;
  container.innerHTML = data.alerts.map(a =>
    `<div class="alert-item"><span class="alert-dot"></span><div><div class="alert-text">${_tl({ cn: a.text_cn, en: a.text_en })}</div><div class="alert-time">${a.time}</div></div></div>`
  ).join('');
}

function renderBarChart(data) {
  const container = document.getElementById('bar-chart');
  if (!container) return;
  const gaps = data.gap_distribution;
  const maxVal = Math.max(...gaps.map(d => d.value));
  const colors = ['#4ADE80', '#22D3EE', '#FBBF24', '#EF4444', '#A78BFA', '#F472B6'];
  container.innerHTML = gaps.map((d, i) => {
    const pct = (d.value / maxVal) * 100;
    return `<div class="bar-item"><span class="bar-label">${_tl(d)}</span><div class="bar-track"><div class="bar-fill" style="width:0%;background:${colors[i]}" data-target="${pct}%"></div></div><span class="bar-value">${d.value}</span></div>`;
  }).join('');
  setTimeout(() => {
    container.querySelectorAll('.bar-fill').forEach(bar => { bar.style.width = bar.dataset.target; });
  }, 300);
}

function renderPieChart(canvasId, legendId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const total = data.pie_distribution.reduce((s, d) => s + d.value, 0);
  const cx = 100, cy = 100, r = 80;
  ctx.clearRect(0, 0, 200, 200);
  let startAngle = -Math.PI / 2;
  data.pie_distribution.forEach(d => {
    const sliceAngle = (d.value / total) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle); ctx.closePath();
    ctx.fillStyle = d.color || '#4ADE80'; ctx.fill();
    ctx.strokeStyle = '#0A0A0D'; ctx.lineWidth = 2; ctx.stroke();
    startAngle += sliceAngle;
  });
  ctx.beginPath(); ctx.arc(cx, cy, 35, 0, Math.PI * 2);
  ctx.fillStyle = '#0A0A0D'; ctx.fill();
  ctx.fillStyle = '#e4e6f0'; ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(total, cx, cy);

  const legend = document.getElementById(legendId);
  if (!legend) return;
  legend.innerHTML = data.pie_distribution.map(d =>
    `<div class="pie-legend-item"><span class="pie-legend-dot" style="background:${d.color || '#4ADE80'}"></span><span>${_tl(d)} (${d.value})</span></div>`
  ).join('');
}

function renderScanLog(data) {
  const container = document.getElementById('scan-log');
  if (!container) return;
  container.innerHTML = '';
  data.scan_log.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'scan-entry';
    div.innerHTML = `<span class="scan-time">${entry.time}</span><span class="scan-source">${entry.source}</span><span class="scan-msg">${_tl({ cn: entry.msg_cn, en: entry.msg_en })}</span>`;
    container.appendChild(div);
  });
}

// ====== 渲染：Discover Feed ======
function renderDiscoverFeed(data) {
  const container = document.getElementById('discover-feed');
  if (!container) return;
  const sources = ['GitHub', 'HN', 'Reddit', 'Product Hunt', '36Kr', 'VC Blog', 'ArXiv', 'Twitter/X'];
  const now = new Date();
  const items = data.opportunities.slice(0, 10).map((o, i) => {
    const time = new Date(now.getTime() - i * 3600000).toTimeString().slice(0, 5);
    return `<div class="discover-item"><span class="disc-source">${pick(sources)}</span><span class="disc-signal">${_tl({ cn: o.title_cn, en: o.title_en })}</span><span class="disc-score">${o.score}</span><span class="disc-time">${time}</span></div>`;
  }).join('');
  container.innerHTML = items;
}

// ====== 交互 ======
function togglePanel(header) {
  const panel = header.closest('.opp-panel');
  if (!panel) return;
  panel.classList.toggle('expanded');
  const icon = panel.querySelector('.opp-panel-toggle i');
  if (icon) icon.className = `fas fa-chevron-${panel.classList.contains('expanded') ? 'up' : 'down'}`;
}

function applyFilter() {
  if (DATA.raw) renderOpportunityPanels(DATA.raw);
}

function switchToTrack(e) {
  e.preventDefault();
  document.querySelectorAll('#page-home, .page-hidden').forEach(el => el.style.display = 'none');
  document.getElementById('track-panel').style.display = 'block';
}
function switchToHome(e) {
  e.preventDefault();
  document.getElementById('track-panel').style.display = 'none';
  document.getElementById('page-home').style.display = 'block';
}

// ====== 完整刷新 ======
function refreshAll() {
  const d = DATA.raw;
  // 广告位始终渲染
  renderAds();
  if (!d) return;
  renderOverview(d);
  renderTop3(d);
  renderAds();
  if (document.getElementById('opportunity-list').style.display !== 'none') renderOpportunityPanels(d);
  renderAlerts(d);
  renderBarChart(d);
  renderPieChart('pie-chart', 'pie-legend', d);
  renderScanLog(d);
  renderDiscoverFeed(d);
}

// ====== 页面导航 ======
function switchPage(pageId) {
  document.querySelectorAll('.main-area > div').forEach(el => el.classList.add('page-hidden'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.remove('page-hidden');
  document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
  const activeItem = document.querySelector(`.sidebar-item[data-page="${pageId}"]`);
  if (activeItem) activeItem.classList.add('active');

// ====== 初始化 ======
async function init() {
  await loadData();
  setLang('en');
  if (DATA.raw) refreshAll();

  // 语言切换
    document.querySelectorAll('.lang-link').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        setLang(el.dataset.lang);
      });
    });

    // 导航切换
    document.querySelectorAll('.sidebar-item').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        switchPage(el.dataset.page);
      });
    });

    // 定时刷新数据（检查 JSON 是否有更新）
    setInterval(async () => {
      await loadData();
      refreshAll();
    }, 60000);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
