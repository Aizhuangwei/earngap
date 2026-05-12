/**
 * i18n.js — 中英文翻译字典
 */
const I18N = {
  en: {
    site_title: 'EarnGap · Turn information gaps into alpha',
    site_desc: 'Global opportunity intelligence engine. Find information gaps, lock in alpha.',
    tagline: 'Discover the Gap · Catch the Window · Win Before the Crowd',
    search_placeholder: 'Search opportunities...',
    subscribe_placeholder: 'Subscribe to alpha brief...',
    subscribe: 'Subscribe',
    vs_yesterday: 'vs yesterday',
    system_online: 'System Online',
    back_home: 'Back to Home',

    nav_home: 'Home', nav_discover: 'Discover', nav_track: 'Track',
    nav_reports: 'Reports', nav_method: 'Methodology', nav_about: 'About',

    ov_today: 'Today\'s Total', ov_high: 'High Score', ov_new: 'New Today',
    ov_avg: 'Avg Score', ov_alerts: 'High Alerts',

    top3_title: 'Top 3 Opportunities',
    view_all: 'View All',

    ad_title: 'Recommended Products',

    discover_title: 'Opportunity Discovery',
    discover_desc: 'Real-time scanning results from 8 global sources. New signals appear as they are detected.',

    reports_title: 'Reports Center',
    reports_desc: 'Weekly and monthly alpha intelligence reports.',
    coming_soon: 'Reports are being prepared. Check back later.',

    method_title: 'Methodology',
    method_scoring: '7-Dimension Scoring System',
    method_scoring_desc: 'Each opportunity is scored across 7 dimensions: Confidence, Timeliness, Executability, Asymmetry, Market Heat, Competition, and Scalability. The overall score (1-10) determines the conviction level.',
    method_window: 'Opportunity Window',
    method_window_desc: 'We classify each opportunity by its likely execution window: <7 days (immediate), 7-30 days (short-term), 30-90 days (medium-term), and >90 days (long-term).',
    method_sources: '8 Global Sources',
    method_sources_desc: 'GitHub, Hacker News, Reddit, Product Hunt, 36Kr, VC Blogs, ArXiv, Twitter/X — scanned 24/7.',

    about_title: 'About EarnGap',
    about_mission: 'Our Mission',
    about_mission_desc: 'EarnGap is an automated opportunity intelligence engine developed by 烁腾云控 (Shuoteng Cloud Control). We scan global markets 24/7 to identify information asymmetries.',
    about_auto: 'Fully Automated Pipeline',
    about_auto_desc: 'Every day at 06:00 Beijing time, our system automatically scans 8+ sources, cleans and classifies signals, scores each opportunity across 7 dimensions, and publishes the results.',
    about_disclaimer: 'Disclaimer',
    about_disclaimer_desc: 'All information provided is for reference only. Please exercise your own judgment before making any investment decisions.',

    filter_cycle: 'Cycle', filter_type: 'Gap Type', filter_score: 'Min Score',
    filter_range: 'Range', filter_sort: 'Sort', filter_btn: 'Filter',
    all: 'All', today: 'Today', week: 'Week', month: 'Month', any: 'Any',
    sort_score: 'Score', sort_new: 'Newest', sort_window: 'Window',

    alert_title: 'High Score Alerts',
    pie_title: 'Score Distribution',
    bar_title: 'Gap Distribution',
    scan_title: 'Recent Scans',

    privacy: 'Privacy', terms: 'Terms', about: 'About', help: 'Help',
    disclaimer: '© 2026 stykai · AI-generated intelligence. Verify before investing.',

    label_new: 'NEW',
    label_execute: 'Execute', label_monitor: 'Monitor', label_prepare: 'Prepare', label_alert: 'Alert',
    decision_title: 'Key Decisions',
    path_title: 'Execution Path',
    track_title: 'Opportunity Tracking',
  },

  zh: {
    site_title: 'EarnGap · 烁腾云控 — 全球信息差机会扫描引擎',
    site_desc: '烁腾云控 · 全球信息差机会扫描引擎。发现信息差，锁定超额收益。',
    tagline: '发现信息差 · 把握时间窗口 · 赢在认知之前',
    search_placeholder: '搜索机会、标签、来源…',
    subscribe_placeholder: '订阅机会简报…',
    subscribe: '订阅',
    vs_yesterday: '较昨日',
    system_online: '系统在线',
    back_home: '返回首页',

    nav_home: '首页', nav_discover: '机会发现', nav_track: '机会追踪',
    nav_reports: '报告中心', nav_method: '方法论', nav_about: '关于我们',

    ov_today: '今日机会总数', ov_high: '高机会数', ov_new: '今日新增机会',
    ov_avg: '平均机会分', ov_alerts: '高分提醒',

    top3_title: 'Top 3 高分机会',
    view_all: '查看全部',

    ad_title: '推荐产品',

    discover_title: '机会发现',
    discover_desc: '实时扫描 8 个全球信息源的最新信号。新机会出现时自动呈现。',

    reports_title: '报告中心',
    reports_desc: '每周和每月的 Alpha 情报报告。',
    coming_soon: '报告正在准备中，请稍后再来查看。',

    method_title: '方法论',
    method_scoring: '七维评分体系',
    method_scoring_desc: '每个机会从 7 个维度评分：可信度、时效性、执行力、不对称性、市场热度、竞争程度、可扩展性。总分（1-10）决定信心等级。',
    method_window: '机会窗口',
    method_window_desc: '我们按执行窗口分类每个机会：<7天（立即）、7-30天（短期）、30-90天（中期）、>90天（长期）。窗口每日更新。',
    method_sources: '8 个全球信息源',
    method_sources_desc: 'GitHub、Hacker News、Reddit、Product Hunt、36Kr、VC Blog、ArXiv、Twitter/X — 24/7 持续扫描。',

    about_title: '关于 EarnGap',
    about_mission: '我们的使命',
    about_mission_desc: 'EarnGap 是烁腾云控开发的自动化机会情报引擎。我们 24/7 扫描全球市场，识别可转化为超额收益的信息不对称。',
    about_auto: '全自动流水线',
    about_auto_desc: '每天北京时间 06:00，系统自动扫描 8+ 个信息源、清洗分类信号、七维评分、发布结果。无需人工干预。',
    about_disclaimer: '免责声明',
    about_disclaimer_desc: '所有信息仅供参考。请在做出任何投资决策前自行判断。',

    filter_cycle: '周期', filter_type: '信息差类型', filter_score: '最低分数',
    filter_range: '时间范围', filter_sort: '排序', filter_btn: '筛选',
    all: '全部', today: '今日', week: '本周', month: '本月', any: '不限',
    sort_score: '分数最高', sort_new: '最新发布', sort_window: '即将截止',

    alert_title: '高分机会提醒',
    pie_title: '机会分级示意',
    bar_title: '信息差分布',
    scan_title: '最近扫描记录',

    privacy: '隐私政策', terms: '服务条款', about: '关于我们', help: '帮助中心',
    disclaimer: '© 2026 stykai · 信息来自AI采集，仅供参考，请仔细甄别，谨慎投资。',

    label_new: 'NEW',
    label_execute: '立即执行', label_monitor: '密切监控', label_prepare: '准备入场', label_alert: '预警提醒',
    decision_title: '高效决策项',
    path_title: '执行路径',
    track_title: '机会追踪',
  }
};

let currentLang = 'en';

function setLang(lang) {
  currentLang = lang;
  document.documentElement.setAttribute('data-lang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (I18N[lang] && I18N[lang][key]) {
      el.textContent = I18N[lang][key];
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (I18N[lang] && I18N[lang][key]) {
      el.placeholder = I18N[lang][key];
    }
  });
  // 语言按钮
  document.querySelectorAll('.lang-link').forEach(el => {
    el.classList.toggle('active', el.dataset.lang === lang);
  });
  // 刷新所有动态文本
  if (typeof refreshAll === 'function') refreshAll();
}
