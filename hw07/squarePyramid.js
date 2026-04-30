export class SquarePyramid {
  constructor(gl, options = {}) {
    this.gl = gl;

    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();
    this.ebo = gl.createBuffer();

    this.vertices = new Float32Array([
      // bottom (v0, v1, v2, v3)
      -0.5, 0.0, -0.5, 0.5, 0.0, -0.5, 0.5, 0.0, 0.5, -0.5, 0.0, 0.5,
      // front (v3, v2, apex)
      -0.5, 0.0, 0.5, 0.5, 0.0, 0.5, 0.0, 1.0, 0.0,
      // right (v2, v1, apex)
      0.5, 0.0, 0.5, 0.5, 0.0, -0.5, 0.0, 1.0, 0.0,
      // back (v1, v0, apex)
      0.5, 0.0, -0.5, -0.5, 0.0, -0.5, 0.0, 1.0, 0.0,
      // left (v0, v3, apex)
      -0.5, 0.0, -0.5, -0.5, 0.0, 0.5, 0.0, 1.0, 0.0,
    ]);

    const inv = 1.0 / Math.sqrt(1.25);
    const s = 1.0 * inv;
    const u = 0.5 * inv;

    this.normals = new Float32Array([
      // bottom (-y)
      0,
      -1,
      0,
      0,
      -1,
      0,
      0,
      -1,
      0,
      0,
      -1,
      0,
      // front (+z)
      0,
      u,
      s,
      0,
      u,
      s,
      0,
      u,
      s,
      // right (+x)
      s,
      u,
      0,
      s,
      u,
      0,
      s,
      u,
      0,
      // back  (-z)
      0,
      u,
      -s,
      0,
      u,
      -s,
      0,
      u,
      -s,
      // left  (-x)
      -s,
      u,
      0,
      -s,
      u,
      0,
      -s,
      u,
      0,
    ]);

    if (options.color) {
      this.colors = new Float32Array(16 * 4);
      for (let i = 0; i < 16 * 4; i += 4) {
        this.colors[i] = options.color[0];
        this.colors[i + 1] = options.color[1];
        this.colors[i + 2] = options.color[2];
        this.colors[i + 3] = options.color[3];
      }
    } else {
      this.colors = new Float32Array([
        // bottom
        0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1,
        // front
        1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1,
        // right
        1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1,
        // back
        1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1,
        // left
        0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1,
      ]);
    }

    this.texCoords = new Float32Array([
      // bottom
      0, 0, 1, 0, 1, 1, 0, 1,
      // front
      0, 0, 0.25, 0, 0.125, 1,
      // right
      0.25, 0, 0.5, 0, 0.375, 1,
      // back
      0.5, 0, 0.75, 0, 0.625, 1,
      // left
      0.75, 0, 1, 0, 0.875, 1,
    ]);

    this.indices = new Uint16Array([
      // bottom
      0, 1, 2, 0, 2, 3,
      // front
      4, 5, 6,
      // right
      7, 8, 9,
      // back
      10, 11, 12,
      // left
      13, 14, 15,
    ]);

    this.initBuffers();
  }

  initBuffers() {
    const gl = this.gl;

    const vSize = this.vertices.byteLength;
    const nSize = this.normals.byteLength;
    const cSize = this.colors.byteLength;
    const tSize = this.texCoords.byteLength;
    const totalSize = vSize + nSize + cSize + tSize;

    gl.bindVertexArray(this.vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, totalSize, gl.STATIC_DRAW);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
    gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
    gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize, this.colors);
    gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize + cSize, this.texCoords);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, vSize);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, vSize + nSize);
    gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, vSize + nSize + cSize);

    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);
    gl.enableVertexAttribArray(3);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  draw(shader) {
    const gl = this.gl;
    shader.use();
    gl.bindVertexArray(this.vao);
    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  }

  delete() {
    const gl = this.gl;
    gl.deleteBuffer(this.vbo);
    gl.deleteBuffer(this.ebo);
    gl.deleteVertexArray(this.vao);
  }
}
