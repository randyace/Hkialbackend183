#!/bin/bash
# HKIAL Quarterly Spec Audit
# =============================
# Catches drift between spec, code, handoffs, and pending-changes.
# Run quarterly (or before a major release): ./spec-audit.sh
#
# Outputs: a list of contradictions + stale items + missing banners.
# Use the output to populate HKIAL/spec.md §14.5 (ROT) and §14.4 (PENDING).
#
# Author: Hermes (round 7.0-prep, 2026-06-13)
# Spec reference: HKIAL/spec.md §16.3

set -uo pipefail

# --- Config (override via env var) -----------------------------------------
HKIAL_ROOT="${HKIAL_ROOT:-$HOME/Desktop/Projects}"
SPEC_FILE="$HKIAL_ROOT/HKIAL/spec.md"
CUSTOMER_ROOT="$HKIAL_ROOT/frontend_react/frontend"
ADMIN_ROOT="$HKIAL_ROOT/backend/hkial-react"
API_ROOT="$HKIAL_ROOT/backend/hkial-api"

# --- Colors (no color if not a TTY) -----------------------------------------
if [ -t 1 ]; then
  RED='\033[0;31m'
  YELLOW='\033[1;33m'
  GREEN='\033[0;32m'
  CYAN='\033[0;36m'
  NC='\033[0m'
else
  RED=''; YELLOW=''; GREEN=''; CYAN=''; NC=''
fi

echo -e "${CYAN}=== HKIAL Spec Audit — $(date -u +%Y-%m-%d) ===${NC}"
echo

# --- 1. Handoff count by subproject (vs spec §1.1) -------------------------
echo -e "${CYAN}--- 1. Handoff count by subproject ---${NC}"
customer_count=$(ls "$CUSTOMER_ROOT/docs/handoff/"*.md 2>/dev/null | grep -v README | wc -l | tr -d ' ')
admin_count=$(ls "$ADMIN_ROOT/docs/handoff/"*.md 2>/dev/null | grep -v README | wc -l | tr -d ' ')
api_count=$(ls "$API_ROOT/docs/handoff/"*.md 2>/dev/null | grep -v README | wc -l | tr -d ' ')
pending_count=$(ls "$ADMIN_ROOT/docs/pending-changes/"*.md 2>/dev/null | wc -l | tr -d ' ')
cross_count=$(ls "$HKIAL_ROOT/HKIAL/handoff/"*.md 2>/dev/null | grep -v README | wc -l | tr -d ' ')

echo "Customer:  $customer_count handoffs (spec §14: expect growing)"
echo "Admin:     $admin_count handoffs"
echo "API:       $api_count handoffs (expect 0 — no dir yet)"
echo "Pending:   $pending_count pending-changes (max 6 before TTL warning)"
echo "Cross:     $cross_count cross-project handoffs (expect 0 — no dir yet)"
echo

# --- 2. Pending-changes TTL check (7-day rule, spec §16.1 Rule 3) -----------
echo -e "${CYAN}--- 2. Pending-changes TTL check (7-day rule) ---${NC}"
ttl_violations=0
for f in "$ADMIN_ROOT/docs/pending-changes/"*.md; do
  [ -e "$f" ] || continue
  age=$(($(date +%s) - $(stat -f %m "$f" 2>/dev/null || stat -c %Y "$f")))
  days=$((age / 86400))
  has_status=$(grep -c "STATUS:" "$f" 2>/dev/null || echo 0)
  if [ "$days" -gt 7 ] && [ "$has_status" -eq 0 ]; then
    echo -e "  ${RED}STALE${NC}: $(basename "$f") (${days} days old, no STATUS header)"
    ttl_violations=$((ttl_violations + 1))
  elif [ "$days" -gt 14 ] && [ "$has_status" -eq 0 ]; then
    echo -e "  ${YELLOW}VERY STALE${NC}: $(basename "$f") (${days} days old, no STATUS header)"
  fi
done
if [ "$ttl_violations" -eq 0 ]; then
  echo -e "  ${GREEN}OK${NC} — all pending-changes have STATUS headers or are <7 days old"
fi
echo

# --- 3. Test baseline check (vs spec §11.4) --------------------------------
echo -e "${CYAN}--- 3. Test baseline check (pre-existing fails) ---${NC}"
if [ -d "$API_ROOT/vendor" ]; then
  cd "$API_ROOT"
  api_fails=$(php artisan test 2>&1 | grep -oE "FAIL: [0-9]+" | grep -oE "[0-9]+" | head -1 || echo "0")
  if [ -z "$api_fails" ]; then api_fails="?"; fi
  echo "  hkial-api: $api_fails fails (spec §11.4: expect ≤ 9 = 1 contract + 5 matrix + 3 BUG-PINNED)"
else
  echo "  hkial-api: SKIPPED (vendor/ not installed — run composer install first)"
fi
if [ -d "$ADMIN_ROOT/node_modules" ]; then
  cd "$ADMIN_ROOT"
  vitest_out=$(npx vitest run --reporter=basic 2>&1 | tail -3)
  echo "  hkial-react vitest: $vitest_out"
else
  echo "  hkial-react: SKIPPED (node_modules/ not installed)"
fi
echo

# --- 4. figma-ui dirty state (spec §10.2) -----------------------------------
echo -e "${CYAN}--- 4. figma-ui submodule dirty state ---${NC}"
for figma_dir in \
  "$CUSTOMER_ROOT/src/components/figma-ui" \
  "$ADMIN_ROOT/src/components/figma-ui"; do
  if [ -d "$figma_dir" ]; then
    label=$(echo "$figma_dir" | sed 's|.*/figma-ui/||;s|src/components/figma-ui||')
    cd "$figma_dir"
    dirty=$(git status --short 2>/dev/null | head -5)
    if [ -n "$dirty" ]; then
      echo -e "  ${YELLOW}DIRTY${NC} ($label):"
      echo "$dirty" | sed 's/^/    /'
    else
      echo -e "  ${GREEN}CLEAN${NC} ($label)"
    fi
  fi
done
echo

# --- 5. Cross-doc consistency (legacy docs missing HKIAL/spec.md banner) ---
echo -e "${CYAN}--- 5. Cross-doc consistency (missing banners) ---${NC}"
banner_violations=0
for old_doc in \
  "$HKIAL_ROOT/backend/spec.md" \
  "$CUSTOMER_ROOT/PROJECT_SUMMARY.md" \
  "$CUSTOMER_ROOT/DEVELOPMENT_GUIDE.md" \
  "$CUSTOMER_ROOT/BOOKING_VIEW_INVENTORY.md" \
  "$CUSTOMER_ROOT/PROMO_CODE_INVENTORY.md"; do
  [ -e "$old_doc" ] || continue
  has_banner=$(grep -c "HKIAL/spec.md" "$old_doc" 2>/dev/null)
  has_banner=${has_banner:-0}
  if [ "$has_banner" -eq 0 ]; then
    echo -e "  ${RED}MISSING BANNER${NC}: $old_doc"
    banner_violations=$((banner_violations + 1))
  fi
done
if [ "$banner_violations" -eq 0 ]; then
  echo -e "  ${GREEN}OK${NC} — all legacy docs have HKIAL/spec.md banner"
fi
echo

# --- 6. Skill version + last-verified (spec §16.1 Rule 4) -------------------
echo -e "${CYAN}--- 6. Skill versions + last-verified ---${NC}"
no_version=0
no_verified=0
for skill in "$HKIAL_ROOT/HKIAL/skills"/*/SKILL.md \
             "$HOME/.hermes/skills/software-development/hkial"*/SKILL.md; do
  [ -e "$skill" ] || continue
  version=$(grep -E "^version:" "$skill" 2>/dev/null | head -1 | awk '{print $2}')
  last_verified=$(grep -E "^[[:space:]]*last-verified:" "$skill" 2>/dev/null | head -1 | awk -F: '{print $2}' | xargs)
  skill_name=$(basename "$(dirname "$skill")")
  if [ -z "$version" ]; then
    echo -e "  ${YELLOW}NO VERSION${NC}: $skill_name"
    no_version=$((no_version + 1))
  elif [ -z "$last_verified" ]; then
    echo -e "  ${YELLOW}NO last-verified${NC}: $skill_name (v$version)"
    no_verified=$((no_verified + 1))
  fi
done
if [ "$no_version" -eq 0 ] && [ "$no_verified" -eq 0 ]; then
  echo -e "  ${GREEN}OK${NC} — all skills have version + last-verified"
fi
echo

# --- 7. Spec.md freshness (spec §0.3 + §16.6) ------------------------------
echo -e "${CYAN}--- 7. Spec.md freshness check ---${NC}"
if [ -e "$SPEC_FILE" ]; then
  spec_age=$(($(date +%s) - $(stat -f %m "$SPEC_FILE" 2>/dev/null || stat -c %Y "$SPEC_FILE")))
  spec_days=$((spec_age / 86400))
  if [ "$spec_days" -gt 14 ]; then
    echo -e "  ${RED}SPEC STALE${NC}: $SPEC_FILE is ${spec_days} days old (>14 — force a §14 review)"
  elif [ "$spec_days" -gt 7 ]; then
    echo -e "  ${YELLOW}SPEC AGING${NC}: $SPEC_FILE is ${spec_days} days old (>7 — review §14)"
  else
    echo -e "  ${GREEN}OK${NC}: $SPEC_FILE is ${spec_days} days old"
  fi
  echo "  spec version line: $(head -2 "$SPEC_FILE" | tail -1 | head -c 100)"
else
  echo -e "  ${RED}MISSING${NC}: $SPEC_FILE"
fi
echo

# --- 8. INV count (spec §2 + §3) -------------------------------------------
echo -e "${CYAN}--- 8. INV count (cross-project + backend) ---${NC}"
if [ -e "$SPEC_FILE" ]; then
  inv_x=$(grep -oE "INV-X[0-9]+" "$SPEC_FILE" | sort -u | wc -l | tr -d ' ')
  inv_num=$(grep -oE "INV-[0-9]+" "$SPEC_FILE" | grep -v "INV-X" | sort -u | wc -l | tr -d ' ')
  echo "  Cross-project (INV-X1..X10): $inv_x distinct IDs (expect 10)"
  echo "  Backend (INV-1..13): $inv_num distinct IDs (expect 13, gaps in sequence OK if retired)"
fi
echo

# --- Summary ----------------------------------------------------------------
echo -e "${CYAN}=== Audit complete ===${NC}"
echo
echo "Use this output to update HKIAL/spec.md §14 (open bugs) and §16.5 (rot radar)."
echo "If a spec change is needed, follow HKIAL/spec.md §0.3 update rule (deltas, not rewrites)."
