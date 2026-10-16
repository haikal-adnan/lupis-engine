# System Test Standard

## 1. Purpose

System tests verify complete feature workflows from a user perspective and through primary business journeys.

System tests focus on complete multi-step flows and observable end states rather than individual isolated functions.

---

## 2. Rules

System tests must adhere to the following rules:

1. **User-Centric Workflows:** Test features according to realistic user operations and business processes.
2. **Behavior & End State:** Focus on functional behavior and the final state of the application.
3. **Language:** Use clear, concise English for all `describe()` and `it()` block descriptions.
4. **No "Should" Prefixes:** Do not start `it()` descriptions with the word "should".
5. **AAA Pattern:** Structure each test following Arrange, Act, Assert:
   - **Arrange:** Set up test data, mocks, and initial state.
   - **Act:** Execute the target multi-step workflow.
   - **Assert:** Validate the resulting state, DOM output, or data persistence.
6. **Independence & Determinism:** Every test must run independently without reliance on preceding test state.
7. **Realistic Environment:** Keep execution conditions as close to the real user runtime environment as possible.
8. **Avoid Redundant Unit Checking:** Do not test internal private methods in isolation if the behavior is already covered by the integration flow.
9. **Minimal Mocking:** Mock only external dependencies (e.g., hardware APIs, server network calls) necessary to keep the suite fast and deterministic.
10. **Negative Cases:** Prefix negative scenario test cases with `[Bad Path]`.

---

## 3. Minimum Test Requirements

Every major feature workflow must cover, at minimum, the following scenarios:

- **Happy Path:** The primary workflow completes successfully from start to finish.
- **Failure Path:** Invalid actions or errors yield correct feedback, notifications, or fallback states.
- **Terminal State:** The system state after completing the process matches expected business invariants.

### Example Journey:
User creates a project $\rightarrow$ updates project configuration $\rightarrow$ commits changes to storage $\rightarrow$ reloads workspace $\rightarrow$ project data remains fully consistent.

---

## 4. Edge Cases & Boundary Scenarios

Include the following where applicable:

- Empty, boundary, or invalid inputs.
- Storage failures and I/O error handling.
- Network interruption or offline fallbacks.
- Workflow cancellation and modal dismissal.
- State persistence and integrity across reload / re-entry.

---

## 5. Structure Example

```javascript
describe('Project Management System', () => {
  describe('Project Creation and Persistence', () => {
    it('creates, saves, and reloads project state with complete data integrity', async () => {
      // Arrange
      const projectPayload = {
        name: 'Adventure Game',
        settings: {
          width: 1920,
          height: 1080,
        },
      };

      // Act
      const created = await createProject(projectPayload);
      await saveProject(created);
      const loaded = await loadProject(created.id);

      // Assert
      expect(loaded.name).toBe('Adventure Game');
      expect(loaded.settings.width).toBe(1920);
      expect(loaded.settings.height).toBe(1080);
    });

    it('[Bad Path] handles save failure gracefully when payload is invalid', async () => {
      // Act & Assert
      await expect(saveProject(null)).rejects.toThrow();
    });
  });
});
```

---

## 6. Boundaries

System tests do **not** need to test:

- Fine-grained internal helper functions in isolation.
- Every permutations of private helper parameters.
- Internal reactive state structures that do not affect observable system behavior.

Focus on system milestones and outcomes observable by the user.

---

## 7. Quality Standards

All system tests must:

- Accurately represent real user or business workflows.
- Validate terminal system outcomes and invariants.
- Run deterministically and independently.
- Detect regressions that break user workflows.
- Maintain resilience against non-breaking internal refactors.
