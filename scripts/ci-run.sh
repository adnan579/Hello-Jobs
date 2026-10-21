#!/usr/bin/env bash
# Usage: bash scripts/ci-run.sh "<step name>" <command...>
# Runs a command; on failure in GitHub Actions also emits the tail of its output
# as an annotation, so the failure is readable from the checks API / PR page
# without opening the raw logs.
name="$1"; shift
log="$(mktemp)"
"$@" 2>&1 | tee "$log"
status=${PIPESTATUS[0]}
if [ "$status" -ne 0 ] && [ -n "${GITHUB_ACTIONS:-}" ]; then
  msg=$(tail -n 80 "$log" | sed -e 's/\x1b\[[0-9;]*[A-Za-z]//g' -e 's/%/%25/g' | awk '{printf "%s%%0A", $0}')
  echo "::error title=${name} failed (exit ${status})::${msg}"
fi
exit "$status"
