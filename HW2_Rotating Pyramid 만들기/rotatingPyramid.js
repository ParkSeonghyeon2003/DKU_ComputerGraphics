
"use strict";

var canvas;
var gl;

var NumVertices  = 18; // 밑면 삼각형 두개(6개) + 옆면 삼각형 각각 3개(3*4=12) = 18

var points = [];
var colors = [];

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 0;
var theta = [ 0, 0, 0 ];

var thetaLoc;

var speed = 100;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    colorPyramid();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );


    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    thetaLoc = gl.getUniformLocation(program, "theta");

    //event listeners for buttons

    document.getElementById("slider").onchange = function(event) {
      speed = 100 - event.target.value;
    };
    document.getElementById("Controls").onclick = function(event) {
      switch(event.target.index) {
        case 0:
          speed /= 2.0;
          break;
        case 1:
          speed *= 2.0;
          break;
      }
    };
    window.onkeydown = function(event) {
      var key = String.fromCharCode(event.keyCode);
      switch(key) {
        case '1':
          speed /= 2.0;
          break;
        case '2':
          speed *= 2.0;
          break;
      }
    };
    document.getElementById( "xButton" ).onclick = function () {
        axis = xAxis;
    };
    document.getElementById( "yButton" ).onclick = function () {
        axis = yAxis;
    };
    document.getElementById( "zButton" ).onclick = function () {
        axis = zAxis;
    };

    render();
}

function colorPyramid()
{
    triple( 0, 1, 2 ); // 앞면
    triple( 2, 1, 3 ); // 우측면
    triple( 3, 2, 4 ); // 뒷면
    triple( 4, 2, 0 ); // 좌측면
    triple( 1, 0, 4 ); // 밑면1
    triple( 1, 3, 4 ); // 밑면2
}

function triple(a, b, c)
{
    var vertices = [
      vec4( -0.5, -0.5,  0.5, 1.0 ), // 좌측 앞
      vec4(  0.5, -0.5,  0.5, 1.0 ), // 우측 앞
      vec4(  0.0,  0.5,  0.0, 1.0 ), // 꼭대기
      vec4(  0.5, -0.5, -0.5, 1.0 ), // 우측 뒤
      vec4( -0.5, -0.5, -0.5, 1.0 )  // 좌측 뒤
    ];

    var vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ]  // blue
    ];

    //vertex color assigned by the index of the vertex

    var indices = [ a, b, c ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        //colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        colors.push(vertexColors[a]);

    }
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    theta[axis] += 2.0;
    gl.uniform3fv(thetaLoc, theta);

    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    setTimeout(
      function() {requestAnimFrame( render );},
      speed
    );
}
