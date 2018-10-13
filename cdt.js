'use strict';

var main_width = 600;
var main_height = 600;

var min_coord = new Point(0,0);
var max_coord = new Point(1,1);
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
          loadVertices();
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
  min_coord = new Point(Number.MAX_VALUE, Number.MAX_VALUE);
  max_coord = new Point(-Number.MAX_VALUE, -Number.MAX_VALUE);

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

function genRandVertices()
{
  var txt = document.getElementById("txtnumrandvertex");
  if (txt.value < 3)
  {
    alert("Require at least 3 vertices.");
    return;
  }
  
  var txtvertices = document.getElementById("txtvertices");
  var content = "";
  for (let i = 0; i < txt.value; i++)
  {
    content += Math.random() + ", " + Math.random() + "\n";
  }
  txtvertices.innerHTML = content;
  loadVertices();
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
  var y = main_height - (coord.y - min_coord.y + 0.1*screenL) / (1.2*screenL) * main_height;
  
  return new Point(x, y);
}

function invTransformCoord(coord)
{
  var x = coord.x*1.2*screenL/main_width + min_coord.x - 0.1*screenL;
  var y = (main_height - coord.y)*1.2*screenL/main_height + min_coord.y - 0.1*screenL;
  
  return new Point(x, y);
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
  var screen_coord = new Point((e.clientX - rect.left),(e.clientY - rect.top));
  var coord = invTransformCoord(screen_coord);
  //console.log(rect.left + ", " + rect.top);
  document.getElementById("coorddisplay").innerHTML = "Coordinates: (" + coord.x.toFixed(3) + ", " + coord.y.toFixed(3) + ")";
}

function triangulate()
{
  var nVertex = vertex_list.length;
  console.log("nVertex: " + nVertex);
  if (nVertex === 0)
    return;
  
  var nBinsX = Math.round(Math.pow(nVertex, 0.25));
  var nBins = nBinsX*nBinsX;
  
  //Compute scaled vertex coordinates and assign each vertex to a bin
  var scaledverts = [];
  var bin_index = [];
  for(let i = 0; i < nVertex; i++)
  {
    let scaled_x = (vertex_list[i].x - min_coord.x)/screenL;
    let scaled_y = (vertex_list[i].y - min_coord.y)/screenL;
    scaledverts.push({x:scaled_x, y:scaled_y});

    
    let ind_i = Math.round((nBinsX-1)*scaled_x);
    let ind_j = Math.round((nBinsX-1)*scaled_y);
    
    let bin_id;
    if (ind_j % 2 === 0)
    {
      bin_id = ind_j*nBinsX + ind_i;
    }
    else
    {
      bin_id = (ind_j+1)*nBinsX - ind_i - 1;
    }
    bin_index.push({ind:i,bin:bin_id});
    
    //console.log("i: " + i + ": " + scaled_x.toFixed(3) + ", " + scaled_y.toFixed(3) + ", ind: " + ind_i + ", " + ind_j + ", bin:" + bin_id);
  }
  
  console.log("nBins: " + nBins);
  
  //Add super-triangle vertices (far away)
  var D = 5.0;
  scaledverts.push({x:-D, y:-D});
  scaledverts.push({x:D, y:-D});
  scaledverts.push({x:0.0, y:D});
  
  ///*
  var prev_min_coord = min_coord;
  var prev_max_coord = max_coord;
  var prev_screenL = screenL;
  
  vertex_list = scaledverts;
  min_coord = {x:-D,y:-D};
  max_coord = {x:D,y:D};
  screenL = 2.0*D;
  //*/
  
  drawVertices();
  
  //Sort the vertices in ascending bin order
  bin_index.sort(binSorter);
  
  //for(let i = 0; i < bin_index.length; i++)
  //  console.log("i: " + bin_index[i].ind + ", " + bin_index[i].bin);
  
  var triangle_list = [{v0:nVertex, v1:(nVertex+1), v2:(nVertex+2)}];
  
  var triangulationData = {vertices:scaledverts, bins:bin_index, triangles:triangle_list};

  var p = new Point(2,3);
  delaunay(triangulationData);
  
  //Clean up
  vertex_list.splice(-3,3);
  min_coord = prev_min_coord;
  max_coord = prev_max_coord;
  screenL = prev_screenL;
  
  var p1 = new Point(0,0);
  var p2 = new Point(2,0);
  var p3 = new Point(0,2);
  var p = new Point(-0.1, -0.1);
  console.log(barycentericCoordTriangle(p, p1, p2, p3));
}

function binSorter(a, b) 
{
	if (a.bin == b.bin) {
		return 0;
	} else {
		return a.bin < b.bin ? -1 : 1;
	}
}

//Function for computing the unconstrained Delaunay triangulation
function delaunay(triangulationData)
{
  var verts = triangulationData.vertices;
  var N = verts.length - 3; //vertices includes super triangle nodes
  
  var ind_tri_start = 0; //points to the super-triangle
  for (let i = 0; i < N; i++)
  {
    var ind_tri = findEnclosingTriangle(i, triangulationData, ind_tri_start);
  }
}

function findEnclosingTriangle(ind_vert, triangulationData, ind_tri_start)
{

}


