import { test, expect } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'CircularParenting E2E',
    description: 'Workspace for circular parenting defense reliability verification',
  },
});

test.describe('Reliability: Circular Parenting Prevention', () => {
  test('rejects circular parenting in World hierarchy logic', async ({ page }) => {
    const isCycleBlocked = await page.evaluate(async () => {
      const { default: World } = await import('/core/Core/World.js');
      const world = new World();
      const entityA = { id: 'entity_ancestor_test', parentId: null, components: {} };
      const entityB = { id: 'entity_descendant_test', parentId: 'entity_ancestor_test', components: {} };

      world.entities.push(entityA);
      world.entities.push(entityB);

      // Check ancestor check
      const ancestorDetected = world.isAncestor('entity_ancestor_test', 'entity_descendant_test');

      // Attempt circular reparenting: setting descendant B as parent of ancestor A
      const reparentSuccess = world.setEntityParent('entity_ancestor_test', 'entity_descendant_test');

      // Clean up test entities
      world.entities = world.entities.filter(
        (e) => e.id !== 'entity_ancestor_test' && e.id !== 'entity_descendant_test'
      );

      return ancestorDetected === true && reparentSuccess === false;
    });

    expect(isCycleBlocked).toBe(true);
  });
});
