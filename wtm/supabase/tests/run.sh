#!/usr/bin/env bash
# Apply every migration to a throwaway local Postgres and assert the schema
# actually behaves. No Supabase project, no network, no cost — just postgres +
# postgis on this machine.
#
#   sudo apt-get install -y postgresql-16 postgresql-16-postgis-3
#   supabase/tests/run.sh
#
# Exits non-zero if any migration errors or any assertion fails.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS="$HERE/../migrations"
DB="${WTM_TEST_DB:-wtm_test}"

dropdb --if-exists "$DB" 2>/dev/null
createdb "$DB" || exit 1
psql -q -d "$DB" -v ON_ERROR_STOP=1 -f "$HERE/00_supabase_shim.sql" >/dev/null || exit 1

failed=0
for f in "$MIGRATIONS"/*.sql; do
  err=$(psql -q -d "$DB" -v ON_ERROR_STOP=1 -f "$f" 2>&1 >/dev/null | grep ERROR)
  if [ -n "$err" ]; then
    echo "MIGRATION FAILED: $(basename "$f")"
    echo "$err" | head -3
    failed=$((failed + 1))
  fi
done

out=$(psql -q -d "$DB" -f "$HERE/01_functional.sql" 2>&1 | sed 's/^psql.*NOTICE:  //')
echo "$out" | grep -E '^(PASS|FAIL)'
pass=$(echo "$out" | grep -c '^PASS')
fail=$(echo "$out" | grep -c '^FAIL')

echo
echo "migrations failed: $failed   assertions: $pass passed, $fail failed"
[ "$failed" -eq 0 ] && [ "$fail" -eq 0 ]
