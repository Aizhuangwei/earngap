/**
 * main.js — EarnGap v2 最终版
 * 所有数据从 data/opportunities.json 读取
 * 自动初始化，无全局引用
 */
window.onerror = function(msg, url, line) {
  document.body.insertAdjacentHTML('afterbegin', 
    '<div style="background:#EF4444;color:white;padding:8px;font-size:12px;font-family:monospace;">JS Error: ' + msg + ' at line ' + line + '</div>');
};

(function() {
  "use strict";

  const fmtNum = n => n.toLocaleString('zh-CN');
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const fmtTime = d => d.toTimeString().slice(0, 8);

  const AD_ITEMS = [
    { icon: 'fa-rocket', title_en: 'EarnGap Pro', title_cn: '烁腾云控 Pro', sub_en: 'AI-powered gap engine', sub_cn: 'AI 驱动信息差引擎' },
    { icon: 'fa-robot', title_en: 'AI Scanner', title_cn: 'AI 机会扫描器', sub_en: '24/7 automated scanning', sub_cn: '7×24h 自动化扫描' },
    { icon: 'fa-envelope', title_en: 'Alpha Brief', title_cn: 'Alpha 简报', sub_en: 'Daily curated opportunities', sub_cn: '每日精选信息差推送' },
    { icon: 'fa-chart-line', title_en: 'Enterprise Intel', title_cn: '企业情报平台', sub_en: 'Custom competitive intel', sub_cn: '定制化竞争情报方案' },
    { icon: 'fa-users', title_en: 'Gap Community', title_cn: '烁腾社区', sub_en: 'Connect with arbitrageurs', sub_cn: '与 1000+ 套利者交流' },
    { icon: 'fa-book', title_en: 'Arb Methodology', title_cn: '套利方法论', sub_en: 'Systematic gap trading', sub_cn: '系统化信息差套利课程' },
    { icon: 'fa-globe', title_en: 'Cross-border Guide', title_cn: '跨境套利指南', sub_en: 'Cross-market tracking', sub_cn: '跨市场价差追踪' },
    { icon: 'fa-shield-alt', title_en: 'Risk Alert', title_cn: '风险预警系统', sub_en: 'Auto push before window closes', sub_cn: '窗口关闭自动提醒' },
    { icon: 'fa-database', title_en: 'Intel Database', title_cn: '情报数据库', sub_en: 'Historical pattern analysis', sub_cn: '历史机会回溯分析' },
  ];

  function t(key) { return I18N[currentLang]?.[key] || key; }
  function _t(obj) { return currentLang === 'en' ? obj.en : obj.cn; }

  function animateCount(el, target, suffix) {
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
      numEl.textContent = fmtNum(current) + (suffix || '');
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }

  function initDashboard(data) {
    if (!data) return;
    const s = data.stats;
    animateCount(document.getElementById('today-count'), s.today_total);
    animateCount(document.getElementById('high-count'), s.high_count);
    animateCount(document.getElementById('new-count'), s.new_count);
    const avgEl = document.getElementById('avg-score');
    if (avgEl) { const ne = avgEl.querySelector('.count-num'); if (ne) ne.textContent = s.avg_score + '/10'; }
    const al = document.getElementById('high-alert');
    if (al) { const ne = al.querySelector('.count-num'); if (ne) ne.textContent = fmtNum(s.high_alert); }
    const fd = (v) => (v >= 0 ? '↑' : '↓') + ' ' + Math.abs(v) + (v > 10 ? '%' : '');
    setText('delta-total', fd(s.delta_total));
    setText('delta-high', fd(s.delta_high));
    setText('delta-new', fd(s.delta_new));
    setText('delta-avg', (s.delta_avg >= 0 ? '↑' : '↓') + ' ' + Math.abs(s.delta_avg));
    setText('delta-alert', fd(s.delta_alert));
    console.log("dashboard loaded");
  }

  function initCharts(data) {
    if (!data) return;
    // Bar chart
    const bar = document.getElementById('bar-chart');
    if (bar) {
      const gaps = data.gap_distribution;
      const maxVal = Math.max(...gaps.map(d => d.value));
      const colors = ['#4ADE80', '#22D3EE', '#FBBF24', '#EF4444', '#A78BFA', '#F472B6'];
      bar.innerHTML = gaps.map((d, i) => {
        const pct = (d.value / maxVal) * 100;
        return '<div class="bar-item"><span class="bar-label">' + _t(d) + '</span><div class="bar-track"><div class="bar-fill" style="width:0%;background:' + colors[i] + '" data-target="' + pct + '%"></div></div><span class="bar-value">' + d.value + '</span></div>';
      }).join('');
      setTimeout(() => { bar.querySelectorAll('.bar-fill').forEach(b => { b.style.width = b.dataset.target; }); }, 300);
    }
    // Pie chart
    const canvas = document.getElementById('pie-chart');
    if (canvas) {
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
      const legend = document.getElementById('pie-legend');
      if (legend) {
        legend.innerHTML = data.pie_distribution.map(d => '<div class="pie-legend-item"><span class="pie-legend-dot" style="background:' + (d.color || '#4ADE80') + '"></span><span>' + _t(d) + ' (' + d.value + ')</span></div>').join('');
      }
    }
    // Alerts
    const alerts = document.getElementById('alert-list');
    if (alerts) {
      alerts.innerHTML = data.alerts.map(a => '<div class="alert-item"><span class="alert-dot"></span><div><div class="alert-text">' + _t({ cn: a.text_cn, en: a.text_en }) + '</div><div class="alert-time">' + a.time + '</div></div></div>').join('');
    }
    // Scan log
    const scan = document.getElementById('scan-log');
    if (scan) {
      scan.innerHTML = '';
      data.scan_log.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'scan-entry';
        div.innerHTML = '<span class="scan-time">' + entry.time + '</span><span class="scan-source">' + entry.source + '</span><span class="scan-msg">' + _t({ cn: entry.msg_cn, en: entry.msg_en }) + '</span>';
        scan.appendChild(div);
      });
    }
    console.log("charts loaded");
  }

  function initFilters(data) {
    if (!data) return;
    const container = document.getElementById('opportunity-list');
    if (!container) return;
    const opps = data.opportunities;
    container.innerHTML = opps.map((o, idx) => {
      const isFirst = idx === 0;
      const type = _t({ cn: o.type_cn, en: o.type_en });
      const window = _t({ cn: o.window_cn, en: o.window_en });
      const title = _t({ cn: o.title_cn, en: o.title_en });
      const scoreDims = currentLang === 'en'
        ? ['Confidence', 'Timeliness', 'Executability', 'Asymmetry', 'Market Heat', 'Competition', 'Scalability']
        : ['可信度', '时效性', '执行力', '不对称性', '市场热度', '竞争程度', '可扩展性'];
      const s = o.scores;
      const scoreMap = currentLang === 'en' ? s.en : s.cn;
      const scoreBars = scoreDims.map(dim => {
        const val = scoreMap[dim] || 7;
        const pct = (val / 10) * 100;
        const color = val >= 8 ? '#4ADE80' : val >= 6 ? '#FBBF24' : '#EF4444';
        return '<div class="score-item"><div class="score-label"><span>' + dim + '</span><span>' + val + '/10</span></div><div class="score-bar-track"><div class="score-bar-fill" style="width:0%;background:' + color + '" data-target="' + pct + '%"></div></div></div>';
      }).join('');
      const decisions = (currentLang === 'en' ? o.decisions_en : o.decisions_cn).map(d => '<div class="decision-item"><i class="fas fa-check-circle"></i>' + d + '</div>').join('');
      const paths = (currentLang === 'en' ? o.path_en : o.path_cn).map(p => '<span class="path-step"><i class="fas fa-arrow-right"></i>' + p + '</span>').join('');
      const tags = '<span class="tag tag-green">' + type + '</span><span class="tag tag-gray">' + window + '</span>' + (o.is_new ? '<span class="tag tag-new">' + t('label_new') + '</span>' : '');
      return '<div class="opp-panel ' + (isFirst ? 'expanded' : '') + '"><div class="opp-panel-header" onclick="togglePanel(this)"><div class="opp-panel-title"><span class="opp-panel-name">' + title + '</span><span class="opp-panel-score">' + o.score + '</span></div><div class="opp-panel-toggle"><i class="fas fa-chevron-' + (isFirst ? 'up' : 'down') + '"></i></div></div><div class="opp-panel-body"><div class="opp-panel-inner"><div class="opp-tags">' + tags + '</div><div class="score-grid">' + scoreBars + '</div><div class="decision-section"><div class="decision-section-title"><i class="fas fa-bolt"></i>' + t('decision_title') + '</div>' + decisions + '</div><div><div class="path-section-title"><i class="fas fa-road"></i>' + t('path_title') + '</div><div class="path-steps">' + paths + '</div></div></div></div></div>';
    }).join('');
    setTimeout(() => { document.querySelectorAll('.score-bar-fill').forEach(bar => { bar.style.width = bar.dataset.target; }); }, 400);
    console.log("filters loaded");
  }

  function initSidebar(data) {
    if (!data) return;
    const grid = document.getElementById('top3-grid');
    if (grid) {
      const top3 = [...data.opportunities].sort((a, b) => b.score - a.score).slice(0, 3);
      grid.innerHTML = top3.map((o, i) => {
        return '<div class="top3-card rank-' + (i + 1) + '"><div class="top3-rank">' + (i + 1) + '</div><div class="top3-title">' + _t({ cn: o.title_cn, en: o.title_en }).slice(0, 40) + '</div><div class="top3-tags"><span class="tag tag-green">' + _t({ cn: o.type_cn, en: o.type_en }) + '</span><span class="tag tag-gray">' + _t({ cn: o.window_cn, en: o.window_en }) + '</span>' + (o.is_new ? '<span class="tag tag-new">' + t('label_new') + '</span>' : '') + '</div><div class="top3-score">' + o.score + '</div><div class="top3-status"><i class="fas fa-circle text-[8px] text-[#4ADE80] mr-1"></i>' + _t({ cn: o.action_cn, en: o.action_en }) + '</div></div>';
      }).join('');
    }
    console.log("sidebar loaded");
  }

  function initAnimations() {
    // 广告位
    const adGrid = document.getElementById('ad-grid');
    if (adGrid) {
      adGrid.innerHTML = AD_ITEMS.map(ad => {
        const title = currentLang === 'en' ? ad.title_en : ad.title_cn;
        const sub = currentLang === 'en' ? ad.sub_en : ad.sub_cn;
        return '<div class="ad-card"><i class="fas ' + ad.icon + '"></i><div class="ad-title">' + title + '</div><div class="ad-sub">' + sub + '</div></div>';
      }).join('');
    }
    console.log("animations loaded");
  }

  async function bootstrap() {
    console.log("bootstrap started");
    try {
      const resp = await fetch('data/opportunities.json?_=' + Date.now());
      const data = await resp.json();
      window._earngapData = data;
      initDashboard(data);
      initCharts(data);
      initFilters(data);
      initSidebar(data);
      initAnimations();
      console.log("bootstrap complete");
    } catch(e) {
      console.warn('Data fetch failed, rendering static content only', e);
      initAnimations();
    }
  }

  window.togglePanel = function(header) {
    const panel = header.closest('.opp-panel');
    if (!panel) return;
    panel.classList.toggle('expanded');
    const icon = panel.querySelector('.opp-panel-toggle i');
    if (icon) icon.className = 'fas fa-chevron-' + (panel.classList.contains('expanded') ? 'up' : 'down');
  };

  window.applyFilter = function() {
    if (window._earngapData) initFilters(window._earngapData);
  };

  window.switchToTrack = function(e) {
    e.preventDefault();
    document.querySelector('#page-home').style.display = 'none';
    document.getElementById('track-panel').style.display = 'block';
  };

  window.switchToHome = function(e) {
    e.preventDefault();
    document.getElementById('track-panel').style.display = 'none';
    document.querySelector('#page-home').style.display = 'block';
  };

  window.switchPage = function(pageId) {
    document.querySelectorAll('.main-area > div').forEach(el => el.classList.add('page-hidden'));
    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.remove('page-hidden');
    document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
    const activeItem = document.querySelector('.sidebar-item[data-page="' + pageId + '"]');
    if (activeItem) activeItem.classList.add('active');
  };

  // 语言切换
  document.querySelectorAll('.lang-link').forEach(el => {
    el.addEventListener('click', function(e) {
      e.preventDefault();
      const lang = this.dataset.lang;
      if (typeof setLang === 'function') setLang(lang);
    });
  });

  // 导航切换
  document.querySelectorAll('.sidebar-item').forEach(el => {
    el.addEventListener('click', function(e) {
      e.preventDefault();
      window.switchPage(this.dataset.page);
    });
  });

  // 自动启动
  document.addEventListener("DOMContentLoaded", bootstrap);

})();
