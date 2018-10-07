'use strict';

var main_width = 600;
var main_height = 600;

var min_coord = {x:0,y:0};
var max_coord = {x:1,y:1};
var screenL = 1.0;

var vertex_list = [];

function readVertices()
{
  var file = document.getElementById("filevertex").files[0];
  if (file) {
      var reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = function (evt) {
          document.getElementById("txtvertices").innerHTML = evt.target.result;
      }
      reader.onerror = function (evt) {
          document.getElementById("txtvertices").innerHTML = "Error reading file!";
      }
  }
}

function loadVertices()
{
  var txt = document.getElementById("txtvertices");
  if (txt.value === "Vertices...\n")
    return;
  
  var txtlines = txt.value.split("\n");
  
  document.getElementById("txtedges").innerHTML = "";
  
  vertex_list = [];
  min_coord = {x:Number.MAX_VALUE ,y:Number.MAX_VALUE};
  max_coord = {x:-Number.MAX_VALUE ,y:-Number.MAX_VALUE};

  for(let i = 0; i < txtlines.length; i++)
  {
    if (txtlines[i].length > 0)
    {
      let coords = txtlines[i].split(/[ ,]+/);
      vertex_list.push({x:coords[0], y:coords[1]});
      //document.getElementById("txtedges").innerHTML += vertex_list[vertex_list.length - 1].y + "\n";
      
      min_coord.x = Math.min(min_coord.x, coords[0]);
      min_coord.y = Math.min(min_coord.y, coords[1]);
      max_coord.x = Math.max(max_coord.x, coords[0]);
      max_coord.y = Math.max(max_coord.y, coords[1]);
    }
  }
  
  screenL = Math.max(max_coord.x - min_coord.x, max_coord.y - min_coord.y);
  
  console.log("min_coord: " + min_coord.x + ", " + min_coord.y);
  console.log("max_coord: " + max_coord.x + ", " + max_coord.y);
  console.log("screenL: " + screenL);
  
  document.getElementById("vertexinfo").innerHTML = "Vertex list: " + vertex_list.length + " vertices"
  
  resizeWindow();  
  drawVertices();
}

function resizeWindow()
{
  var main_canvas = document.getElementById("main_canvas");
  main_canvas.width = main_width;
  main_canvas.height = main_height;
  
  //var main_ctx = main_canvas.getContext("2d");
  //main_ctx.fillStyle = "#FF0000";
  //main_ctx.fillRect(0,0,150,75);
}

function transformCoord(coord)
{
  var x = (coord.x - min_coord.x + 0.1*screenL) / (1.2*screenL) * main_width ;
  var y = (coord.y - min_coord.y + 0.1*screenL) / (1.2*screenL) * main_height;
  
  return {x:x, y:y};
}

function invTransformCoord(coord)
{
  var x = coord.x*1.2*screenL/main_width + min_coord.x - 0.1*screenL;
  var y = coord.y*1.2*screenL/main_height + min_coord.y - 0.1*screenL;
  
  return {x:x, y:y};
}

function drawVertices()
{
  var main_canvas = document.getElementById("main_canvas");
  var main_ctx = main_canvas.getContext("2d");
  main_ctx.clearRect(0, 0, main_canvas.width, main_canvas.height);
  
  //main_ctx.fillStyle = "#FFFFFF";
  //main_ctx.fillRect(0,0,main_canvas.width,main_canvas.height);
  //main_ctx.fillStyle = "#000000";
  
  main_ctx.beginPath();
  for(let i = 0; i < vertex_list.length; i++)
  {
    let canvas_coord = transformCoord(vertex_list[i]);
    main_ctx.fillRect(canvas_coord.x-2,canvas_coord.y-2,4,4);
  }
  
  main_ctx.closePath(); //
}

function displayCoordinates(canvas,e)
{
  var rect = canvas.getBoundingClientRect();
  var screen_coord = {x:(e.clientX - rect.left),y:(e.clientY - rect.top)};
  var coord = invTransformCoord(screen_coord);
  //console.log(rect.left + ", " + rect.top);
  document.getElementById("coorddisplay").innerHTML = "Coordinates: (" + coord.x.toFixed(3) + ", " + coord.y.toFixed(3) + ")";
}
