// Constrained Delaunay Triangulation code in JavaScript
// Copyright 2018 Savithru Jayasinghe

'use strict';

var main_width = 600;
var main_height = 600;

var min_coord = new Point(0,0);
var max_coord = new Point(1,1);
var screenL = 1.0;

var globalMeshData = 
{
  vert: [],
  scaled_vert: [], 
  bin: [],
  tri: [],
  adj: [],
  con_edge: [],
  vert_to_tri: []
};

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
  
  globalMeshData.vert = [];
  
  min_coord = new Point(Number.MAX_VALUE, Number.MAX_VALUE);
  max_coord = new Point(-Number.MAX_VALUE, -Number.MAX_VALUE);

  for(let i = 0; i < txtlines.length; i++)
  {
    if (txtlines[i].length > 0)
    {
      let coords_str = txtlines[i].trim().split(/[ ,]+/);
      
      if (coords_str.length != 2)
      {
        alert("Vertex " + i + " does not have 2 coordinates!");
        globalMeshData.vert = [];
        break; 
      }
      
      let coords = [Number(coords_str[0]), Number(coords_str[1])];
      globalMeshData.vert.push(new Point(coords[0], coords[1]));

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
  
  document.getElementById("vertexinfo").innerHTML = "Vertex list: " + globalMeshData.vert.length + " vertices"
}


function loadEdges()
{
  var txt = document.getElementById("txtedges");
  if (txt.value === "Edges...\n")
    return;
  
  var txtlines = txt.value.split("\n");
  var nVertex = globalMeshData.vert.length;
  
  globalMeshData.con_edge = [];

  for(let i = 0; i < txtlines.length; i++)
  {
    if (txtlines[i].length > 0)
    {
      let edge_str = txtlines[i].trim().split(/[ ,]+/);
      
      if (edge_str.length != 2)
      {
        alert("Edge " + i + " does not have 2 node indices!");
        globalMeshData.con_edge = [];
        break; 
      }
      
      let edge = [Number(edge_str[0]), Number(edge_str[1])];
      
      if (edge[0] < 0 || edge[0] >= nVertex ||
          edge[1] < 0 || edge[1] >= nVertex)
      {
        alert("Vertex indices of edge " + i + " need to be non-negative and less than the number of input vertices.");
        globalMeshData.con_edge = [];
        break;
      }
      
      if (edge[0] === edge[1])
      {
        alert("Edge " + i + " is degenerate!");
        globalMeshData.con_edge = [];
        break;
      }
      
      if (!isEdgeValid(edge, globalMeshData.con_edge, globalMeshData.vert))
      {
        alert("Edge " + i + " already exists or intersects with an existing edge!");
        globalMeshData.con_edge = [];
        break;
      }
      
      globalMeshData.con_edge.push([edge[0], edge[1]]);
    }
  }
  
  document.getElementById("edgeinfo").innerHTML = "Constrained edge list: " + globalMeshData.con_edge.length + " edges"
}

function loadInputData()
{
  loadVertices();
  loadEdges();
  
  printToLog("Loaded " + globalMeshData.vert.length + " vertices and " +
             globalMeshData.con_edge.length + " constrained edges.");

  resizeWindow();  
  var canvas = document.getElementById("main_canvas");
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
    
  globalMeshData.tri = [];
  globalMeshData.adj = [];
  
  renderTriangulation(globalMeshData);
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
  txtvertices.value = content;
  
  //Clear any previous edges
  var txtedges = document.getElementById("txtedges");
  txtedges.innerHTML = "";
  txtedges.value = "";
  
  loadInputData();
}

function genRandEdges()
{
  var nVertex = globalMeshData.vert.length;
  if (nVertex == 0)
  {
    alert("Require at least 3 vertices.");
    return;
  }
  
  var txt = document.getElementById("txtnumrandedges");
  var txtedges = document.getElementById("txtedges");
  
  var nEdgeMax = nVertex*(nVertex - 1) / 2;
  if (txt.value > nEdgeMax)
  {
    alert("The maximum number of constrained edges possible between " + nVertex + " points is " + nEdgeMax + ".");
    return;
  }
  
  var edge_list = [];
  var maxIter = 5*nEdgeMax;
  var iter = 0;
  while (edge_list.length < txt.value && iter < maxIter)
  {
    iter++;
    let new_edge = [Math.floor(nVertex*Math.random()), Math.floor(nVertex*Math.random())];
    
    if (new_edge[0] === new_edge[1])
      continue;
      
    if (!isEdgeValid(new_edge, edge_list, globalMeshData.vert))
      continue;
    
    edge_list.push(new_edge);
  }
  
  var content = "";
  for (let i = 0; i < edge_list.length; i++)
    content += edge_list[i][0] + ", " + edge_list[i][1] + "\n";

  txtedges.innerHTML = content;
  txtedges.value = content;
  loadInputData();
}

function isEdgeValid(newEdge, edgeList, vertices)
{
  var new_edge_verts = [vertices[newEdge[0]], vertices[newEdge[1]]];
  
  for (let i = 0; i < edgeList.length; i++)
  {
    //Not valid if edge already exists
    if ( (edgeList[i][0] == newEdge[0] && edgeList[i][1] == newEdge[1]) ||
         (edgeList[i][0] == newEdge[1] && edgeList[i][1] == newEdge[0]) )
      return false;
      
    let edge_verts = [vertices[edgeList[i][0]], vertices[edgeList[i][1]]];
    
    if (isEdgeIntersecting(edge_verts, new_edge_verts))
      return false;
  }
  
  return true;
}

function resizeWindow()
{
  var canvas = document.getElementById("main_canvas");
  canvas.width = main_width;
  canvas.height = main_height;
  
  //var ctx = canvas.getContext("2d");
  //ctx.fillStyle = "#FF0000";
  //ctx.fillRect(0,0,150,75);
}

function printToLog(str)
{
  var div_log = document.getElementById("div_log");
  div_log.innerHTML += "> " + str + "<br/>";
  
  div_log.scrollTop = div_log.scrollHeight;
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

function drawVertices(meshData)
{
  var canvas = document.getElementById("main_canvas");
  var ctx = canvas.getContext("2d");
  
  ctx.fillStyle = "#222222";
  
  ctx.beginPath();
  for(let i = 0; i < meshData.vert.length; i++)
  {
    let canvas_coord = transformCoord(meshData.vert[i]);
    ctx.fillRect(canvas_coord.x-2,canvas_coord.y-2,4,4);
  }
  ctx.closePath();
}

function drawEdges(meshData)
{
  var canvas = document.getElementById("main_canvas");
  var ctx = canvas.getContext("2d");
  ctx.strokeStyle = "#FF7777";
  ctx.lineWidth = 3;
  
  var verts = meshData.vert;
  var edges = meshData.con_edge;
  
  for(let iedge = 0; iedge < edges.length; iedge++)
  {   
    let v0 = verts[edges[iedge][0]];
    let v1 = verts[edges[iedge][1]];
    
    let canvas_coord = transformCoord(v0);
    
    ctx.beginPath();
    ctx.moveTo(canvas_coord.x,canvas_coord.y);   
    canvas_coord = transformCoord(v1);
    ctx.lineTo(canvas_coord.x,canvas_coord.y);
    ctx.closePath();
    ctx.stroke();
  }
  
}

function renderTriangulation(meshData)
{
  var canvas = document.getElementById("main_canvas");
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  var verts = meshData.vert;
  var triangles = meshData.tri;
  
  ctx.fillStyle = "#EEEEEE";
  ctx.strokeStyle = "#777777";
  ctx.lineWidth = 1;
  
  for(let itri = 0; itri < triangles.length; itri++)
  {
    ctx.beginPath();
    
    let v0 = verts[triangles[itri][0]];
    let canvas_coord = transformCoord(v0);
    ctx.moveTo(canvas_coord.x,canvas_coord.y);
    
    for (let node = 1; node < 3; node++)
    {
      let v = verts[triangles[itri][node]];
      let canvas_coord = transformCoord(v);
      ctx.lineTo(canvas_coord.x,canvas_coord.y);
    }
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  drawEdges(meshData);
  drawVertices(meshData, false);
}

function drawPath(path)
{
  if (path.length == 0)
    return;
    
  var canvas = document.getElementById("main_canvas");
  var ctx = canvas.getContext("2d");
  
  ctx.strokeStyle = "#7777FF";
  ctx.fillStyle = "#1111FF";
  ctx.lineWidth = 1;
    
  ctx.beginPath();
  let canvas_coord = transformCoord(path[0]);
  ctx.moveTo(canvas_coord.x,canvas_coord.y);
  ctx.fillRect(canvas_coord.x-2,canvas_coord.y-2,4,4);
  
  for(let i = 1; i < path.length; i++)
  {   
    let canvas_coord = transformCoord(path[i]);
    ctx.lineTo(canvas_coord.x,canvas_coord.y);
  }
  
  ctx.stroke();
}

function displayCoordinates(canvas,e)
{ 
  var rect = canvas.getBoundingClientRect();
  var screen_coord = new Point((e.clientX - rect.left),(e.clientY - rect.top));
  var coord = invTransformCoord(screen_coord);
  document.getElementById("coorddisplay").innerHTML = "<b>Coordinates:</b> " + coord.toStr();
}

function displayTriangulationInfo(canvas,e)
{
  var ctx = canvas.getContext("2d");
  var rect = canvas.getBoundingClientRect();
  var mouse_coord = new Point((e.clientX - rect.left),(e.clientY - rect.top));
   
  var verts = globalMeshData.vert;
  var triangles = globalMeshData.tri;
  var adjacency = globalMeshData.adj;
   
  if (verts.length == 0)
    return;
  
  renderTriangulation(globalMeshData);
  ctx.fillStyle = "#FF0000";
  ctx.strokeStyle = "#777777";
  ctx.lineWidth = 1;
  
  var foundVertex = false;
  for (let i = 0; i < verts.length; i++)
  {
    var coord = verts[i];
    let canvas_coord = transformCoord(coord);
    if (canvas_coord.sqDistanceTo(mouse_coord) <= 9)
    {
      ctx.fillRect(canvas_coord.x-4,canvas_coord.y-4,8,8);
      document.getElementById("div_info").innerHTML = 
      "<b>Vertex:</b> <br>&nbsp &nbsp Index: " + i +
      "<br>&nbsp &nbsp Coordinates: " + coord.toStr();
      foundVertex = true;
      break;
    }
  }
  if (foundVertex)
    return;
    
  var foundTriangle = false;
  if (triangles.length > 0)
  {
    const mouse_phys_coord = invTransformCoord(mouse_coord);
    const scaled_x = (mouse_phys_coord.x - min_coord.x)/screenL;
    const scaled_y = (mouse_phys_coord.y - min_coord.y)/screenL;
    const mouse_scaled_coord = new Point(scaled_x, scaled_y);
  
    const res = findEnclosingTriangle(mouse_scaled_coord, globalMeshData, 0);
    const ind_tri = res[0];
    
    if (ind_tri >= 0)
    {
      ctx.beginPath();
      
      let v0 = verts[triangles[ind_tri][0]];
      let canvas_coord = transformCoord(v0);
      ctx.moveTo(canvas_coord.x,canvas_coord.y);
      
      for (let node = 1; node < 3; node++)
      {
        let v = verts[triangles[ind_tri][node]];
        let canvas_coord = transformCoord(v);
        ctx.lineTo(canvas_coord.x,canvas_coord.y);
      }
      
      ctx.closePath();
      ctx.fillStyle = "#4da6ff"; //"#ffc34d";
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = "#b3d9ff"; //"#ffe6b3";
      let adj_str = "";
      for (let adj_tri = 0; adj_tri < 3; adj_tri++)
      {
        ctx.beginPath();
      
        let ind_adj_tri = adjacency[ind_tri][adj_tri];
        if (ind_adj_tri == -1)
          continue;
          
        if (adj_str == "")
          adj_str = ind_adj_tri;
        else
          adj_str += ", " + ind_adj_tri;  
          
        let v0 = verts[triangles[ind_adj_tri][0]];
        let canvas_coord = transformCoord(v0);
        ctx.moveTo(canvas_coord.x,canvas_coord.y);
        
        for (let node = 1; node < 3; node++)
        {
          let v = verts[triangles[ind_adj_tri][node]];
          let canvas_coord = transformCoord(v);
          ctx.lineTo(canvas_coord.x,canvas_coord.y);
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      
      document.getElementById("div_info").innerHTML = 
      "<b>Triangle:</b>" +
      "<br>&nbsp &nbsp Index: " + ind_tri +
      "<br>&nbsp &nbsp Vertex indices: " + triangles[ind_tri][0] + ", " + triangles[ind_tri][1] + ", " + triangles[ind_tri][2] + 
      "<br>&nbsp &nbsp Vertex coords: " + verts[triangles[ind_tri][0]].toStr() + ", " + verts[triangles[ind_tri][1]].toStr() + ", " + verts[triangles[ind_tri][2]].toStr() + 
      "<br>&nbsp &nbsp Adjacent triangles: " + adj_str;
      
      foundTriangle = true;
      
      drawEdges(globalMeshData);
      drawVertices(globalMeshData, false);
    }
  }
  
  if (!foundVertex && !foundTriangle)
    document.getElementById("div_info").innerHTML = "Click on a triangle or vertex for more info...";
}

function triangulate()
{
  const nVertex = globalMeshData.vert.length;
  console.log("nVertex: " + nVertex);
  if (nVertex === 0)
    return;
    
  console.time("Delaunay");
  var t0 = performance.now();
  
  const nBinsX = Math.round(Math.pow(nVertex, 0.25));
  const nBins = nBinsX*nBinsX;
  
  //Compute scaled vertex coordinates and assign each vertex to a bin
  var scaledverts = [];
  var bin_index = [];
  for(let i = 0; i < nVertex; i++)
  {
    const scaled_x = (globalMeshData.vert[i].x - min_coord.x)/screenL;
    const scaled_y = (globalMeshData.vert[i].y - min_coord.y)/screenL;
    scaledverts.push(new Point(scaled_x, scaled_y));
    
    const ind_i = Math.round((nBinsX-1)*scaled_x);
    const ind_j = Math.round((nBinsX-1)*scaled_y);
    
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
  const D = 200.0;
  scaledverts.push(new Point(-D+0.5, -D+0.5));
  scaledverts.push(new Point(D+0.5, -D+0.5));
  scaledverts.push(new Point(0.5, D+0.5));
  
  globalMeshData.vert.push(new Point(screenL*(-D+0.5) + min_coord.x, screenL*(-D+0.5) + min_coord.y));
  globalMeshData.vert.push(new Point(screenL*(D+0.5) + min_coord.x, screenL*(-D+0.5) + min_coord.y));
  globalMeshData.vert.push(new Point(screenL*(0.5) + min_coord.x, screenL*(D+0.5) + min_coord.y));
    
  //Sort the vertices in ascending bin order
  bin_index.sort(binSorter);
  
  //for(let i = 0; i < bin_index.length; i++)
  //  console.log("i: " + bin_index[i].ind + ", " + bin_index[i].bin);
  
  globalMeshData.scaled_vert = scaledverts;
  globalMeshData.bin = bin_index;
  globalMeshData.tri = [[nVertex, (nVertex+1), (nVertex+2)]]; //super-triangle
  globalMeshData.adj = [[-1, -1, -1]]; //adjacency
  globalMeshData.vert_to_tri = [];
  
/*
  var prev_min_coord = min_coord;
  var prev_max_coord = max_coord;
  var prev_screenL = screenL;
   
  vertex_list = scaledverts;
  min_coord = new Point(-D+0.5,-D+0.5);
  max_coord = new Point(D+0.5,D+0.5);
  screenL = 2.0*D;
*/
   
  delaunay(globalMeshData);
  var t1 = performance.now();
  console.timeEnd("Delaunay");
  printToLog("Computed Delaunay triangulation in " + (t1 - t0).toFixed(2) + " ms.");
  
  renderTriangulation(globalMeshData);
  constrainEdges(globalMeshData);
  
  console.time("renderTriangulation");
  t0 = performance.now();
  renderTriangulation(globalMeshData);
  t1 = performance.now();
  console.timeEnd("renderTriangulation");
  printToLog("Rendered triangulation in " + (t1 - t0).toFixed(2) + " ms.");
  
  printTriangles(globalMeshData);
  
  document.getElementById("div_info").innerHTML = "Click on a triangle or vertex for more info...";
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
function delaunay(meshData)
{
  var verts = meshData.scaled_vert;
  var bins = meshData.bin;
  var triangles = meshData.tri;
  var adjacency = meshData.adj;
  
  const N = verts.length - 3; //vertices includes super triangle nodes
  
  var ind_tri = 0; //points to the super-triangle
  var nhops_total = 0;
  
  for (let i = 0; i < N; i++)
  {
    const new_i = bins[i].ind;
    //renderTriangulation(meshData);
    
    const res = findEnclosingTriangle(verts[new_i], meshData, ind_tri);
    ind_tri = res[0];
    nhops_total += res[1];
        
    if (ind_tri === -1)
      throw "Could not find a triangle containing the new vertex!";
      
    let cur_tri = triangles[ind_tri]; //vertex indices of triangle containing new point
    let new_tri0 = [cur_tri[0], cur_tri[1], new_i];
    let new_tri1 = [new_i, cur_tri[1], cur_tri[2]];
    let new_tri2 = [cur_tri[0], new_i, cur_tri[2]];
    
    //Replace the triangle containing the point with new_tri0, and
    //fix its adjacency
    triangles[ind_tri] = new_tri0;

    const N_tri = triangles.length;
    const cur_tri_adj = adjacency[ind_tri]; //neighbors of cur_tri
    adjacency[ind_tri] = [N_tri, N_tri+1, cur_tri_adj[2]];
    
    //Add the other two new triangles to the list
    triangles.push(new_tri1); //triangle index N_tri
    triangles.push(new_tri2); //triangle index (N_tri+1)
    
    adjacency.push([cur_tri_adj[0], N_tri+1, ind_tri]); //adj for triangle N_tri
    adjacency.push([N_tri, cur_tri_adj[1], ind_tri]); //adj for triangle (N_tri+1)
  
    //stack of triangles which need to be checked for Delaunay condition
    //each element contains: [index of tri to check, adjncy index to goto triangle that contains new point]
    let stack = []; 
    
    if (cur_tri_adj[2] >= 0) //if triangle cur_tri's neighbor exists
    {
      //Find the index for cur_tri in the adjacency of the neighbor
      const neigh_adj_ind = adjacency[cur_tri_adj[2]].indexOf(ind_tri);
      
      //No need to update adjacency, but push the neighbor on to the stack
      stack.push([cur_tri_adj[2], neigh_adj_ind]); 
    }
    if (cur_tri_adj[0] >= 0) //if triangle N_tri's neighbor exists
    {
      //Find the index for cur_tri in the adjacency of the neighbor
      const neigh_adj_ind = adjacency[cur_tri_adj[0]].indexOf(ind_tri);
      adjacency[cur_tri_adj[0]][neigh_adj_ind] = N_tri;
      stack.push([cur_tri_adj[0], neigh_adj_ind]); 
    }
    
    if (cur_tri_adj[1] >= 0) //if triangle (N_tri+1)'s neighbor exists
    {
      //Find the index for cur_tri in the adjacency of the neighbor
      const neigh_adj_ind = adjacency[cur_tri_adj[1]].indexOf(ind_tri);
      adjacency[cur_tri_adj[1]][neigh_adj_ind] = N_tri+1;
      stack.push([cur_tri_adj[1], neigh_adj_ind]); 
    }
    
    restoreDelaunay(new_i, meshData, stack);

  } //loop over vertices
  
  console.log("Avg hops: " + (nhops_total/N));
  removeBoundaryTriangles(meshData);
  
  printToLog("Created " + triangles.length + " triangles."); 
}

function findEnclosingTriangle(target_vertex, meshData, ind_tri_cur)
{
  var vertices = meshData.scaled_vert;
  var triangles = meshData.tri;
  var adjacency = meshData.adj;
  const max_hops = Math.max(10, adjacency.length);
   
  var found_tri = false;
  var nhops = 0;
  var path = [];
  while (!found_tri && nhops < max_hops)
  {
    if (ind_tri_cur === -1)
    {
      found_tri = true; //target is outside triangulation
      break;
    }
      
    let tri_cur = triangles[ind_tri_cur];
    
    var centroid = vertices[tri_cur[0]].add(vertices[tri_cur[1]]).add(vertices[tri_cur[2]]);
    centroid.x /= 3.0;
    centroid.y /= 3.0;
    path[nhops] = centroid;
    
    let bary_coord = barycentericCoordTriangle(target_vertex, 
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
    
    nhops++;
  }
  
  if(!found_tri)
  {
    console.log("nhops: " + (nhops-1));
    drawPath(path);
    throw "Could not locate triangle!";
  }
  
  //console.log("nhops: " + (nhops-1));
                    
  return [ind_tri_cur, (nhops-1)];
}

function findEnclosingTriangleSlow(target_vertex, meshData, ind_tri_cur)
{
  var vertices = meshData.scaled_vert;
  var triangles = meshData.tri;
   
  for (let ind_tri = 0; ind_tri < triangles.length; ind_tri++)
  {
    let tri_cur = triangles[ind_tri];
    let bary_coord = barycentericCoordTriangle(target_vertex, 
                       vertices[tri_cur[0]],  vertices[tri_cur[1]], vertices[tri_cur[2]]);
    console.log(bary_coord);                   
    if (bary_coord.s >= 0.0 && bary_coord.t >= 0.0 && bary_coord.u >= 0.0)
    {
      return [ind_tri, ind_tri+1];
    }
  }
  
  throw "Could not locate triangle!";
  return [-1, triangles.length];
}

function restoreDelaunay(ind_vert, meshData, stack)
{
  var vertices = meshData.scaled_vert;
  var triangles = meshData.tri;
  var adjacency = meshData.adj;
  var v_new = vertices[ind_vert];
  
  while(stack.length > 0)
  {
    const ind_tri_pair = stack.pop(); //[index of tri to check, adjncy index to goto triangle that contains new point]
    const ind_tri = ind_tri_pair[0];
     
    const ind_tri_vert = triangles[ind_tri]; //vertex indices of the triangle
    let v_tri = [];
    for (let i = 0; i < 3; i++)
      v_tri[i] = vertices[ind_tri_vert[i]];
      
    if (!isDelaunay2(v_tri, v_new)) 
    {
      //v_new lies inside the circumcircle of the triangle, so need to swap diagonals
      
      const outernode_tri = ind_tri_pair[1]; // [0,1,2] node-index of vertex that's not part of the common edge
      const ind_tri_neigh = adjacency[ind_tri][outernode_tri];
      
      if (ind_tri_neigh < 0)
        throw "negative index";
      
      //Swap the diagonal between the adjacent triangles
      swapDiagonal(meshData, ind_tri, ind_tri_neigh);
        
      //Add the triangles opposite the new vertex to the stack
      const new_node_ind_tri = triangles[ind_tri].indexOf(ind_vert);
      const ind_tri_outerp2 = adjacency[ind_tri][new_node_ind_tri];
      if (ind_tri_outerp2 >= 0)
      {
        const neigh_node = adjacency[ind_tri_outerp2].indexOf(ind_tri);
        stack.push([ind_tri_outerp2, neigh_node]);
      }
      
      const new_node_ind_tri_neigh = triangles[ind_tri_neigh].indexOf(ind_vert);
      const ind_tri_neigh_outer = adjacency[ind_tri_neigh][new_node_ind_tri_neigh]; 
      if (ind_tri_neigh_outer >= 0)
      {
        const neigh_node = adjacency[ind_tri_neigh_outer].indexOf(ind_tri_neigh);
        stack.push([ind_tri_neigh_outer, neigh_node]);
      }
      
    } //is not Delaunay
  }
}

//Swaps the diagonal of adjacent triangles A and B
function swapDiagonal(meshData, ind_triA, ind_triB)
{
  var triangles = meshData.tri;
  var adjacency = meshData.adj;
  var vert2tri = meshData.vert_to_tri;
  
  //Find the node index of the outer vertex in each triangle
  const outernode_triA = adjacency[ind_triA].indexOf(ind_triB);
  const outernode_triB = adjacency[ind_triB].indexOf(ind_triA);

  //Indices of nodes after the outernode (i.e. nodes of the common edge)
  const outernode_triA_p1 = (outernode_triA + 1) % 3;
  const outernode_triA_p2 = (outernode_triA + 2) % 3;

  const outernode_triB_p1 = (outernode_triB + 1) % 3;
  const outernode_triB_p2 = (outernode_triB + 2) % 3;

  //Update triangle nodes
  triangles[ind_triA][outernode_triA_p2] = triangles[ind_triB][outernode_triB];
  triangles[ind_triB][outernode_triB_p2] = triangles[ind_triA][outernode_triA];
  
  //Update adjacencies for triangle opposite outernode
  adjacency[ind_triA][outernode_triA] = adjacency[ind_triB][outernode_triB_p1];
  adjacency[ind_triB][outernode_triB] = adjacency[ind_triA][outernode_triA_p1];
  
  //Update adjacency of neighbor opposite triangle A's (outernode+1) node
  const ind_triA_neigh_outerp1 = adjacency[ind_triA][outernode_triA_p1];
  if (ind_triA_neigh_outerp1 >= 0)
  {
    const neigh_node = adjacency[ind_triA_neigh_outerp1].indexOf(ind_triA);
    adjacency[ind_triA_neigh_outerp1][neigh_node] = ind_triB;
  }
  
  //Update adjacency of neighbor opposite triangle B's (outernode+1) node
  const ind_triB_neigh_outerp1 = adjacency[ind_triB][outernode_triB_p1];
  if (ind_triB_neigh_outerp1 >= 0)
  {
    const neigh_node = adjacency[ind_triB_neigh_outerp1].indexOf(ind_triB);
    adjacency[ind_triB_neigh_outerp1][neigh_node] = ind_triA;
  }
  
  //Update adjacencies for triangles opposite the (outernode+1) node
  adjacency[ind_triA][outernode_triA_p1] = ind_triB;
  adjacency[ind_triB][outernode_triB_p1] = ind_triA;
  
  //Update vertex to triangle connectivity, if data structure exists
  if (vert2tri.length > 0)
  {
    //The original outernodes will now be part of both triangles
    vert2tri[triangles[ind_triA][outernode_triA]].push(ind_triB);
    vert2tri[triangles[ind_triB][outernode_triB]].push(ind_triA);
    
    //Remove triangle B from the triangle set of outernode_triA_p1
    let local_ind = vert2tri[triangles[ind_triA][outernode_triA_p1]].indexOf(ind_triB);
    vert2tri[triangles[ind_triA][outernode_triA_p1]].splice(local_ind, 1);
    
    //Remove triangle A from the triangle set of outernode_triB_p1
    local_ind = vert2tri[triangles[ind_triB][outernode_triB_p1]].indexOf(ind_triA);
    vert2tri[triangles[ind_triB][outernode_triB_p1]].splice(local_ind, 1); 
  }
}

function removeBoundaryTriangles(meshData)
{
  var verts = meshData.scaled_vert;  
  var triangles = meshData.tri;
  var adjacency = meshData.adj;
  const N = verts.length - 3;

  var del_count = 0;
  var indmap = [];
  for (let i = 0; i < triangles.length; i++)
  {
    let prev_del_count = del_count;
    for (let j = i; j < triangles.length; j++)
    {
      if (triangles[j][0] < N && triangles[j][1] < N && triangles[j][2] < N)
      {
        indmap[i+del_count] = i;
        break;
      }
      else
      {
        indmap[i+del_count] = -1;
        del_count++;
      }
    }
    
    let del_length = del_count - prev_del_count;
    if (del_length > 0)
    {
      triangles.splice(i, del_length);
      adjacency.splice(i, del_length);
    }
  }
  
  //Update adjacencies
  for (let i = 0; i < adjacency.length; i++)
    for (let j = 0; j < 3; j++)
      adjacency[i][j] = indmap[adjacency[i][j]];
      
  //Delete super-triangle nodes
  meshData.scaled_vert.splice(-3,3);
  meshData.vert.splice(-3,3);
}

function isDelaunay(v_tri, p)
{
  const vec02 = v_tri[0].sub(v_tri[2]); //v_tri[0] - v_tri[2]
  const vec12 = v_tri[1].sub(v_tri[2]);
  const vec0p = v_tri[0].sub(p);
  const vec1p = v_tri[1].sub(p);
  
  const cos_a = vec02.x*vec12.x + vec02.y*vec12.y;
  const cos_b = vec1p.x*vec0p.x + vec1p.y*vec0p.y;
  
  if (cos_a >= 0 && cos_b >= 0)
    return true;
  else if (cos_a < 0 && cos_b < 0)
    return false;
  
  const sin_ab = (vec02.x*vec12.y - vec12.x*vec02.y)*cos_b
                +(vec1p.x*vec0p.y - vec0p.x*vec1p.y)*cos_a;
              
  if (sin_ab < 0)
    return false;
  else  
    return true;
}

function isDelaunay2(v_tri, p)
{
  const vecp0 = v_tri[0].sub(p);
  const vecp1 = v_tri[1].sub(p);
  const vecp2 = v_tri[2].sub(p);

  const p0_sq = vecp0.x*vecp0.x + vecp0.y*vecp0.y;
  const p1_sq = vecp1.x*vecp1.x + vecp1.y*vecp1.y;
  const p2_sq = vecp2.x*vecp2.x + vecp2.y*vecp2.y;
  
  const det = vecp0.x * (vecp1.y * p2_sq - p1_sq * vecp2.y)
             -vecp0.y * (vecp1.x * p2_sq - p1_sq * vecp2.x)
             + p0_sq  * (vecp1.x * vecp2.y - vecp1.y * vecp2.x);
           
  if (det > 0) //p is inside circumcircle of v_tri
    return false;
  else
    return true;
}

function printTriangles(meshData)
{
  var txttri = document.getElementById("txttriangles");
  var content = "";
  for (let i = 0; i < meshData.tri.length; i++)
    content += meshData.tri[i][0] + ", " + meshData.tri[i][1] + ", " + meshData.tri[i][2] + "\n";
  
  txttri.innerHTML = content;
}

function constrain()
{
  constrainEdges(globalMeshData);
}

function constrainEdges(meshData)
{
  if (meshData.con_edge.length == 0)
    return;
  
  buildVertexConnectivity(meshData);
  
  var con_edges = meshData.con_edge;
  var triangles = meshData.tri;
  var verts = meshData.scaled_vert;
  var adjacency = meshData.adj;
  var vert2tri = meshData.vert_to_tri;
  
  var maxPasses = con_edges.length;
  var pass = 0;
  var num_added_edges = 0;
  while (pass < maxPasses) //Loop until all constrained edges have been added to triangulation
  {
    num_added_edges = 0;
    
    for (let iedge = 0; iedge < con_edges.length; iedge++)
    {
      let edge_v0_ind = con_edges[iedge][0];
      let edge_v1_ind = con_edges[iedge][1];
      let edge_coords = [verts[edge_v0_ind], verts[edge_v1_ind]];
      
      let tri_around_v0 = vert2tri[edge_v0_ind];
      
      let edge_in_triangulation = false;
      let intersections = []; //stores the index of tri that intersects current edge, and the edge-index of 
                              //intersecting edge in triangle
      for (let itri = 0; itri < tri_around_v0.length; itri++)
      {
        let cur_tri = triangles[tri_around_v0[itri]];
        let v0_node = cur_tri.indexOf(edge_v0_ind);
        let v0p1_node = (v0_node+1) % 3;
        let v0p2_node = (v0_node+2) % 3;
        
        if ( edge_v1_ind == cur_tri[v0p1_node] )
        {
          //constrained edge is an edge of the current tri (node v0_node to v0_node+1)
          edge_in_triangulation = true; 
          break;
        }
        else if ( edge_v1_ind == cur_tri[v0p2_node] )
        {
          //constrained edge is an edge of the current tri (node v0_node to v0_node+2)
          edge_in_triangulation = true; 
          break;
        }
        
        let opposite_edge_coords = [verts[cur_tri[v0p1_node]], verts[cur_tri[v0p2_node]]];
        if (isEdgeIntersecting(edge_coords, opposite_edge_coords))
        {
          intersections.push([tri_around_v0[itri], v0_node]);
          break;
        }
      }
      
      if (edge_in_triangulation)
      {
        num_added_edges++;
        continue; //nothing to do, so continue
      }
        
      while (true)
      {
        let prev_intersection = intersections[intersections.length - 1]; //[tri ind][node ind for edge]
        let tri_ind = adjacency[prev_intersection[0]][prev_intersection[1]];
        
        if ( triangles[tri_ind][0] == edge_v1_ind ||
             triangles[tri_ind][1] == edge_v1_ind ||
             triangles[tri_ind][2] == edge_v1_ind )
        {
          break; //found the end node of the edge
        }
        
        //Find the index of the edge from which we came into this triangle
        let prev_edge_ind = adjacency[tri_ind].indexOf(prev_intersection[0]);
        if (prev_edge_ind == -1)
          throw "Could not find edge!";
          
        let cur_tri = triangles[tri_ind];
          
        //Loop over the other two edges in this triangle,
        //and check if they intersect the constrained edge
        for (let offset = 1; offset < 3; offset++)
        {
          let v0_node = (prev_edge_ind+offset+1) % 3;
          let v1_node = (prev_edge_ind+offset+2) % 3;
          let cur_edge_coords = [verts[cur_tri[v0_node]], verts[cur_tri[v1_node]]];
          
          if (isEdgeIntersecting(edge_coords, cur_edge_coords))
          {
            intersections.push([tri_ind, (prev_edge_ind+offset) % 3]);
            break;
          }
        }
        
        //console.log("edge: " + iedge + ", intersection: " + intersections[intersections.length - 1]);
        
      } //while intersections not found
      
      processEdgeIntersections(meshData, intersections, [edge_v0_ind, edge_v1_ind]);
    
    } //loop over constrained edges
  
    console.log("Num added edges: " + num_added_edges);
    if (num_added_edges == con_edges.length)
      break; //all constrained edges have been added
      
    pass++;
  }
  
  if (num_added_edges != con_edges.length)
    throw "Could not add all edges to triangulation!";

}

function buildVertexConnectivity(meshData)
{
  var triangles = meshData.tri;
  meshData.vert_to_tri = [];
  var vConnectivity = meshData.vert_to_tri;
  
  for (let itri = 0; itri < triangles.length; itri++)
  {
    for (let node = 0; node < 3; node++)
    {
      if (vConnectivity[triangles[itri][node]] == undefined)
        vConnectivity[triangles[itri][node]] = [itri];
      else
        vConnectivity[triangles[itri][node]].push(itri);
    }
  }
}

function processEdgeIntersections(meshData, intersectionList, con_edge_nodes)
{
  var triangles = meshData.tri;
  var verts = meshData.scaled_vert;
  var adjacency = meshData.adj;
  
  //var con_edge_coords = [verts[con_edge_nodes[0]], verts[con_edge_nodes[1]]];
  
  var nIntersections = intersectionList.length;
  for (let i = 0; i < nIntersections; i++)
  {     
    //Looping in reverse order is important since then the
    //indices in intersectionList remain unaffected by any diagonal swaps
    let tri0_ind = intersectionList[nIntersections - 1 - i][0];
    let tri0_node = intersectionList[nIntersections - 1 - i][1];
    
    let tri1_ind = adjacency[tri0_ind][tri0_node];
    let tri1_node = adjacency[tri1_ind].indexOf(tri0_ind);
    
    let quad_v0 = verts[triangles[tri0_ind][tri0_node]];
    let quad_v1 = verts[triangles[tri0_ind][(tri0_node + 1) % 3]];
    let quad_v2 = verts[triangles[tri1_ind][tri1_node]];
    let quad_v3 = verts[triangles[tri0_ind][(tri0_node + 2) % 3]];
    
    let isConvex = isQuadConvex(quad_v0, quad_v1, quad_v2, quad_v3);
    //console.log("tri: " + tri0_ind + ", " + tri1_ind + ", convex: " + isConvex);
    
    if (isConvex)
    {
      swapDiagonal(meshData, tri0_ind, tri1_ind);
      //renderTriangulation(meshData);
      
      for (let j = nIntersections - 2 - i; j >= 0; j--)
      {
        if (intersectionList[j][0] == tri0_ind)
        {
          console.log("tri0_ind: " + intersectionList[j][0] + ", " + intersectionList[j][1])
        }
        else if (intersectionList[j][0] == tri1_ind)
        {
          console.log("tri1_ind: " + intersectionList[j][0] + ", " + intersectionList[j][1])
        }
      }
      
    }
    
  }
        
//        let newDiagonal_nodes = [triangles[tri0_ind][tri0_node], triangles[tri1_ind][tri1_node]];
//        let newDiagonal_coords = [quad_v0, quad_v2];
//        let isDiagonalDetached = (newDiagonal_nodes[0] != con_edge_nodes[0] && newDiagonal_nodes[0] != con_edge_nodes[1]) &&
//                                 (newDiagonal_nodes[1] != con_edge_nodes[0] && newDiagonal_nodes[1] != con_edge_nodes[1]);
//        if (isDiagonalDetached && isEdgeIntersecting(con_edge_coords, newDiagonal_coords))
//        {
//          incompleteList.push([tri0_ind, ((tri0_node + 1) % 3)]);
//        }
//        else
//        {
//        
//        }

//      else
//      {
//        incompleteList.push(intersection);
//      }
      
//    }
    
//    if (incompleteList.length == 0)
//      break;
//    else 
//    {
//      //while (incompleteList.length > 0)
//      //  intersectionList.push(incompleteList.pop());
//    }
//  }
}
