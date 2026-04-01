// ═══════════════════════════════════════════════════════════════════════════
//  DRE Lab — Unified Theme Engine
//  Persists in localStorage (per-user / per-browser).
//  Syncs across tabs via StorageEvent.
// ═══════════════════════════════════════════════════════════════════════════

(function () {
    'use strict';

    const STORAGE_KEY = 'dre-theme';
    const DEFAULT_THEME = 'dracula';

    const THEMES = [
        { id: 'default',   name: 'Classic Light',  cls: '' },
        { id: 'dracula',   name: 'Dracula',        cls: 'theme-dracula' },
        { id: 'cyberpunk', name: 'Cyberpunk',      cls: 'theme-cyberpunk' },
        { id: 'academic',  name: 'Light Academic', cls: 'theme-academic' },
        { id: 'contrast',  name: 'High Contrast',  cls: 'theme-contrast' },
    ];

    // ── Apply theme to <html> element ───────────────────────────────────
    function applyTheme(id) {
        const theme = THEMES.find(t => t.id === id) || THEMES.find(t => t.id === DEFAULT_THEME);
        const html = document.documentElement;

        // Remove all theme classes
        THEMES.forEach(t => { if (t.cls) html.classList.remove(t.cls); });

        // Add new theme class
        if (theme.cls) html.classList.add(theme.cls);

        // Update any theme selectors on the page
        document.querySelectorAll('[data-dre-theme-select]').forEach(sel => {
            sel.value = theme.id;
        });

        return theme;
    }

    // ── Get current theme ───────────────────────────────────────────────
    function getTheme() {
        return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
    }

    // ── Set and persist theme ───────────────────────────────────────────
    function setTheme(id) {
        localStorage.setItem(STORAGE_KEY, id);
        applyTheme(id);
        // Dispatch custom event for same-page React / other listeners
        window.dispatchEvent(new CustomEvent('dre-theme-changed', { detail: { theme: id } }));
    }

    // ── Cross-tab synchronization via StorageEvent ──────────────────────
    window.addEventListener('storage', function (e) {
        if (e.key === STORAGE_KEY && e.newValue) {
            applyTheme(e.newValue);
        }
    });

    // ── Apply saved theme immediately (before DOM renders) ─────────────
    applyTheme(getTheme());

    // ── Inject theme-switcher widget ────────────────────────────────────
    function injectSwitcher() {
        // Don't inject if lab.html (React manages its own switcher)
        if (document.getElementById('dre-no-auto-switcher')) return;

        const container = document.getElementById('dre-theme-switcher-mount')
            || document.body;

        // If explicit mount point, inject inline; otherwise create floating widget
        const isFloating = !document.getElementById('dre-theme-switcher-mount');

        const wrapper = document.createElement('div');
        wrapper.className = 'dre-theme-switcher';
        if (!isFloating) {
            wrapper.style.position = 'static';
            wrapper.style.boxShadow = 'none';
        }

        // Icon
        wrapper.innerHTML = `
            <svg class="theme-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
            </svg>
        `;

        const select = document.createElement('select');
        select.setAttribute('data-dre-theme-select', '');
        THEMES.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.name;
            if (t.id === getTheme()) opt.selected = true;
            select.appendChild(opt);
        });

        select.addEventListener('change', function () {
            setTheme(this.value);
        });

        wrapper.appendChild(select);

        if (isFloating) {
            document.body.appendChild(wrapper);
        } else {
            container.appendChild(wrapper);
        }
    }

    // ── Expose API globally ─────────────────────────────────────────────
    window.DRETheme = {
        get: getTheme,
        set: setTheme,
        apply: applyTheme,
        themes: THEMES,
        injectSwitcher: injectSwitcher,
    };

    // ── Auto-inject switcher when DOM is ready ──────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectSwitcher);
    } else {
        injectSwitcher();
    }
})();
