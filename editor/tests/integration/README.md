INTEGRATION TEST STANDARD

1. PURPOSE

Integration tests are used to verify interactions and data flow between multiple modules working together.

Examples include:
- Store ↔ Service
- Service ↔ Repository
- Store ↔ Store
- Other related module-to-module interactions

The primary focus is verifying that modules work correctly when integrated, rather than testing each module in isolation.


2. RULES

Integration tests must follow these rules:

1. Focus on behavior and data flow between modules.

2. Use clear English for describe() and it() block descriptions.

3. Do not start it() descriptions with "should".

4. Follow the AAA pattern:
   - Arrange — Prepare test data, mocks, and required state.
   - Act — Execute the operation being tested.
   - Assert — Verify the expected result or state.

5. Every test must be independent and deterministic.

6. Clean up all states, mocks, and resources after each test run.

7. Import target modules directly from their source files. Avoid importing through barrel files or re-exports.

8. Dependencies outside the test boundary must be mocked using:
   - vi.fn()
   - vi.mock()
   - Mock factories

9. Do not use:
   - Real API servers
   - External databases
   - Real file systems
   - Disk I/O
   - Web Bridges
   - External services

10. Web APIs that are unavailable in the test environment may be simulated using stubs, mocks, or in-memory implementations.

11. Prefix negative scenario test cases with [Bad Path].


3. MINIMUM TEST REQUIREMENTS

Every integration test suite must cover, at minimum, the following scenarios:

3.1 Successful Integration

Verify that data from one module is correctly received, processed, and passed to the next module.

Example:

Store -> Service -> Repository

The test should verify that the data flows correctly through the relevant modules.


3.2 Dependency Failure

Verify that errors originating from dependencies are handled gracefully.

The test should verify the resulting behavior, including relevant state or UI updates.


3.3 State Consistency

Verify that changes made in one module correctly update or synchronize related modules.


3.4 Edge Cases

Where applicable, integration tests should also cover:

- null / undefined values
- Boundary values
- Asynchronous operations
- Race conditions
- Operation cancellations
- State resets
- State synchronization
- Resource cleanup


4. MOCKING BOUNDARIES

Only mock dependencies that are outside the boundary of the system under test.

For example, consider the following module structure:

Store -> Service -> Repository


Testing Store <-> Service

When testing the interaction between the Store and Service:

Store -> Service -> [Mock Repository]

The Repository may be mocked because it is outside the integration boundary being tested.


Testing Service <-> Repository

When testing the interaction between the Service and Repository:

[Service] -> [Repository] -> [Mock External API / Database]

The Service and Repository should execute using their real implementations.

Only external dependencies such as APIs or databases should be mocked.


General Principle:

Mock external dependencies, not the modules whose integration behavior is being tested.

This prevents integration tests from degrading into unit tests through excessive mocking.


5. TEST STRUCTURE EXAMPLE

describe('Profile Management', () => {
  describe('Store and Service Integration', () => {
    it('updates state after data is saved successfully', async () => {
      // Arrange
      const saveService = vi.fn().mockResolvedValue({
        success: true,
        data: {
          id: 1,
          name: 'John Doe'
        }
      })

      // Act
      const result = await saveService({
        id: 1,
        name: 'John Doe'
      })

      // Assert
      expect(result.success).toBe(true)
      expect(result.data.name).toBe('John Doe')
      expect(saveService).toHaveBeenCalled()
    })

    it('[Bad Path] updates error state when service fails', async () => {
      // Arrange
      const saveService = vi
        .fn()
        .mockRejectedValue(new Error('Connection lost'))

      // Act & Assert
      await expect(saveService()).rejects.toThrow('Connection lost')
    })
  })
})


6. QUALITY CHECKLIST

Integration tests must:

- Test real interactions between modules.
- Verify data flow across module boundaries.
- Avoid excessive coupling to internal implementation details.
- Remain fully independent and deterministic.
- Effectively detect data flow and integration regressions.
- Remain valid and resilient after internal refactoring.
- Avoid becoming unit tests through excessive mocking.
- Mock only dependencies that are outside the integration boundary.
- Properly clean up states, mocks, and resources after each test.

CORE PRINCIPLE

Integration tests should verify that real modules work correctly together while isolating only external dependencies.
