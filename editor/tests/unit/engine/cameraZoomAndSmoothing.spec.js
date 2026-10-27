import { describe, it, expect, beforeEach } from 'vitest';
import Camera from '@core/Util/Camera.js';
import Config from '@core/Core/Config.js';
import { CameraContextHandler } from '@core/Script/Context/CameraContextHandler.js';
import SceneSystem from '@core/System/SceneSystem.js';

describe('Camera Zoom & Smoothing System', () => {
    describe('Camera Class Base Behavior', () => {
        it('initializes with default scale = 1 and lerp = 0.1', () => {
            const cam = new Camera(0, 0);
            expect(cam.scale).toBe(1);
            expect(cam.lerp).toBe(0.1);
            expect(cam.defaultLerp).toBe(0.1);
        });

        it('retains defaultLerp when target is set without speed and restores on clearTarget', () => {
            const cam = new Camera(100, 100);
            cam.defaultLerp = 0.05;
            cam.lerp = 0.05;

            const target = { components: { Transform: { x: 200, y: 300 } } };
            cam.setTarget(target);

            expect(cam.lerp).toBe(0.05);
            expect(cam.target).toBe(target);

            cam.clearTarget();
            expect(cam.target).toBeNull();
            expect(cam.lerp).toBe(0.05);
        });

        it('overrides lerp when specific speed is passed and restores defaultLerp on clearTarget', () => {
            const cam = new Camera(0, 0);
            cam.defaultLerp = 0.05;
            cam.lerp = 0.05;

            const target = { components: { Transform: { x: 50, y: 50 } } };
            cam.setTarget(target, 0.25);

            expect(cam.lerp).toBe(0.25);

            cam.clearTarget();
            expect(cam.lerp).toBe(0.05);
        });

        it('clamps lerp safely in update to prevent NaN', () => {
            const cam = new Camera(0, 0);
            cam.lerp = 1.5; // Invalid lerp > 1
            const target = { components: { Transform: { x: 100, y: 100 } } };
            cam.setTarget(target, 1.5);

            cam.update(0.016, null, null); // First frame snap
            expect(cam.x).toBe(100);

            target.components.Transform.x = 200;
            cam.update(0.016, null, null);
            expect(isNaN(cam.x)).toBe(false);
        });
    });

    describe('CameraContextHandler Facade', () => {
        let dummyGame;
        let contextHandler;

        beforeEach(() => {
            dummyGame = {
                camera: new Camera(960, 540)
            };
            dummyGame.camera.defaultLerp = 0.08;
            dummyGame.camera.lerp = 0.08;

            contextHandler = new CameraContextHandler({ game: dummyGame });
        });

        it('creates facade with scale and smoothSpeed reflecting camera properties', () => {
            const facade = contextHandler.createFacade();
            dummyGame.camera.scale = 2.0;
            dummyGame.camera.lerp = 0.04;

            const info = facade.getInfo();
            expect(info.scale).toBe(2.0);
            expect(info.smoothSpeed).toBe(0.04);
            expect(facade.scale).toBe(2.0);
            expect(facade.lerp).toBe(0.04);
        });

        it('uses default camera lerp when follow or setTarget is called without speed', () => {
            const facade = contextHandler.createFacade();
            const target = { scriptId: 'hero', components: { Transform: { x: 10, y: 10 } } };

            facade.follow(target);
            expect(dummyGame.camera.lerp).toBe(0.08);

            facade.setTarget(target);
            expect(dummyGame.camera.lerp).toBe(0.08);
        });

        it('sets camera scale and lerp via setTransform', () => {
            const facade = contextHandler.createFacade();
            facade.setTransform(400, 300, 1.75, 0.06);

            expect(dummyGame.camera.x).toBe(400);
            expect(dummyGame.camera.y).toBe(300);
            expect(dummyGame.camera.scale).toBe(1.75);
            expect(dummyGame.camera.lerp).toBe(0.06);
            expect(dummyGame.camera.defaultLerp).toBe(0.06);
        });
    });

    describe('SceneSystem Scene Loading Camera Application', () => {
        let fakeGame;
        let sceneSystem;

        beforeEach(() => {
            fakeGame = {
                camera: new Camera(0, 0),
                cameraController: null,
                world: {
                    settings: {
                        ui: { width: 1920, height: 1080 },
                        camera: {
                            x: 500,
                            y: 400,
                            zoom: 1.8,
                            lerp: 0.03
                        }
                    },
                    entities: [],
                    layersWorld: [],
                    layersUI: []
                },
                pauseGame: () => {},
                resumeGame: () => {},
                scriptSystem: { clear: () => {}, startAll: () => {} },
                audioSystem: { handleSceneTransition: () => {}, startSceneAutoplay: () => {} },
                events: { emit: () => {} }
            };
            sceneSystem = new SceneSystem(fakeGame);
            sceneSystem.setSceneCache([{ id: 'scene_test', scriptId: 'test_scene', settings: {} }]);
        });

        it('applies zoom, smoothing (lerp), and world position in runtime mode', async () => {
            Config.ENGINE_MODE = 'runtime';

            await sceneSystem.loadScene('scene_test');

            expect(fakeGame.camera.x).toBe(500);
            expect(fakeGame.camera.y).toBe(400);
            expect(fakeGame.camera.scale).toBe(1.8);
            expect(fakeGame.camera.lerp).toBe(0.03);
            expect(fakeGame.camera.defaultLerp).toBe(0.03);
        });

        it('retains default editor scale 0.5 and center coordinates in editor mode', async () => {
            Config.ENGINE_MODE = 'editor';

            await sceneSystem.loadScene('scene_test');

            // In editor mode, settings do not overwrite editor camera viewport
            expect(fakeGame.camera.x).toBe(960); // 1920 / 2
            expect(fakeGame.camera.y).toBe(540); // 1080 / 2
            expect(fakeGame.camera.scale).toBe(0.5);
        });
    });
});
