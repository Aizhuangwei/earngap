/**
 * data.js — 从 data/opportunities.json 加载数据
 */
const DATA = {};

async function loadData() {
  try {
    const resp = await fetch('data/opportunities.json?_=' + Date.now());
    DATA.raw = await resp.json();
    return DATA.raw;
  } catch (e) {
    console.warn('Failed to load opportunities.json, using fallback', e);
    return null;
  }
}
