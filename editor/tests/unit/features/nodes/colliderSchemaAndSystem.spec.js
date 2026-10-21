import { describe, it, expect } from 'vitest';
import { componentSchema } from '@scenes/schemas/componentSchema.js';
import ColliderSystem from '@core/System/ColliderSystem.js';

describe('Collider Schema & ColliderSystem Enhancements', () => {
  describe('componentSchema.Collider', () => {
    it('creates default collider with scriptId, autoFlipX, and solid type', () => {
      const colComp = componentSchema.Collider();
      expect(colComp).toBeDefined();
      expect(Array.isArray(colComp.data)).toBe(true);
      expect(colComp.data.length).toBe(1);

      const shape = colComp.data[0];
      expect(shape.id).toBeDefined();
      expect(shape.scriptId).toBe('col_solid_1');
      expect(shape.type).toBe('solid');
      expect(shape.autoFlipX).toBe(true);
      expect(shape.enabled).toBe(true);
      expect(shape.width).toBe(32);
      expect(shape.height).toBe(32);
    });

    it('supports hitbox and hurtbox types with proper scriptId sanitization', () => {
      const colComp = componentSchema.Collider({
        data: [
          { type: 'hitbox', scriptId: 'sword_slash_1', offsetX: 40, autoFlipX: true },
          { type: 'hurtbox', scriptId: 'body hurtbox!', width: 30, height: 50 },
          { type: 'trigger' }
        ]
      });

      expect(colComp.data.length).toBe(3);
      expect(colComp.data[0].type).toBe('hitbox');
      expect(colComp.data[0].scriptId).toBe('sword_slash_1');
      expect(colComp.data[0].autoFlipX).toBe(true);

      expect(colComp.data[1].type).toBe('hurtbox');
      expect(colComp.data[1].scriptId).toBe('body_hurtbox'); // sanitized spaces/symbols
      expect(colComp.data[1].width).toBe(30);

      expect(colComp.data[2].type).toBe('trigger');
      expect(colComp.data[2].scriptId).toBe('col_trigger_3');
    });
  });

  describe('ColliderSystem Auto-Flip & Hitbox Checking', () => {
    function createMockGame(entities = []) {
      const mockGame = {
        world: {
          entities,
          layersWorld: [{ _id: 'layer_1', visible: true, active: true }],
          layersUI: []
        }
      };
      const cs = new ColliderSystem(mockGame);
      mockGame.colliderSystem = cs;
      return { mockGame, cs };
    }

    it('mirrors local bounds when entity is flipped and autoFlipX is true', () => {
      const entityRight = {
        id: 'player_r',
        components: {
          Transform: { x: 100, y: 100, width: 32, height: 32, pivotX: 0.5, pivotY: 0.5, rotation: 15, flipX: false },
          Collider: {
            data: [
              { scriptId: 'hb_sword', type: 'hitbox', enabled: true, autoFlipX: true, offsetX: 30, offsetY: 0, width: 20, height: 20 }
            ]
          }
        }
      };

      const entityLeft = {
        id: 'player_l',
        components: {
          Transform: { x: 100, y: 100, width: 32, height: 32, pivotX: 0.5, pivotY: 0.5, rotation: 15, flipX: true },
          Collider: {
            data: [
              { scriptId: 'hb_sword', type: 'hitbox', enabled: true, autoFlipX: true, offsetX: 30, offsetY: 0, width: 20, height: 20 }
            ]
          }
        }
      };

      const { cs } = createMockGame([entityRight, entityLeft]);

      const boundsR = cs.getBounds(entityRight);
      const boundsL = cs.getBounds(entityLeft);

      expect(boundsR.length).toBe(1);
      expect(boundsL.length).toBe(1);

      // Facing right: hitbox is to the right of entity center (x > 100)
      expect(boundsR[0].x).toBeGreaterThan(100);

      // Facing left: hitbox is mirrored to the left of entity center (x < 100)
      expect(boundsL[0].x).toBeLessThan(100);

      // Distance from center should be equal in magnitude
      const distR = Math.abs(boundsR[0].x - 100);
      const distL = Math.abs(boundsL[0].x - 100);
      expect(distR).toBeCloseTo(distL, 1);

      // Rotation should also be inverted
      expect(boundsL[0].rotation).toBeCloseTo(-boundsR[0].rotation, 4);
    });

    it('does not mirror bounds when autoFlipX is false', () => {
      const entityFlipped = {
        id: 'player_no_flip',
        components: {
          Transform: { x: 100, y: 100, width: 32, height: 32, pivotX: 0.5, pivotY: 0.5, flipX: true },
          Collider: {
            data: [
              { scriptId: 'fixed_zone', type: 'trigger', enabled: true, autoFlipX: false, offsetX: 30, offsetY: 0, width: 20, height: 20 }
            ]
          }
        }
      };

      const { cs } = createMockGame([entityFlipped]);
      const bounds = cs.getBounds(entityFlipped);
      expect(bounds[0].x).toBeGreaterThan(100);
    });

    it('provides getColliderShape and setColliderEnabled utilities', () => {
      const entity = {
        id: 'player_1',
        components: {
          Collider: {
            data: [
              { id: 'uuid-1', scriptId: 'slash_hb', type: 'hitbox', enabled: false },
              { id: 'uuid-2', scriptId: 'body_solid', type: 'solid', enabled: true }
            ]
          }
        }
      };

      const { cs } = createMockGame([entity]);

      const shape = cs.getColliderShape(entity, 'slash_hb');
      expect(shape).toBeDefined();
      expect(shape.type).toBe('hitbox');

      expect(shape.enabled).toBe(false);
      const updated = cs.setColliderEnabled(entity, 'slash_hb', true);
      expect(updated).toBe(true);
      expect(shape.enabled).toBe(true);

      cs.setColliderEnabled(entity, 'slash_hb', false);
      expect(shape.enabled).toBe(false);
    });

    it('checkHitbox accurately detects overlap with target hurtbox colliders', () => {
      const attacker = {
        id: 'attacker_1',
        active: true,
        components: {
          Transform: { x: 100, y: 100, width: 32, height: 32, pivotX: 0.5, pivotY: 0.5, flipX: false },
          Collider: {
            data: [
              { scriptId: 'hb_punch', type: 'hitbox', enabled: true, offsetX: 25, offsetY: 0, width: 30, height: 20 }
            ]
          }
        }
      };

      const enemyInRange = {
        id: 'enemy_in_range',
        tag: 'enemy',
        active: true,
        components: {
          Transform: { x: 120, y: 100, width: 32, height: 32, pivotX: 0.5, pivotY: 0.5 },
          Collider: {
            data: [
              { scriptId: 'enemy_hurtbox', type: 'hurtbox', enabled: true, offsetX: 0, offsetY: 0, width: 20, height: 20 }
            ]
          }
        }
      };

      const enemyOutOfRange = {
        id: 'enemy_far',
        tag: 'enemy',
        active: true,
        components: {
          Transform: { x: 300, y: 100, width: 32, height: 32, pivotX: 0.5, pivotY: 0.5 },
          Collider: {
            data: [
              { scriptId: 'enemy_hurtbox', type: 'hurtbox', enabled: true, offsetX: 0, offsetY: 0, width: 20, height: 20 }
            ]
          }
        }
      };

      const { cs } = createMockGame([attacker, enemyInRange, enemyOutOfRange]);

      const hits = cs.checkHitbox(attacker, 'hb_punch', 'enemy', ['hurtbox']);
      expect(hits.length).toBe(1);
      expect(hits[0].entity.id).toBe('enemy_in_range');
      expect(hits[0].targetBound.scriptId).toBe('enemy_hurtbox');
    });
  });

  describe('Tilemap Collision & moveAndSlide', () => {
    function createTilemapGame(entities = []) {
      const mockGame = {
        world: {
          entities,
          layersWorld: [{ _id: 'layer_1', visible: true, active: true }],
          layersUI: []
        }
      };
      const cs = new ColliderSystem(mockGame);
      mockGame.colliderSystem = cs;
      return { mockGame, cs };
    }

    it('detects collision with solid tilemap and blocks penetration via moveAndSlide', () => {
      const tilemap = {
        id: 'tilemap_1',
        active: true,
        components: {
          Transform: { x: 0, y: 0, width: 32, height: 32, scaleX: 1, scaleY: 1, rotation: 0 },
          Tilemap: {
            width: 32,
            height: 32,
            isSolid: true,
            data: {
              '0,1': 1, // Tile at x=0..32, y=32..64 (floor)
              '1,1': 1
            }
          }
        }
      };

      const player = {
        id: 'player_1',
        active: true,
        components: {
          Transform: { x: 16, y: 16, width: 32, height: 32, pivotX: 0.5, pivotY: 0.5 },
          Collider: {
            data: [
              { scriptId: 'col_body', type: 'solid', enabled: true, autoFit: true }
            ]
          }
        }
      };

      const { cs } = createTilemapGame([tilemap, player]);

      // Initially player is at y=16 (bounds y: 0..32). Tile is at y: 32..64. No collision yet.
      expect(cs.checkSolid(player)).toBeNull();

      // Moving downwards towards tile by 20px (would reach y=36, penetrating into tile by 4px)
      const hit = cs.moveAndSlide(player, 0, 20);

      expect(hit).toBeDefined();
      expect(hit.y).toBe(tilemap);
      // Player should be resting on top of tile (y around 16, top edge of tile is 32, player bottom is y + 16 = 32, so player.y <= 16)
      expect(player.components.Transform.y).toBeLessThanOrEqual(16.01);
      expect(player.components.Transform.y).toBeGreaterThan(15.9);
    });

    it('allows player to pass through when tilemap isSolid is false', () => {
      const tilemap = {
        id: 'tilemap_pass',
        active: true,
        components: {
          Transform: { x: 0, y: 0, width: 32, height: 32, scaleX: 1, scaleY: 1, rotation: 0 },
          Tilemap: {
            width: 32,
            height: 32,
            isSolid: false,
            data: {
              '0,1': 1
            }
          }
        }
      };

      const player = {
        id: 'player_pass',
        active: true,
        components: {
          Transform: { x: 16, y: 16, width: 32, height: 32, pivotX: 0.5, pivotY: 0.5 },
          Collider: {
            data: [
              { scriptId: 'col_body', type: 'solid', enabled: true, autoFit: true }
            ]
          }
        }
      };

      const { cs } = createTilemapGame([tilemap, player]);

      const hit = cs.moveAndSlide(player, 0, 20);
      expect(hit).toBeNull();
      expect(player.components.Transform.y).toBe(36);
    });

    it('blocks horizontal movement against a tilemap wall', () => {
      const tilemap = {
        id: 'tilemap_wall',
        active: true,
        components: {
          Transform: { x: 0, y: 0, width: 32, height: 32, scaleX: 1, scaleY: 1, rotation: 0 },
          Tilemap: {
            width: 32,
            height: 32,
            isSolid: true,
            data: {
              '2,0': 1 // Wall tile at x=64..96, y=0..32
            }
          }
        }
      };

      const player = {
        id: 'player_wall',
        active: true,
        components: {
          Transform: { x: 40, y: 16, width: 32, height: 32, pivotX: 0.5, pivotY: 0.5 },
          Collider: {
            data: [
              { scriptId: 'col_body', type: 'solid', enabled: true, autoFit: true }
            ]
          }
        }
      };

      const { cs } = createTilemapGame([tilemap, player]);

      // Player spans x: 24..56. Wall starts at x=64. Moving right by 20px would reach x=60 (bounds x: 44..76, penetrating wall by 12px)
      const hit = cs.moveAndSlide(player, 20, 0);

      expect(hit).toBeDefined();
      expect(hit.x).toBe(tilemap);
      // Player right edge (Transform.x + 16) should not penetrate wall (64)
      expect(player.components.Transform.x).toBeLessThanOrEqual(48.01);
    });

    it('supports negative tile coordinates and checkOverlap', () => {
      const tilemap = {
        id: 'tilemap_neg',
        active: true,
        components: {
          Transform: { x: 0, y: 0, width: 32, height: 32, scaleX: 1, scaleY: 1, rotation: 0 },
          Tilemap: {
            width: 32,
            height: 32,
            isSolid: true,
            data: {
              '-1,0': 1 // Tile at x=-32..0, y=0..32
            }
          }
        }
      };

      const player = {
        id: 'player_neg',
        active: true,
        components: {
          Transform: { x: -16, y: 16, width: 32, height: 32, pivotX: 0.5, pivotY: 0.5 },
          Collider: {
            data: [
              { scriptId: 'col_body', type: 'solid', enabled: true, autoFit: true }
            ]
          }
        }
      };

      const { cs } = createTilemapGame([tilemap, player]);
      expect(cs.checkSolid(player)).toBe(tilemap);
      expect(cs.checkOverlap(player)).toBe(tilemap);
    });
  });
});
