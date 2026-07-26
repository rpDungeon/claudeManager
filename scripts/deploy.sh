#!/usr/bin/env bash
set -euo pipefail

USER_ID="$(id -u)"
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$USER_ID}"
export DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS:-unix:path=$XDG_RUNTIME_DIR/bus}"

ROOT_DIR="$(realpath "$(dirname "${BASH_SOURCE[0]}")/..")"
BUN_EXECUTABLE="$(command -v bun)"
BUN_BIN="$(dirname "$BUN_EXECUTABLE")"
BUN_INSTALL="$(dirname "$BUN_BIN")"
UNIT_NAME="claude-manager.service"
UNIT_TEMPLATE="$ROOT_DIR/deploy/systemd/$UNIT_NAME.template"
UNIT_DESTINATION="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user/$UNIT_NAME"

manager_process_group_verify() {
	local main_pid
	local main_process_group
	main_pid="$(systemctl --user show "$UNIT_NAME" --property=MainPID --value 2>/dev/null || true)"
	if [[ -n "$main_pid" && "$main_pid" != "0" ]]; then
		main_process_group="$(ps -o pgid= -p "$main_pid" | xargs)"
		if [[ "$main_process_group" != "$main_pid" ]]; then
			printf 'Refusing deploy: %s MainPID %s is not process-group leader.\n' "$UNIT_NAME" "$main_pid" >&2
			exit 1
		fi
	fi
}

(
	cd "$ROOT_DIR"
	"$BUN_EXECUTABLE" install --frozen-lockfile
	"$BUN_EXECUTABLE" run build
)

unit_content="$(<"$UNIT_TEMPLATE")"
unit_content="${unit_content//__CLAUDE_MANAGER_ROOT__/$ROOT_DIR}"
unit_content="${unit_content//__BUN_EXECUTABLE__/$BUN_EXECUTABLE}"
unit_content="${unit_content//__BUN_INSTALL__/$BUN_INSTALL}"
unit_content="${unit_content//__BUN_BIN__/$BUN_BIN}"
unit_content="${unit_content//__HOME__/$HOME}"

unit_temp="$(mktemp --suffix=.service)"
trap 'rm -f "$unit_temp"' EXIT
printf '%s\n' "$unit_content" > "$unit_temp"
systemd-analyze verify "$unit_temp"
install -Dm0644 "$unit_temp" "$UNIT_DESTINATION"

systemctl --user daemon-reload
manager_process_group_verify
systemctl --user enable "$UNIT_NAME"
systemctl --user restart "$UNIT_NAME"
systemctl --user is-active --quiet "$UNIT_NAME"

printf '%s deployed from %s.\n' "$UNIT_NAME" "$ROOT_DIR"
