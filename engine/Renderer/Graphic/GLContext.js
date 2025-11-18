// engine/Renderer/GLContext.js
export default class GLContext {
    constructor(canvas) {
        const opts = {
            alpha: false,
            antialias: true,
            depth: false,
            stencil: false,
            preserveDrawingBuffer: false,
            powerPreference: "high-performance"
        };

        let gl = canvas.getContext("webgl2", opts);
        this.isWebGL2 = true;

        if (!gl) {
            console.warn("[GLContext] WebGL2 not available → fallback WebGL1");
            gl = canvas.getContext("webgl", opts);
            this.isWebGL2 = false;
        }

        if (!gl) throw new Error("WebGL tidak didukung.");

        this.gl = gl;

        this.vaoExt = null;
        if (!this.isWebGL2) {
            this.vaoExt = gl.getExtension("OES_vertex_array_object")
                || gl.getExtension("MOZ_OES_vertex_array_object")
                || gl.getExtension("WEBKIT_OES_vertex_array_object");
        }

        this.createVAO = () => {
            return this.isWebGL2
                ? gl.createVertexArray()
                : this.vaoExt?.createVertexArrayOES() ?? null;
        };

        this.bindVAO = (vao) => {
            if (this.isWebGL2) gl.bindVertexArray(vao);
            else if (this.vaoExt) this.vaoExt.bindVertexArrayOES(vao);
        };

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DITHER);
    }
}
