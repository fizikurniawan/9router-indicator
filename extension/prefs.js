// SPDX-License-Identifier: GPL-2.0-or-later
//
// Preferences for the 9Router GNOME Shell indicator.

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class NineRouterPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: '9Router',
            icon_name: 'preferences-system-symbolic',
        });

        const group = new Adw.PreferencesGroup({
            title: 'Gateway',
            description: 'Where the 9Router gateway runs and how to manage it.',
        });
        page.add(group);

        const portRow = new Adw.SpinRow({
            title: 'Port',
            subtitle: 'TCP port the 9Router gateway listens on',
            adjustment: new Gtk.Adjustment({
                lower: 1,
                upper: 65535,
                step_increment: 1,
                page_increment: 100,
                value: settings.get_int('port'),
            }),
        });
        settings.bind('port', portRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        group.add(portRow);

        const unitRow = new Adw.EntryRow({
            title: 'systemd user unit',
        });
        unitRow.text = settings.get_string('unit');
        unitRow.connect('changed', () => {
            const text = unitRow.text.trim();
            if (text.length > 0)
                settings.set_string('unit', text);
        });
        group.add(unitRow);

        const pollRow = new Adw.SpinRow({
            title: 'Status poll interval',
            subtitle: 'Seconds between gateway status checks',
            adjustment: new Gtk.Adjustment({
                lower: 1,
                upper: 60,
                step_increment: 1,
                page_increment: 5,
                value: settings.get_int('poll-interval'),
            }),
        });
        settings.bind('poll-interval', pollRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        group.add(pollRow);

        window.add(page);
    }
}
