import Config from "../Core/Config.js";
import CameraController from "../Editor/CameraController.js";
import PointerCoordinates from "../Editor/PointerCoordinates.js";
import SelectionTool from "../Editor/SelectionTool.js";
import TransformTool from "../Editor/TransformTool.js";
import Grid from "../Editor/Grid.js";
import Rulers from "../Editor/Rulers.js";

export class EditorSystem {
    constructor(world, game) {
        this.world = world;
        this.game = game;
        
        const { canvas, renderer, camera, input } = game;
        const { EDITOR } = Config;

        this.tools = {};

        if (EDITOR.CAMERA_CONTROLLER) {
            this.tools.cameraController = new CameraController(camera, canvas, input);
        }
        
        if (EDITOR.GRID) {
            this.tools.grid = new Grid(world, game, canvas, renderer, camera, { 
                color: "#ffffff", width: 50, height: 50, alpha: 0.5 
            });
        }
        
        if (EDITOR.SELECTION) {
            this.tools.selection = new SelectionTool(world, game, canvas, renderer, input);
        }

        if (EDITOR.TRANSFORM && this.tools.selection) {
            this.tools.transform = new TransformTool(
                this.tools.selection, world, game, canvas, renderer, input
            );
        }
        
        if (EDITOR.RULERS) {
            this.tools.rulers = new Rulers(renderer, camera);
        }
        
        if (EDITOR.POINTER) {
            this.tools.pointer = new PointerCoordinates(game, renderer);
        }
    }

    update(dt) {
        if (this.tools.cameraController) this.tools.cameraController.update(dt);
        if (this.tools.selection) this.tools.selection.update(dt);
        if (this.tools.transform) this.tools.transform.update(dt);
    }

    renderBackground(ctx, proj) {
        if (this.tools.grid) this.tools.grid.render(ctx, proj);
    }

    renderForeground(ctx, proj) {
        if (this.tools.selection) this.tools.selection.render(ctx, proj);
        if (this.tools.transform) this.tools.transform.render(ctx, proj);
        if (this.tools.rulers) this.tools.rulers.render(ctx, proj); 
        if (this.tools.pointer) this.tools.pointer.render(ctx, proj);
    }
}