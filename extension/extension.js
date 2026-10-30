// SPDX-License-Identifier: GPL-2.0-or-later
//
// 9Router GNOME Shell indicator
// Start/stop/restart the 9Router AI gateway from the top bar.

import GObject from 'gi://GObject';
import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

function systemctl(args) {
    try {
        const proc = Gio.Subprocess.new(
            ['systemctl', '--user', ...args],
            Gio.SubprocessFlags.STDOUT_SILENCE | Gio.SubprocessFlags.STDERR_SILENCE
        );
        proc.wait_async(null, () => {});
    } catch (e) {
        logError(e, '9router: systemctl ' + args.join(' '));
    }
}

function portOpen(port, callback) {
    const client = new Gio.SocketClient();
    const addr = new Gio.InetSocketAddress({
        address: Gio.InetAddress.new_from_string('127.0.0.1'),
        port,
    });
    client.connect_async(addr, null, (src, res) => {
        let conn = null;
        try {
            conn = src.connect_finish(res);
        } catch (e) {
            conn = null;
        }
        if (conn) {
            try { conn.close(null); } catch (e) {}
        }
        callback(!!conn);
    });
}

const NineRouterIndicator = GObject.registerClass(
class NineRouterIndicator extends PanelMenu.Button {
    _init(settings) {
        super._init(0.0, '9Router', false);

        this._settings = settings;
        this._running = false;
        this._pollId = 0;
        this._settingsId = 0;

        const box = new St.BoxLayout({ style_class: 'panel-status-indicators-box' });
        this._dot = new St.Widget({ style_class: 'nine-dot', y_align: Clutter.ActorAlign.CENTER });
        this._label = new St.Label({
            text: `9R:${this._port()}`,
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'nine-label',
        });
        box.add_child(this._dot);
        box.add_child(this._label);
        this.add_child(box);

        this._statusItem = new PopupMenu.PopupMenuItem('Checking…', { reactive: false });
        this.menu.addMenuItem(this._statusItem);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this._startItem = new PopupMenu.PopupMenuItem('Start');
        this._startItem.connect('activate', () => {
            systemctl(['start', this._unit()]);
            this._scheduleRefresh(1500);
        });
        this.menu.addMenuItem(this._startItem);

        this._stopItem = new PopupMenu.PopupMenuItem('Stop');
        this._stopItem.connect('activate', () => {
            systemctl(['stop', this._unit()]);
            this._scheduleRefresh(1000);
        });
        this.menu.addMenuItem(this._stopItem);

        this._restartItem = new PopupMenu.PopupMenuItem('Restart');
        this._restartItem.connect('activate', () => {
            systemctl(['restart', this._unit()]);
            this._scheduleRefresh(2500);
        });
        this.menu.addMenuItem(this._restartItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this._openItem = new PopupMenu.PopupMenuItem('Open Dashboard');
        this._openItem.connect('activate', () => {
            Gio.AppInfo.launch_default_for_uri(`http://127.0.0.1:${this._port()}`, null);
        });
        this.menu.addMenuItem(this._openItem);

        this._settingsId = this._settings.connect('changed', () => this._restartPolling());

        this._refresh();
        this._startPolling();
    }

    _port() {
        return this._settings.get_int('port');
    }

    _unit() {
        return this._settings.get_string('unit');
    }

    _startPolling() {
        this._pollId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            this._settings.get_int('poll-interval'),
            () => {
                this._refresh();
                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    _stopPolling() {
        if (this._pollId) {
            GLib.source_remove(this._pollId);
            this._pollId = 0;
        }
    }

    _restartPolling() {
        this._stopPolling();
        this._refresh();
        this._startPolling();
    }

    _scheduleRefresh(delayMs) {
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, delayMs, () => {
            this._refresh();
            return GLib.SOURCE_REMOVE;
        });
    }

    _refresh() {
        portOpen(this._port(), up => this._setRunning(up));
    }

    _setRunning(up) {
        this._running = up;
        const url = `http://127.0.0.1:${this._port()}`;
        this._statusItem.label.text = up ? `● Running — ${url}` : `○ Stopped — ${url}`;
        this._label.text = `9R:${this._port()}`;
        this._dot.style_class = up ? 'nine-dot nine-dot-on' : 'nine-dot nine-dot-off';

        this._startItem.setSensitive(!up);
        this._stopItem.setSensitive(up);
        this._restartItem.setSensitive(up);
    }

    destroy() {
        this._stopPolling();
        if (this._settingsId) {
            this._settings.disconnect(this._settingsId);
            this._settingsId = 0;
        }
        super.destroy();
    }
});

export default class NineRouterExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._indicator = new NineRouterIndicator(this._settings);
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
        this._settings = null;
    }
}
