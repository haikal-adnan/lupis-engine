# UI & Unit Test Standard

## 1. Purpose

UI and Unit tests verify individual functions, modules, composables, and Vue 3 UI components in complete isolation.

The primary objective is to validate that each isolated unit fulfills its behavioral contract, correctly handles inputs and edge cases, and emits expected outputs without relying on full integration dependencies.

---

## 2. Testing Framework & Environment

- **Runner:** Vitest (`^5.0.0`)
- **Environment:** `happy-dom` / `jsdom`
- **Component Testing:** `@vue/test-utils` (`^2.5.0`)
- **State Management:** Pinia (`createPinia`, `setActivePinia`)

---

## 3. Rules

UI and Unit tests must adhere to the following rules:

1. **Isolation:** Test one function, module, or component at a time.
2. **Behavior Over Implementation:** Test what the component or function produces (DOM rendering, return values, emitted events, state changes) rather than private internal implementation details.
3. **Language:** Use clear, concise English for all `describe()` and `it()` block descriptions.
4. **No "Should" Prefixes:** Do not start `it()` descriptions with the word "should".
5. **AAA Pattern:** Structure each test following Arrange, Act, Assert:
   - **Arrange:** Set up test inputs, props, stubbed stores, or mock dependencies.
   - **Act:** Mount the component, trigger events, or invoke functions.
   - **Assert:** Verify return values, emitted events, or rendered DOM elements.
6. **Independence & Determinism:** Each test must be isolated; no test may depend on another test's execution order or residual state.
7. **Cleanup:** Always reset mocks (`vi.clearAllMocks()`) and clean up mounted components (`wrapper.unmount()`) after tests.
8. **Direct Imports:** Import target modules directly from their source files, never through index barrel re-exports.
9. **Mock Boundaries:** Mock external dependencies outside the unit boundary (e.g., OPFS, WebGL, Canvas, AudioContext, network requests) using `vi.fn()`, `vi.mock()`, or in-memory stubs.
10. **Negative Cases:** Prefix negative scenario test cases with `[Bad Path]`.

---

## 4. Vue UI Component Testing Guidelines

When testing Vue components:

### 4.1 Mounting & Configuration
Use `mount` or `shallowMount` from `@vue/test-utils`:

```javascript
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import BaseButton from '@/components/buttons/BaseButton.vue';

describe('BaseButton Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders button label correctly and emits click event', async () => {
    // Arrange
    const wrapper = mount(BaseButton, {
      props: {
        label: 'Save Project',
        variant: 'primary',
      },
    });

    // Act
    await wrapper.trigger('click');

    // Assert
    expect(wrapper.text()).toContain('Save Project');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });
});
```

### 4.2 Locating Elements
- Prefer finding elements by `data-testid` attributes (`wrapper.find('[data-testid="submit-btn"]')`) or accessible roles.
- Do not couple tests to CSS utility class names or transient styling classes.

### 4.3 Testing Props & Reactivity
- Assert that default prop values render appropriately.
- Update props dynamically with `await wrapper.setProps(...)` and assert reactive DOM updates.

### 4.4 Testing Events & Slots
- Verify custom events using `wrapper.emitted('eventName')`.
- Test default and named slots by providing slot content in mounting options.

---

## 5. Minimum Test Requirements

Every UI component and unit test suite must cover, at minimum:

- **Happy Path:** Expected execution with valid parameters, default props, or normal input.
- **Error / Bad Path (`[Bad Path]`):** Handling of unexpected, null, or out-of-range inputs.
- **Validation & Boundaries:** Boundary values, empty strings, zero values, array bounds.
- **Reactivity & Cleanup:** Lifecycle execution, watcher triggers, event teardown, and timer clearing (`vi.useFakeTimers()`).

---

## 6. Mocking Web APIs & External Modules

Vitest runs in a headless environment. Simulate browser-specific APIs when testing units that reference them:

- **Canvas & WebGL:** Stub canvas context methods (`getContext('2d')`, `getContext('webgl2')`).
- **Storage & OPFS:** Use in-memory mocks for `navigator.storage.getDirectory()`.
- **Timers:** Use `vi.useFakeTimers()` and `vi.advanceTimersByTime()` for debounced or timed logic.

---

## 7. Quality Standards

All UI & unit tests must:

- Be fast, reliable, and run in milliseconds.
- Run deterministically across local and CI environments.
- Fail when component behavioral contracts break.
- Pass through safe refactoring that does not change functional contracts.
