#!/usr/bin/env bash
# Install the 9Router GNOME Shell extension + systemd user unit.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_UUID="9router@indicator"
EXT_DIR="${HOME}/.local/share/gnome-shell/extensions/${EXT_UUID}"
UNIT_DIR="${HOME}/.config/systemd/user"
BIN_DIR="${HOME}/.local/bin"

command -v 9router >/dev/null 2>&1 || {
  echo "error: '9router' not found in PATH. Install it first: npm i -g 9router" >&2
  exit 1
}
command -v glib-compile-schemas >/dev/null 2>&1 || {
  echo "error: 'glib-compile-schemas' not found. Install glib2-devel or libglib2.0-bin." >&2
  exit 1
}

command -v gnome-shell >/dev/null 2>&1 && echo "GNOME Shell: $(gnome-shell --version)"

mkdir -p "$EXT_DIR/schemas" "$UNIT_DIR" "$BIN_DIR"

cp "$REPO_DIR/extension/metadata.json" "$EXT_DIR/"
cp "$REPO_DIR/extension/extension.js" "$EXT_DIR/"
cp "$REPO_DIR/extension/prefs.js" "$EXT_DIR/"
cp "$REPO_DIR/extension/stylesheet.css" "$EXT_DIR/"
cp "$REPO_DIR/extension/schemas/org.gnome.shell.extensions.9router.gschema.xml" "$EXT_DIR/schemas/"
glib-compile-schemas "$EXT_DIR/schemas"

cp "$REPO_DIR/systemd/9router.service" "$UNIT_DIR/"
install -m 755 "$REPO_DIR/bin/9router-ctl" "$BIN_DIR/9router-ctl"

systemctl --user daemon-reload
systemctl --user enable --now 9router.service

gsettings set org.gnome.shell enabled-extensions "$(gsettings get org.gnome.shell enabled-extensions | sed "s/]$/, '${EXT_UUID}']/")" 2>/dev/null || true

echo
echo "Installed:"
echo "  extension -> $EXT_DIR"
echo "  unit      -> $UNIT_DIR/9router.service"
echo "  script    -> $BIN_DIR/9router-ctl"
echo
echo "Log out and back in (Wayland) to load the top-bar indicator."
echo "Settings: gnome-extensions prefs ${EXT_UUID}"
