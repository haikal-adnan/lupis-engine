export default class GLStateCache {
    constructor(gl, bindVAOFunc) {
        this.gl = gl;

        // Fungsi bindVAO sudah diberikan oleh GLContext agar renderer tidak tahu WebGL1/2
        this._bindVAO = bindVAOFunc;

        // Cached states
        this.currentProgram = null;
        this.currentTexture = null;
        this.currentVAO = null;
        this.activeTextureUnit = 0;
    }

    // PROGRAM
    useProgram(program) {
        if (this.currentProgram !== program) {
            this.gl.useProgram(program);
            this.currentProgram = program;
        }
    }

    // TEXTURE UNIT 0
    bindTexture(texture) {
        if (this.currentTexture !== texture) {
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.currentTexture = texture;
        }
    }

    // VAO
    bindVAO(vao) {
        if (this.currentVAO !== vao) {
            this._bindVAO(vao);
            this.currentVAO = vao;
        }
    }

    // Reset per frame
    reset() {
        this.currentProgram = null;
        this.currentTexture = null;
        this.currentVAO = null;
    }
}
