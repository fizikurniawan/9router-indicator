# 9Router GNOME Shell extension

A GNOME Shell top-bar indicator to start, stop and restart the
[9Router](https://www.npmjs.com/package/9router) AI gateway, similar to the
WireGuard tunnel indicator.

![status](https://img.shields.io/badge/GNOME%20Shell-45--50-blue)

## What it does

A small **9R** label with a status dot in the top bar:

- 🟢 green dot — gateway running
- ⚪ grey dot — gateway stopped

Click it to open a menu:

- status line (`● Running — http://127.0.0.1:20128` or `○ Stopped`)
- **Start**, **Stop**, **Restart**
- **Open Dashboard** (opens the web UI in your browser)

The status refreshes every 3 seconds by testing TCP port 20128. The menu
actions call `systemctl --user` on the bundled `9router.service` unit, so the
gateway survives independently of the shell or any launcher window.

## Requirements

- GNOME Shell 45–50 (tested on 50.6, Wayland)
- 9Router installed globally: `npm i -g 9router` (provides `/usr/local/bin/9router`)
- systemd user session (default on Fedora, Ubuntu, Arch, …)

## Install

```bash
git clone <this-repo> ~/Work/9router-gnome
cd ~/Work/9router-gnome
./install.sh
```

Then **log out and log back in**. On Wayland there is no `Alt+F2 r`, so a
re-login is required for the newly installed extension to load.

After re-login you should see the **9R** dot in the top bar.

## Usage

| Action | How |
|---|---|
| Start / stop / restart | Click the **9R** indicator → menu items |
| Open dashboard | Click the indicator → **Open Dashboard** |
| CLI | `9router-ctl status\|start\|stop\|restart\|toggle\|open` |
| systemd | `systemctl --user status 9router.service` |

> ⚠️ If you talk to an LLM **through** 9Router, stopping the gateway cuts that
> connection. Use **Restart** to test safely.

## Layout

```
9router-gnome/
├── extension/
│   ├── metadata.json      # extension manifest (uuid 9router@local)
│   ├── extension.js       # PanelMenu indicator
│   ├── prefs.js           # preferences window (port/unit/poll)
│   ├── stylesheet.css     # status dot styles
│   └── schemas/
│       └── org.gnome.shell.extensions.9router.gschema.xml
├── systemd/
│   └── 9router.service    # user unit running the gateway
├── bin/
│   └── 9router-ctl        # control helper (status/start/stop/…)
├── install.sh
├── uninstall.sh
└── README.md
```

## Configuration

Settings live in GSettings under the schema
`org.gnome.shell.extensions.9router`. Open the preferences with:

```bash
gnome-extensions prefs 9router@local
```

or via GNOME Settings -> Extensions -> 9Router -> gear icon.

| Key | Type | Default | Meaning |
|---|---|---|---|
| `port` | int (1-65535) | `20128` | Port the gateway listens on; used for the status check and the dashboard URL |
| `unit` | string | `9router.service` | systemd --user unit the menu actions drive |
| `poll-interval` | int (1-60) | `3` | Seconds between status checks |

You can also set them from the CLI, e.g.:

```bash
gsettings set org.gnome.shell.extensions.9router port 20128
gsettings set org.gnome.shell.extensions.9router unit 9router.service
```

Changes are picked up immediately (the indicator re-polls and reschedules on
`changed`).

**If you change the port**, also update `ExecStart` in
`systemd/9router.service` so the gateway actually listens there. The unit's
`ExecStart` assumes `/usr/local/bin/9router`; adjust it if
`command -v 9router` points elsewhere.

## Troubleshooting

Check whether the extension is loaded:

```bash
gnome-extensions info 9router@local
gnome-extensions list --enabled | grep 9router
```

Look for load errors:

```bash
journalctl --user -b -o cat | grep -i 9router | tail -20
```

Check the gateway unit:

```bash
systemctl --user status 9router.service
journalctl --user -u 9router.service -n 50 --no-pager
```

If the indicator never appears, confirm the extension directory name matches
the uuid (`9router@local`) and that no duplicate copy with the same uuid
exists under `~/.local/share/gnome-shell/extensions/`.

## Uninstall

```bash
cd ~/Work/9router-gnome
./uninstall.sh
```

Then log out and back in.

## Notes

9Router (0.5.x) advertises a `--tray` flag but does not ship a working Linux
tray in this build. If upstream adds a real tray later, this extension becomes
optional.

## License

GPL-2.0-or-later. See [LICENSE](LICENSE).
