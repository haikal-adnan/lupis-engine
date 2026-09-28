import { bus } from "./EventBus.js";

export default class MiniConsoleOverlay {
    constructor(container, debugConfig = {}) {
        this.container = container || document.body;
        this.config = {
            active: debugConfig.active ?? true,
            position: debugConfig.position || 'top-right',
            width: debugConfig.width ?? 360,
            height: debugConfig.height ?? 220,
            maxLogs: debugConfig.maxLogs ?? 50
        };

        this.logs = [];
        this.domElement = null;
        this.logContainer = null;
        this._listeners = [];

        if (this.config.active) {
            this._initDOM();
            this._bindEvents();
        }
    }

    _initDOM() {
        // Buat elemen overlay utama
        this.domElement = document.createElement('div');
        this.domElement.id = 'lupis-mini-console';
        
        // CSS Style bawaan tanpa dependensi luar
        Object.assign(this.domElement.style, {
            position: 'absolute',
            zIndex: '9999',
            width: `${this.config.width}px`,
            height: `${this.config.height}px`,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            color: '#f8fafc',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '11px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            pointerEvents: 'auto',
            transition: 'all 0.2s ease'
        });

        // Terapkan penentuan posisi dari 9-point grid
        this._applyPositionStyle(this.config.position);

        // Render Header
        const header = document.createElement('div');
        Object.assign(header.style, {
            padding: '4px 8px',
            backgroundColor: 'rgba(30, 41, 59, 0.9)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            userSelect: 'none'
        });

        const title = document.createElement('span');
        title.innerText = '❖ Debug Console';
        title.style.fontWeight = 'bold';
        title.style.color = '#38bdf8';

        const clearBtn = document.createElement('button');
        clearBtn.innerText = 'Clear';
        Object.assign(clearBtn.style, {
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '10px',
            cursor: 'pointer',
            padding: '2px 4px'
        });
        clearBtn.onclick = () => this.clear();

        header.appendChild(title);
        header.appendChild(clearBtn);
        this.domElement.appendChild(header);

        // Render Log Container List
        this.logContainer = document.createElement('div');
        Object.assign(this.logContainer.style, {
            flex: '1',
            overflowY: 'auto',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
        });
        this.domElement.appendChild(this.logContainer);

        this.container.appendChild(this.domElement);
    }

    _applyPositionStyle(pos) {
        const style = this.domElement.style;
        style.top = 'auto';
        style.bottom = 'auto';
        style.left = 'auto';
        style.right = 'auto';
        style.transform = 'none';

        const margin = '12px';

        switch (pos) {
            case 'top-left':
                style.top = margin; style.left = margin; break;
            case 'top-center':
                style.top = margin; style.left = '50%'; style.transform = 'translateX(-50%)'; break;
            case 'top-right':
                style.top = margin; style.right = margin; break;
            case 'middle-left':
                style.top = '50%'; style.left = margin; style.transform = 'translateY(-50%)'; break;
            case 'middle-center':
                style.top = '50%'; style.left = '50%'; style.transform = 'translate(-50%, -50%)'; break;
            case 'middle-right':
                style.top = '50%'; style.right = margin; style.transform = 'translateY(-50%)'; break;
            case 'bottom-left':
                style.bottom = margin; style.left = margin; break;
            case 'bottom-center':
                style.bottom = margin; style.left = '50%'; style.transform = 'translateX(-50%)'; break;
            case 'bottom-right':
                style.bottom = margin; style.right = margin; break;
            default:
                style.top = margin; style.right = margin; break;
        }
    }

    _bindEvents() {
        const onLog = (data) => this.addLog(data);
        bus.on('console:log', onLog);
        bus.on('console:warn', onLog);
        bus.on('console:error', onLog);

        this._listeners.push(
            { event: 'console:log', fn: onLog },
            { event: 'console:warn', fn: onLog },
            { event: 'console:error', fn: onLog }
        );
    }

    addLog(data) {
        if (!this.config.active || !this.logContainer) return;

        const msgText = typeof data.message === 'object' ? JSON.stringify(data.message) : String(data.message ?? '');
        const sourceText = data.source || 'App';
        const type = data.type || 'log';

        // Aggregation: Gabungkan jika log beruntun sama persis (terutama pada tick loop)
        const lastLog = this.logs[this.logs.length - 1];
        if (lastLog && lastLog.message === msgText && lastLog.source === sourceText && lastLog.type === type) {
            lastLog.count = (lastLog.count || 1) + 1;
            this._updateLastLogDOM(lastLog);
            return;
        }

        const logEntry = {
            id: Date.now() + Math.random(),
            message: msgText,
            source: sourceText,
            type: type,
            count: 1
        };

        this.logs.push(logEntry);
        if (this.logs.length > this.config.maxLogs) {
            this.logs.shift();
            if (this.logContainer.firstChild) {
                this.logContainer.removeChild(this.logContainer.firstChild);
            }
        }

        this._renderLogItem(logEntry);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }

    _renderLogItem(logEntry) {
        const item = document.createElement('div');
        item.dataset.id = logEntry.id;
        
        let color = '#cbd5e1';
        if (logEntry.type === 'warn') color = '#fbbf24';
        if (logEntry.type === 'error') color = '#f87171';

        Object.assign(item.style, {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
            color: color,
            lineHeight: '1.3',
            wordBreak: 'break-all'
        });

        item.innerHTML = `
            <span style="color: #64748b; font-size: 9px; shrink: 0;">[${logEntry.source}]</span>
            <span class="log-msg" style="flex: 1;">${logEntry.message}</span>
            <span class="log-count" style="display: none; background: #334155; color: #f1f5f9; padding: 0 4px; border-radius: 9999px; font-size: 9px;">1</span>
        `;

        this.logContainer.appendChild(item);
    }

    _updateLastLogDOM(logEntry) {
        const lastItem = this.logContainer.lastElementChild;
        if (lastItem) {
            const countEl = lastItem.querySelector('.log-count');
            if (countEl) {
                countEl.innerText = logEntry.count;
                countEl.style.display = 'inline-block';
            }
        }
    }

    clear() {
        this.logs = [];
        if (this.logContainer) {
            this.logContainer.innerHTML = '';
        }
    }

    destroy() {
        this._listeners.forEach(({ event, fn }) => bus.off(event, fn));
        this._listeners = [];
        if (this.domElement && this.domElement.parentNode) {
            this.domElement.parentNode.removeChild(this.domElement);
        }
    }
}