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
  con_edge: []
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

  for(let i = 0; i < txtlines.length; i++)
  {
    if (txtlines[i].length > 0)
    {
      let coords_str = txtlines[i].split(/[ ,]+/);
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
  
  printToLog("Loaded " + globalMeshData.vert.length + " vertices.");
  
  resizeWindow();  
  drawVertices(globalMeshData, true);
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
      let edges_str = txtlines[i].split(/[ ,]+/);
      let edges = [Number(edges_str[0]), Number(edges_str[1])];
      
      if (edges[0] < 0 || edges[0] >= nVertex ||
          edges[1] < 0 || edges[1] >= nVertex)
      {
        alert("Edge vertex indices need to be non-negative and less than the number of input vertices.");
        return;
      }
      
      globalMeshData.con_edge.push([edges[0], edges[1]]);
    }
  }
  
  document.getElementById("edgeinfo").innerHTML = "Constrained edge list: " + globalMeshData.con_edge.length + " edges"
  
  printToLog("Loaded " + globalMeshData.con_edge.length + " constrained edges.");
  
  //drawVertices(globalMeshData, true);
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
  loadVertices();
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
  var content = "";
  for (let i = 0; i < txt.value; i++)
  {
    content += Math.floor(nVertex*Math.random()) + ", " + Math.floor(nVertex*Math.random()) + "\n";
  }
  txtedges.innerHTML = content;
  txtedges.value = content;
  loadEdges();
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

function drawVertices(meshData, clearCanvas)
{
  var canvas = document.getElementById("main_canvas");
  var ctx = canvas.getContext("2d");
  
  if (clearCanvas)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#222222";
  
  ctx.beginPath();
  for(let i = 0; i < meshData.vert.length; i++)
  {
    let canvas_coord = transformCoord(meshData.vert[i]);
    ctx.fillRect(canvas_coord.x-2,canvas_coord.y-2,4,4);
  }
  ctx.closePath();
}

function renderTriangulation(meshData)
{
  var canvas = document.getElementById("main_canvas");
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  var verts = meshData.vert;
  var triangles = meshData.tri;
  
  //ctx.fillStyle = "#FFFFFF";
  //ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "#EEEEEE";
  ctx.strokeStyle = "#777777";
  ctx.lineWidth   = 1;
  
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

  drawVertices(meshData, false);
/*
  ctx.fillStyle = "#111111";
  for(let i = 0; i < verts.length; i++)
  {
    let canvas_coord = transformCoord(verts[i]);
    ctx.fillRect(canvas_coord.x-2,canvas_coord.y-2,4,4);
  }
*/
}

function drawPath(path)
{
  if (path.length == 0)
    return;
    
  var canvas = document.getElementById("main_canvas");
  var ctx = canvas.getContext("2d");
  
  ctx.strokeStyle = "#7777FF";
  ctx.fillStyle = "#1111FF";
  ctx.lineWidth   = 1;
    
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
  const D = 1000.0;
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
  
  console.time("renderTriangulation");
  t0 = performance.now();
  renderTriangulation(globalMeshData);
  t1 = performance.now();
  console.timeEnd("renderTriangulation");
  printToLog("Rendered triangulation in " + (t1 - t0).toFixed(2) + " ms.");
  
  printTriangles(globalMeshData);
  
  //Clean up
/*
  min_coord = prev_min_coord;
  max_coord = prev_max_coord;
  screenL = prev_screenL;
*/
  
  //globalMeshData.vert.splice(-3,3); //delete super-triangle nodes
  
  //printToLog("Click on a triangle or vertex for more info...<br/>");
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
  var adjacency = meshData.adj;
   
  for (let ind_tri = 0; ind_tri < triangles.length; ind_tri++)
  {
    let tri_cur = triangles[ind_tri];
    let bary_coord = barycentericCoordTriangle(target_vertex, 
                       vertices[tri_cur[0]],  vertices[tri_cur[1]], vertices[tri_cur[2]]);
                       
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
      
      //Find the 0-1-2 index of the outer vertex in the neighboring triangle (which contains the new point)
      const outernode_tri_neigh = adjacency[ind_tri_neigh].indexOf(ind_tri);
      
      const outernode_tri_p1 = (outernode_tri + 1) % 3; //index of node after the outernode
      const outernode_tri_p2 = (outernode_tri + 2) % 3;
      
      const outernode_tri_neigh_p1 = (outernode_tri_neigh + 1) % 3; //index of node after the outernode
      const outernode_tri_neigh_p2 = (outernode_tri_neigh + 2) % 3;
      
      //Swap diagonal
      triangles[ind_tri][outernode_tri_p2] = triangles[ind_tri_neigh][outernode_tri_neigh];
      triangles[ind_tri_neigh][outernode_tri_neigh_p2] = triangles[ind_tri][outernode_tri];
      
      //Update adjacencies for triangles opposite outernode
      adjacency[ind_tri][outernode_tri] = adjacency[ind_tri_neigh][outernode_tri_neigh_p1];
      adjacency[ind_tri_neigh][outernode_tri_neigh] = adjacency[ind_tri][outernode_tri_p1];
      
      //Update adjacencies for neighbors of ind_tri
      const ind_tri_outerp1 = adjacency[ind_tri][outernode_tri_p1];
      if (ind_tri_outerp1 >= 0)
      {
        const neigh_node = adjacency[ind_tri_outerp1].indexOf(ind_tri);
        adjacency[ind_tri_outerp1][neigh_node] = ind_tri_neigh;
      }
      
      //Update adjacencies for neighbors of ind_tri_neigh
      const ind_tri_neigh_outerp1 = adjacency[ind_tri_neigh][outernode_tri_neigh_p1];
      if (ind_tri_neigh_outerp1 >= 0)
      {
        const neigh_node = adjacency[ind_tri_neigh_outerp1].indexOf(ind_tri_neigh);
        adjacency[ind_tri_neigh_outerp1][neigh_node] = ind_tri;
      }
      
      //Update adjacencies for triangles opposite the node after the outernode
      adjacency[ind_tri][outernode_tri_p1] = ind_tri_neigh;
      adjacency[ind_tri_neigh][outernode_tri_neigh_p1] = ind_tri;
      
      //Add the triangles opposite the new vertex to the stack
      const ind_tri_outerp2 = adjacency[ind_tri][outernode_tri_p2];
      if (ind_tri_outerp2 >= 0)
      {
        const neigh_node = adjacency[ind_tri_outerp2].indexOf(ind_tri);
        stack.push([ind_tri_outerp2, neigh_node]);
      }
      
      const ind_tri_neigh_outer = adjacency[ind_tri_neigh][outernode_tri_neigh]; 
      if (ind_tri_neigh_outer >= 0)
      {
        const neigh_node = adjacency[ind_tri_neigh_outer].indexOf(ind_tri_neigh);
        stack.push([ind_tri_neigh_outer, neigh_node]);
      }           
    }
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
