// engine/Renderer/GLContext.js

export default class GLContext {
    constructor(canvas) {
        // === 1. TRY WEBGL2 FIRST ===
        let gl = canvas.getContext("webgl2", {
            alpha: false,
            antialias: true,
            depth: false,
            stencil: false,
            preserveDrawingBuffer: false,
            powerPreference: "high-performance"
        });

        this.isWebGL2 = true;

        // === 2. FALLBACK TO WEBGL1 ===
        if (!gl) {
            console.warn("[GLContext] WebGL2 tidak tersedia → fallback ke WebGL1");
            gl = canvas.getContext("webgl", {
                alpha: false,
                antialias: true,
                depth: false,
                stencil: false,
                preserveDrawingBuffer: false,
                powerPreference: "high-performance"
            });
            this.isWebGL2 = false;
        }

        if (!gl) throw new Error("Browser tidak mendukung WebGL.");

        this.gl = gl;

        // ================================================
        //  LOAD EXTENSIONS (untuk WebGL1 fallback)
        // ================================================

        // VAO (Vertex Array Object)
        this.vaoExt = null;

        if (!this.isWebGL2) {
            this.vaoExt = gl.getExtension("OES_vertex_array_object") ||
                          gl.getExtension("MOZ_OES_vertex_array_object") ||
                          gl.getExtension("WEBKIT_OES_vertex_array_object");

            if (!this.vaoExt) {
                console.warn("[GLContext] Browser tidak mendukung VAO di WebGL1 (OES_vertex_array_object).");
            }
        }

        // derivative untuk fwidth() di TextRenderer
        this.derivativesExt = gl.getExtension("OES_standard_derivatives");

        // float textures (optional)
        this.texFloat = gl.getExtension("OES_texture_float");
        this.texHalfFloat = gl.getExtension("OES_texture_half_float");

        // ================================================
        //  ABSTRAKSI VAO UNIVERSAL
        // ================================================
        this.createVAO = this.isWebGL2
            ? () => gl.createVertexArray()
            : () => this.vaoExt ? this.vaoExt.createVertexArrayOES() : null;

        this.bindVAO = this.isWebGL2
            ? (vao) => gl.bindVertexArray(vao)
            : (vao) => this.vaoExt ? this.vaoExt.bindVertexArrayOES(vao) : null;

        this.deleteVAO = this.isWebGL2
            ? (vao) => gl.deleteVertexArray(vao)
            : (vao) => this.vaoExt ? this.vaoExt.deleteVertexArrayOES(vao) : null;

        // ================================================
        //  DEFAULT WEBGL STATE
        // ================================================
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DITHER);
    }
}
