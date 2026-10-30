#!/usr/bin/env bash
# Remove the 9Router GNOME Shell extension, unit and control script.
set -euo pipefail

EXT_UUID="9router@indicator"
EXT_DIR="${HOME}/.local/share/gnome-shell/extensions/${EXT_UUID}"

systemctl --user disable --now 9router.service 2>/dev/null || true
rm -f "${HOME}/.config/systemd/user/9router.service"
rm -rf "$EXT_DIR"
rm -f "${HOME}/.local/bin/9router-ctl"
systemctl --user daemon-reload 2>/dev/null || true

gsettings set org.gnome.shell enabled-extensions "$(gsettings get org.gnome.shell enabled-extensions | sed "s/, '${EXT_UUID}'//; s/'${EXT_UUID}', //; s/'${EXT_UUID}'//")" 2>/dev/null || true

echo "Removed extension, unit and control script. Log out and back in to update the top bar."
