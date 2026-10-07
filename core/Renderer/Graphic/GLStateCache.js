export default class GLStateCache {
    constructor(gl, bindVAOFunc) {
        this.gl = gl;

        this._bindVAO = bindVAOFunc;

        this.currentProgram = null;
        this.currentTexture = null;
        this.currentVAO = null;
        this.activeTextureUnit = 0;
    }

    useProgram(program) {
        if (this.currentProgram !== program) {
            this.gl.useProgram(program);
            this.currentProgram = program;
        }
    }

    bindTexture(texture) {
        if (this.currentTexture !== texture) {
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.currentTexture = texture;
        }
    }

    bindVAO(vao) {
        if (this.currentVAO !== vao) {
            this._bindVAO(vao);
            this.currentVAO = vao;
        }
    }

    reset() {
        this.currentProgram = null;
        this.currentTexture = null;
        this.currentVAO = null;
    }
}
