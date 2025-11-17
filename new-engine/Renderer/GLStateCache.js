// engine/Renderer/GLStateCache.js

/**
 * GLStateCache
 * -------------
 * Menghindari GL state change yang tidak perlu.
 * Digunakan oleh semua renderer:
 *   - ImageRenderer
 *   - TextRenderer
 *   - WorldRenderer
 *   - RendererManager
 */
export default class GLStateCache {
    constructor(gl) {
        this.gl = gl;

        // Cached states
        this.currentProgram = null;
        this.currentTexture0 = null;
        this.currentVAO = null;
        this.activeTextureUnit = 0;
    }

    // ================================================
    //  Program
    // ================================================
    useProgram(program) {
        if (this.currentProgram !== program) {
            this.gl.useProgram(program);
            this.currentProgram = program;
        }
    }

    // ================================================
    //  Texture Binding (Texture Unit 0)
    // ================================================
    bindTexture(texture) {
        if (this.currentTexture0 !== texture) {
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.currentTexture0 = texture;
        }
    }

    // ================================================
    //  VAO Binding
    // ================================================
    bindVAO(vao, ctx) {
        if (this.currentVAO !== vao) {
            ctx.bindVAO(vao);
            this.currentVAO = vao;
        }
    }

    // ================================================
    //  Reset per frame
    // ================================================
    reset() {
        this.currentProgram = null;
        this.currentTexture0 = null;
        this.currentVAO = null;
    }
}
