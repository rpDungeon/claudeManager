#!/usr/bin/env bash
set -euo pipefail

MAIN_PID="${1:?Main PID required}"
MAIN_PROCESS_GROUP="$(ps -o pgid= -p "$MAIN_PID" | xargs)"

if [[ "$MAIN_PROCESS_GROUP" != "$MAIN_PID" ]]; then
	printf 'Refusing stop: MainPID %s is not process-group leader.\n' "$MAIN_PID" >&2
	exit 1
fi

process_group_wait() {
	local attempts="$1"
	for ((attempt = 0; attempt < attempts; attempt++)); do
		if ! kill -0 -- "-$MAIN_PROCESS_GROUP" 2>/dev/null; then
			return 0
		fi
		sleep 0.1
	done
	return 1
}

kill -INT -- "-$MAIN_PROCESS_GROUP" 2>/dev/null || exit 0
process_group_wait 100 && exit 0
kill -TERM -- "-$MAIN_PROCESS_GROUP" 2>/dev/null || exit 0
process_group_wait 50 && exit 0
kill -KILL -- "-$MAIN_PROCESS_GROUP" 2>/dev/null || true
