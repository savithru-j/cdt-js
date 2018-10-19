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
      vertex_list.push(new Point(coords[0], coords[1]));
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
    scaledverts.push(new Point(scaled_x, scaled_y));
    
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
  var D = 3.0;
  scaledverts.push(new Point(-D+0.5, -D+0.5));
  scaledverts.push(new Point(D+0.5, -D+0.5));
  scaledverts.push(new Point(0.5, D+0.5));
   
  var prev_min_coord = min_coord;
  var prev_max_coord = max_coord;
  var prev_screenL = screenL;
  var prev_vertex_list = vertex_list;
  
  vertex_list = scaledverts;
  min_coord = new Point(-D+0.5,-D+0.5);
  max_coord = new Point(D+0.5,D+0.5);
  screenL = 2.0*D;
  
  drawVertices();
  
  //Sort the vertices in ascending bin order
  bin_index.sort(binSorter);
  
  //for(let i = 0; i < bin_index.length; i++)
  //  console.log("i: " + bin_index[i].ind + ", " + bin_index[i].bin);
  
  var triangle_list = [[nVertex, (nVertex+1), (nVertex+2)]];
  var adjacency = [[-1, -1, -1]];
  
  var triangulationData = 
  {
    vert: scaledverts, 
    bin: bin_index, 
    tri: triangle_list,
    adj: adjacency
  };

  delaunay(triangulationData);
  
  //Clean up
  vertex_list = prev_vertex_list;
  min_coord = prev_min_coord;
  max_coord = prev_max_coord;
  screenL = prev_screenL;
  
// console.log("min_coord: " + min_coord.x + ", " + min_coord.y);
// console.log("max_coord: " + max_coord.x + ", " + max_coord.y);
  
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
  var verts = triangulationData.vert;
  var triangles = triangulationData.tri;
  var adjacency = triangulationData.adj;
  
  var N = verts.length - 3; //vertices includes super triangle nodes
  
  var ind_tri_start = 0; //points to the super-triangle
  for (let i = 0; i < N; i++)
  {
    var ind_tri = findEnclosingTriangle(i, triangulationData, ind_tri_start);
    console.log("ind_tri: " + ind_tri);
    
    if (ind_tri === -1)
      throw "Could not find a triangle containing the new vertex!";
      
    var cur_tri = triangles[ind_tri]; //vertex indices of triangle containing new point
    var new_tri0 = [cur_tri[0], cur_tri[1], i];
    var new_tri1 = [i, cur_tri[1], cur_tri[2]];
    var new_tri2 = [cur_tri[0], i, cur_tri[2]];
    
    //Replace the triangle containing the point with new_tri0, and
    //fix its adjacency
    triangles[ind_tri] = new_tri0;

    var N_tri = triangles.length;
    var cur_tri_adj = adjacency[ind_tri]; //neighbors of cur_tri
    adjacency[ind_tri] = [N_tri, N_tri+1, cur_tri_adj[2]];
    
    //Add the other two new triangles to the list
    triangles.push(new_tri1); //triangle index N_tri
    triangles.push(new_tri2); //triangle index (N_tri+1)
    
    adjacency.push([cur_tri_adj[0], N_tri+1, ind_tri]); //adj for triangle N_tri
    adjacency.push([N_tri, cur_tri_adj[1], ind_tri]); //adj for triangle (N_tri+1)
  
    if (cur_tri_adj[0] >= 0) //if triangle N_tri's neighbor exists
    {
      //Find the index for cur_tri in the adjacency of the neighbor
      let neigh_adj_ind = adjacency[cur_tri_adj[0]].indexOf(ind_tri);
      adjacency[cur_tri_adj[0]][neigh_adj_ind] = N_tri;
    }
    
    if (cur_tri_adj[1] >= 0) //if triangle (N_tri+1)'s neighbor exists
    {
      //Find the index for cur_tri in the adjacency of the neighbor
      let neigh_adj_ind = adjacency[cur_tri_adj[1]].indexOf(ind_tri);
      adjacency[cur_tri_adj[1]][neigh_adj_ind] = N_tri+1;
    }
     
    ind_tri_start = ind_tri;
  }
}

function findEnclosingTriangle(ind_vert, triangulationData, ind_tri_start)
{
  var vertices = triangulationData.vert;
  var adjacency = triangulationData.adj;
  var target = vertices[ind_vert];
  
  var ind_tri_cur = ind_tri_start;
  
  var found_tri = false;
  while (!found_tri)
  {
    if (ind_tri_cur == -1)
      found_tri; //target is outside the super-triangle
      
    var tri_cur = triangulationData.tri[ind_tri_cur];
    
    var bary_coord = barycentericCoordTriangle(target, 
                       vertices[tri_cur[0]],  vertices[tri_cur[1]], vertices[tri_cur[2]]);
                       
    if (bary_coord.s < 0.0)
      ind_tri_cur = adjacency[ind_tri_cur][1]; //should move to the triangle opposite edge1
    else if (bary_coord.t < 0.0)
      ind_tri_cur = adjacency[ind_tri_cur][2]; //should move to the triangle opposite edge2
    else if (bary_coord.u < 0.0)
      ind_tri_cur = adjacency[ind_tri_cur][0]; //should move to the triangle opposite edge0
    else if (bary_coord.s >= 0.0 && 
             bary_coord.t >= 0.0 && 
             bary_coord.u >= 0.0)
    {
      found_tri = true;
    }            
  }
                     
  return ind_tri_cur;
}


