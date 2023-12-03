"use strict";

var canvas;
var gl;
var program;

var projectionMatrix;
var modelViewMatrix;

var instanceMatrix;

var modelViewMatrixLoc;

var vertices = [
  vec4(-0.5, -0.5,  0.5, 1.0),
  vec4(-0.5,  0.5,  0.5, 1.0),
  vec4( 0.5,  0.5,  0.5, 1.0),
  vec4( 0.5, -0.5,  0.5, 1.0),
  vec4(-0.5, -0.5, -0.5, 1.0),
  vec4(-0.5,  0.5, -0.5, 1.0),
  vec4( 0.5,  0.5, -0.5, 1.0),
  vec4( 0.5, -0.5, -0.5, 1.0)
]

var bodyID = 0;
var headID = 1;
var tailID = 2;

var bodySize = [5, 3, 1];
var headSize = [2, 3, 1];
var tailSize = [1, 3, 1];

var numNodes = 3;
var numAngles = 3;

var theta = [0, 0, 0]

var numVertices = 24;

var stack = [];

var figure = [];

for(var i=0; i<numNodes; i++) figure[i] = createNode(null, null, null);

var vBuffer;
var modelViewLoc;

var pointsArray = [];

//-------------------------------------------

function scale4(size) {
   var result = mat4();
   result[0][0] = size[0];
   result[1][1] = size[1];
   result[2][2] = size[2];
   return result;
}

//--------------------------------------------

function createNode(transform, render, sibling, child) {
  var node = {
  transform: transform,
  render: render,
  sibling: sibling,
  child: child
  }
  return node;
}

function initNodes(Id) {
  var m = mat4();

  switch(Id) {
  case bodyID:
    m = rotate(theta[bodyID], 0, 1, 0);
    figure[bodyID] = createNode(m, body, null, headID);
    break;
  case headID:
    m = translate(0.5*(bodySize[0]+headSize[0]), 0.0, 0.0);
    m = mult(m, rotate(theta[headID], 0, 1, 0));
    figure[headID] = createNode(m, head, tailID, null);
  case tailID:
    m = translate(-0.5*(bodySize[0]+tailSize[0]), 0.0, 0.0);
    m = mult(m, rotate(theta[tailID], 0, 1, 0));
    figure[tailID] = createNode(m, tail, null, null);
  }
}

function traverse(Id) {
  if(Id==null) return;
  stack.push(modelViewMatrix);
  modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
  figure[Id].render();
  if(figure[Id].child != null) traverse(figure[Id].child);
  modelViewMatrix = stack.pop();
  if(figure[Id].sibling != null) traverse(figure[Id].sibling);
}

function body() {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.0, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(bodySize));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for(var i=0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function head() {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.0, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(headSize));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for(var i=0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function tail() {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.0, 0.0));
  instanceMatrix = mult(instanceMatrix, scale4(tailSize));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for(var i=0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function quad(a, b, c, d) {
  pointsArray.push(vertices[a]);
  pointsArray.push(vertices[b]);
  pointsArray.push(vertices[c]);
  pointsArray.push(vertices[d]);
}

function cube() {
  quad( 1, 0, 3, 2 );
  quad( 2, 3, 7, 6 );
  quad( 3, 0, 4, 7 );
  quad( 6, 5, 1, 2 );
  quad( 4, 5, 6, 7 );
  quad( 5, 4, 0, 1 );
}

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert("WebGL isn't available"); }

  gl.viewport(0, 0, canvas.clientWidth, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  //
  //  Load shaders and initialize attribute buffers
  //
  program = initShaders(gl, "vertex-shader", "fragment-shader");

  gl.useProgram(program);

  instanceMatrix = mat4();

  projectionMatrix = ortho(-10.0, 10.0, -10.0, 10.0, -10.0, 10.0);
  modelViewMatrix = mat4();

  gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));

  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

  cube();

  vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  document.getElementById("slider0").onchange = function(event) {
    theta[bodyID] = event.target.value;
    initNodes(bodyID);
    console.log("theta[bodyID]: "+theta[bodyID]);
  }

  for(i=0; i<numNodes; i++) initNodes(i);

  render();
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  traverse(bodyID);
  requestAnimFrame(render);
}