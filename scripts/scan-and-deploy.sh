#!/usr/bin/env bash
# ============================================================
# scan-and-deploy.sh
# EarnGap 自动扫描 → 更新数据 → 提交 GitHub → 触发 Vercel 部署
# 由 OpenClaw cron job 每天北京时间 06:00 执行
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DATA_FILE="$PROJECT_DIR/data/opportunities.json"
GIT_MSG="[auto] daily opportunity scan $(TZ='Asia/Shanghai' date '+%Y-%m-%d %H:%M')"

cd "$PROJECT_DIR"

echo "[$(TZ='Asia/Shanghai' date)] === EarnGap Daily Scan Start ==="

# --- Step 1: 确保 data 目录存在 ---
mkdir -p data

# --- Step 2: 如果 opportunities.json 不存在，创建一个备份 ---
if [ ! -f "$DATA_FILE" ]; then
  echo "[WARN] No data file found. Creating empty template..."
  cat > "$DATA_FILE" << 'EMPTYEOF'
{
  "meta": { "version": "1.0", "generated_at": "", "source": "EarnGap Scanner", "total_opportunities": 0 },
  "stats": { "today_total": 0, "high_count": 0, "new_count": 0, "avg_score": 0, "high_alert": 0, "delta_total": 0, "delta_high": 0, "delta_new": 0, "delta_avg": 0, "delta_alert": 0 },
  "gap_distribution": [],
  "pie_distribution": [],
  "alerts": [],
  "opportunities": [],
  "scan_log": []
}
EMPTYEOF
fi

# --- Step 3: 生成新的扫描数据 ---
# 在生产环境中此处调用 LLM 或爬虫脚本进行真实数据扫描
# 本脚本提供一个数据存档结构，真实数据由外部扫描器填充
echo "[INFO] Scan complete. Data file exists: $(wc -c < "$DATA_FILE") bytes"

# --- Step 4: 提交 Git ---
# 只有在数据有变化时才提交
if git diff --quiet "$DATA_FILE"; then
  echo "[SKIP] No changes to data file."
else
  git add "$DATA_FILE"
  git commit -m "$GIT_MSG"
  echo "[OK] Committed: $GIT_MSG"
fi

# 如果有其他文件变化也提交
git add -A
if ! git diff --cached --quiet; then
  git commit -m "$GIT_MSG (assets update)" || true
fi

# --- Step 5: 推送 GitHub（触发 Vercel 自动部署） ---
echo "[INFO] Pushing to GitHub..."
git push origin main 2>&1 || git push origin master 2>&1 || echo "[WARN] Push failed (may not have remote)"

echo "[$(TZ='Asia/Shanghai' date)] === EarnGap Daily Scan Complete ==="
