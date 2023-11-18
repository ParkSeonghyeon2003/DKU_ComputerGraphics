"use strict";

var canvas;
var gl;

var NumVertices = 18; // 밑면 삼각형 두개(6개) + 옆면 삼각형 각각 3개(3*4=12) = 18

var points = []; // 정점 배열
var colors = []; // 정점 색상 배열
var normals = []; // 노말 배열

var vertices = [
  vec4(-0.5, -0.5, 0.5, 1.0), // 좌측 앞
  vec4(0.5, -0.5, 0.5, 1.0), // 우측 앞
  vec4(0.0, 0.5, 0.0, 1.0), // 꼭대기
  vec4(0.5, -0.5, -0.5, 1.0), // 우측 뒤
  vec4(-0.5, -0.5, -0.5, 1.0), // 좌측 뒤
];

var vertexColors = [
  [0.0, 0.0, 0.0, 1.0], // black
  [1.0, 0.0, 0.0, 1.0], // red
  [1.0, 1.0, 0.0, 1.0], // yellow
  [0.0, 1.0, 0.0, 1.0], // green
  [0.0, 0.0, 1.0, 1.0], // blue
];

var program;

// 관찰자에 필요한 변수
var near = -10;
var far = 10;
var radius = 1.5;
var theta = 0.0;
var phi = 0.0;
var dr = (5.0 * Math.PI) / 180.0;
var left = -1.0;
var right = 1.0;
var ytop = 1.0;
var bottom = -1.0;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

// 빛 관련 변수
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.8, 1.0);
var materialSpecular = vec4(1.0, 0.8, 0.8, 1.0);
var materialShininess = 100.0;
var ambientColor, diffuseColor, specularColor;

// 모델-뷰 매트릭스, 프로젝션 매트릭스
var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

// 회전 관련 변수
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;
var rotTheta = [0, 0, 0];
var speed = 100;
var flag = true;

function triple(a, b, c) {
  var t1 = subtract(vertices[b], vertices[a]);
  var t2 = subtract(vertices[c], vertices[a]);
  var normal = cross(t2, t1);
  normal = vec3(normal);
  normals.push(normal);
  normals.push(normal);
  normals.push(normal);
  points.push(vertices[a]);
  points.push(vertices[b]);
  points.push(vertices[c]);
  colors.push(vertexColors[a]);
  colors.push(vertexColors[a]);
  colors.push(vertexColors[a]);
}

function colorPyramid() {
  triple(0, 1, 2); // 앞면
  triple(2, 1, 3); // 우측면
  triple(3, 4, 2); // 뒷면
  triple(4, 0, 2); // 좌측면
  triple(1, 0, 4); // 밑면1
  triple(1, 4, 3); // 밑면2
}

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  gl.enable(gl.DEPTH_TEST);

  //
  //  Load shaders and initialize attribute buffers
  //
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  colorPyramid();

  var nBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

  var vNormal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

  var cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

  var vColor = gl.getAttribLocation(program, "vColor");
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
  projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

  var ambientProduct = mult(lightAmbient, materialAmbient);
  var diffuseProduct = mult(lightDiffuse, materialDiffuse);
  var specularProduct = mult(lightSpecular, materialSpecular);

  //event listeners for buttons

  document.getElementById("slider").onchange = function (event) {
    speed = 100 - event.target.value;
  };
  document.getElementById("Controls").onclick = function (event) {
    switch (event.target.index) {
      case 0:
        speed /= 2.0;
        break;
      case 1:
        speed *= 2.0;
        break;
    }
  };
  window.onkeydown = function (event) {
    var key = String.fromCharCode(event.keyCode);
    switch (key) {
      case "1":
        speed /= 2.0;
        break;
      case "2":
        speed *= 2.0;
        break;
    }
  };
  document.getElementById("xButton").onclick = function () {axis = xAxis;};
  document.getElementById("yButton").onclick = function () {axis = yAxis;};
  document.getElementById("zButton").onclick = function () {axis = zAxis;};
  document.getElementById("tButton").onclick = function () {flag = !flag;};
  document.getElementById("Button0").onclick = function () {radius *= 2.0;};
  document.getElementById("Button1").onclick = function () {radius *= 0.5;};
  document.getElementById("Button2").onclick = function () {theta += dr;};
  document.getElementById("Button3").onclick = function () {theta -= dr;};
  document.getElementById("Button4").onclick = function () {phi += dr;};
  document.getElementById("Button5").onclick = function () {phi -= dr;};

  gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct));
  gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct));
  gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct));
  gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition));
  gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
  render();
};

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if (flag) rotTheta[axis] += 2.0;
  eye = vec3(
    radius * Math.sin(theta) * Math.cos(phi),
    radius * Math.sin(theta) * Math.sin(phi),
    radius * Math.cos(theta)
  );
  modelViewMatrix = lookAt(eye, at, up);
  modelViewMatrix = mult(modelViewMatrix, rotate(rotTheta[xAxis], [1, 0, 0]));
  modelViewMatrix = mult(modelViewMatrix, rotate(rotTheta[yAxis], [0, 1, 0]));
  modelViewMatrix = mult(modelViewMatrix, rotate(rotTheta[zAxis], [0, 0, 1]));
  projectionMatrix = ortho(left, right, bottom, ytop, near, far);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
  gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

  gl.drawArrays(gl.TRIANGLES, 0, NumVertices);

  setTimeout(function () {
    requestAnimFrame(render);
  }, speed);
}
