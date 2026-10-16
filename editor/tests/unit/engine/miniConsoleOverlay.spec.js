import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import MiniConsoleOverlay from '@core/Util/MiniConsoleOverlay.js';
import Config from '@core/Core/Config.js';
import { bus } from '@core/Util/EventBus.js';

describe('MiniConsoleOverlay', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        Config.ENGINE_MODE = 'runtime';
    });

    afterEach(() => {
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        Config.ENGINE_MODE = 'runtime';
    });

    it('initializes DOM and is visible when active is true', () => {
        const overlay = new MiniConsoleOverlay(container, {
            active: true,
            position: 'top-right',
            isPreview: true
        });

        expect(overlay.isVisible).toBe(true);
        expect(overlay.domElement).not.toBeNull();
        expect(overlay.domElement.id).toBe('lupis-mini-console');
        expect(overlay.domElement.style.display).toBe('flex');
        expect(container.contains(overlay.domElement)).toBe(true);

        overlay.destroy();
    });

    it('does not create DOM or bind events when active is false', () => {
        const overlay = new MiniConsoleOverlay(container, {
            active: false,
            isPreview: true
        });

        expect(overlay.isVisible).toBe(false);
        expect(overlay.domElement).toBeNull();

        // Toggling or opening when active is false should do nothing
        overlay.toggle();
        expect(overlay.isVisible).toBe(false);
        expect(overlay.domElement).toBeNull();

        overlay.destroy();
    });

    it('toggles visibility with Ctrl + F2 in game preview mode', () => {
        const overlay = new MiniConsoleOverlay(container, {
            active: true,
            isPreview: true
        });

        expect(overlay.isVisible).toBe(true);
        expect(overlay.domElement.style.display).toBe('flex');

        // First Ctrl + F2: closes console
        const event1 = new KeyboardEvent('keydown', {
            key: 'F2',
            code: 'F2',
            ctrlKey: true,
            bubbles: true,
            cancelable: true
        });
        window.dispatchEvent(event1);

        expect(overlay.isVisible).toBe(false);
        expect(overlay.domElement.style.display).toBe('none');
        expect(event1.defaultPrevented).toBe(true);

        // Second Ctrl + F2: reopens console
        const event2 = new KeyboardEvent('keydown', {
            key: 'F2',
            code: 'F2',
            ctrlKey: true,
            bubbles: true,
            cancelable: true
        });
        window.dispatchEvent(event2);

        expect(overlay.isVisible).toBe(true);
        expect(overlay.domElement.style.display).toBe('flex');

        overlay.destroy();
    });

    it('supports Meta + F2 (Cmd on Mac) as Ctrl equivalent', () => {
        const overlay = new MiniConsoleOverlay(container, {
            active: true,
            isPreview: true
        });

        const event = new KeyboardEvent('keydown', {
            key: 'F2',
            metaKey: true,
            bubbles: true,
            cancelable: true
        });
        window.dispatchEvent(event);

        expect(overlay.isVisible).toBe(false);
        expect(overlay.domElement.style.display).toBe('none');

        overlay.destroy();
    });

    it('does not toggle on F2 without Ctrl or Meta', () => {
        const overlay = new MiniConsoleOverlay(container, {
            active: true,
            isPreview: true
        });

        const event = new KeyboardEvent('keydown', {
            key: 'F2',
            ctrlKey: false,
            metaKey: false,
            bubbles: true,
            cancelable: true
        });
        window.dispatchEvent(event);

        expect(overlay.isVisible).toBe(true);
        expect(overlay.domElement.style.display).toBe('flex');

        overlay.destroy();
    });

    it('does not toggle when Alt or Shift modifier is pressed with Ctrl+F2', () => {
        const overlay = new MiniConsoleOverlay(container, {
            active: true,
            isPreview: true
        });

        const altEvent = new KeyboardEvent('keydown', {
            key: 'F2',
            ctrlKey: true,
            altKey: true,
            bubbles: true,
            cancelable: true
        });
        window.dispatchEvent(altEvent);
        expect(overlay.isVisible).toBe(true);

        const shiftEvent = new KeyboardEvent('keydown', {
            key: 'F2',
            ctrlKey: true,
            shiftKey: true,
            bubbles: true,
            cancelable: true
        });
        window.dispatchEvent(shiftEvent);
        expect(overlay.isVisible).toBe(true);

        overlay.destroy();
    });

    it('does NOT toggle in editor mode (ENGINE_MODE === "editor")', () => {
        Config.ENGINE_MODE = 'editor';

        const overlay = new MiniConsoleOverlay(container, {
            active: true,
            isPreview: true
        });

        const event = new KeyboardEvent('keydown', {
            key: 'F2',
            ctrlKey: true,
            bubbles: true,
            cancelable: true
        });
        window.dispatchEvent(event);

        // Remains open, not toggled
        expect(overlay.isVisible).toBe(true);
        expect(overlay.domElement.style.display).toBe('flex');

        overlay.destroy();
    });

    it('does NOT toggle if isPreview is false', () => {
        const overlay = new MiniConsoleOverlay(container, {
            active: true,
            isPreview: false
        });

        const event = new KeyboardEvent('keydown', {
            key: 'F2',
            ctrlKey: true,
            bubbles: true,
            cancelable: true
        });
        window.dispatchEvent(event);

        // Remains open, not toggled
        expect(overlay.isVisible).toBe(true);
        expect(overlay.domElement.style.display).toBe('flex');

        overlay.destroy();
    });

    it('closes when close button in header is clicked and reopens with Ctrl + F2', () => {
        const overlay = new MiniConsoleOverlay(container, {
            active: true,
            isPreview: true
        });

        const closeBtn = overlay.domElement.querySelector('[data-testid="mini-console-close-btn"]');
        expect(closeBtn).not.toBeNull();

        closeBtn.click();

        expect(overlay.isVisible).toBe(false);
        expect(overlay.domElement.style.display).toBe('none');

        // Reopen with Ctrl + F2
        const event = new KeyboardEvent('keydown', {
            key: 'F2',
            ctrlKey: true,
            bubbles: true,
            cancelable: true
        });
        window.dispatchEvent(event);

        expect(overlay.isVisible).toBe(true);
        expect(overlay.domElement.style.display).toBe('flex');

        overlay.destroy();
    });

    it('cleans up DOM and listeners on destroy', () => {
        const overlay = new MiniConsoleOverlay(container, {
            active: true,
            isPreview: true
        });

        overlay.destroy();

        expect(overlay.domElement).toBeNull();
        expect(container.children.length).toBe(0);

        // Dispatching after destroy should not throw
        const event = new KeyboardEvent('keydown', {
            key: 'F2',
            ctrlKey: true,
            bubbles: true
        });
        expect(() => window.dispatchEvent(event)).not.toThrow();
    });
});
