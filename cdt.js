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

function renderTriangulation(triangulationData)
{
  var canvas = document.getElementById("main_canvas");
  var ctx = main_canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  var verts = triangulationData.vert;
  var triangles = triangulationData.tri;
  
  //main_ctx.fillStyle = "#FFFFFF";
  //main_ctx.fillRect(0,0,main_canvas.width,main_canvas.height);
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
  
  ctx.fillStyle = "#111111";
  for(let i = 0; i < verts.length; i++)
  {
    let canvas_coord = transformCoord(verts[i]);
    ctx.fillRect(canvas_coord.x-2,canvas_coord.y-2,4,4);
  }
}

function drawPath(path)
{
  if (path.length == 0)
    return;
    
  var canvas = document.getElementById("main_canvas");
  var ctx = main_canvas.getContext("2d");
  
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
  //console.log(rect.left + ", " + rect.top);
  document.getElementById("coorddisplay").innerHTML = "Coordinates: (" + coord.x.toFixed(3) + ", " + coord.y.toFixed(3) + ")";
}

function triangulate()
{
  var nVertex = vertex_list.length;
  console.log("nVertex: " + nVertex);
  if (nVertex === 0)
    return;
    
  console.time("Delaunay");
  
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

  var prev_min_coord = min_coord;
  var prev_max_coord = max_coord;
  var prev_screenL = screenL;
  var prev_vertex_list = vertex_list;
   
  vertex_list = scaledverts;
  min_coord = new Point(-D+0.5,-D+0.5);
  max_coord = new Point(D+0.5,D+0.5);
  screenL = 2.0*D;
  
  //drawVertices();
  
  delaunay(triangulationData);
  console.timeEnd("Delaunay");
  
  console.time("renderTriangulation");
  renderTriangulation(triangulationData);
  console.timeEnd("renderTriangulation");
  
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
  var bins = triangulationData.bin;
  var triangles = triangulationData.tri;
  var adjacency = triangulationData.adj;
  
  var N = verts.length - 3; //vertices includes super triangle nodes
  
  var ind_tri = 0; //points to the super-triangle
  var nhops_total = 0;
  
  for (let i = 0; i < N; i++)
  {
    let new_i = bins[i].ind;
    renderTriangulation(triangulationData);
    
    let res = findEnclosingTriangleSlow(new_i, triangulationData, ind_tri);
    ind_tri = res[0];
    nhops_total += res[1];
    
    //console.log("ind_tri: " + ind_tri);
    
    if (ind_tri === -1)
      throw "Could not find a triangle containing the new vertex!";
      
    let cur_tri = triangles[ind_tri]; //vertex indices of triangle containing new point
    let new_tri0 = [cur_tri[0], cur_tri[1], new_i];
    let new_tri1 = [new_i, cur_tri[1], cur_tri[2]];
    let new_tri2 = [cur_tri[0], new_i, cur_tri[2]];
    
    //Replace the triangle containing the point with new_tri0, and
    //fix its adjacency
    triangles[ind_tri] = new_tri0;

    let N_tri = triangles.length;
    let cur_tri_adj = adjacency[ind_tri]; //neighbors of cur_tri
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
      let neigh_adj_ind = adjacency[cur_tri_adj[2]].indexOf(ind_tri);
      
      //No need to update adjacency, but push the neighbor on to the stack
      stack.push([cur_tri_adj[2], neigh_adj_ind]); 
    }
    if (cur_tri_adj[0] >= 0) //if triangle N_tri's neighbor exists
    {
      //Find the index for cur_tri in the adjacency of the neighbor
      let neigh_adj_ind = adjacency[cur_tri_adj[0]].indexOf(ind_tri);
      adjacency[cur_tri_adj[0]][neigh_adj_ind] = N_tri;
      stack.push([cur_tri_adj[0], neigh_adj_ind]); 
    }
    
    if (cur_tri_adj[1] >= 0) //if triangle (N_tri+1)'s neighbor exists
    {
      //Find the index for cur_tri in the adjacency of the neighbor
      let neigh_adj_ind = adjacency[cur_tri_adj[1]].indexOf(ind_tri);
      adjacency[cur_tri_adj[1]][neigh_adj_ind] = N_tri+1;
      stack.push([cur_tri_adj[1], neigh_adj_ind]); 
    }
    
    restoreDelaunay(new_i, triangulationData, stack);

  } //loop over vertices
  
  console.log("Avg hops: " + (nhops_total/N));
}

function findEnclosingTriangle(ind_vert, triangulationData, ind_tri_cur)
{
  var vertices = triangulationData.vert;
  var adjacency = triangulationData.adj;
  var target = vertices[ind_vert];
  var max_hops = Math.max(10, adjacency.length);
   
  var found_tri = false;
  var nhops = 0;
  var path = [];
  while (!found_tri && nhops < max_hops)
  {
    if (ind_tri_cur == -1)
      found_tri = true; //target is outside the super-triangle
      
    let tri_cur = triangulationData.tri[ind_tri_cur];
    
    
    var centroid = vertices[tri_cur[0]].add(vertices[tri_cur[1]]).add(vertices[tri_cur[2]]);
    centroid.x /= 3.0;
    centroid.y /= 3.0;
    path[nhops] = centroid;
    
    
    let bary_coord = barycentericCoordTriangle(target, 
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

function findEnclosingTriangleSlow(ind_vert, triangulationData, ind_tri_cur)
{
  var vertices = triangulationData.vert;
  var triangles = triangulationData.tri;
  var adjacency = triangulationData.adj;
  var target = vertices[ind_vert];
   
  for (let ind_tri = 0; ind_tri < triangles.length; ind_tri++)
  {
    let tri_cur = triangles[ind_tri];
    let bary_coord = barycentericCoordTriangle(target, 
                       vertices[tri_cur[0]],  vertices[tri_cur[1]], vertices[tri_cur[2]]);
                       
    if (bary_coord.s >= 0.0 && bary_coord.t >= 0.0 && bary_coord.u >= 0.0)
    {
      return [ind_tri, ind_tri+1];
    }
  }
  
  throw "Could not locate triangle!";
  return [-1, triangles.length];
}

function restoreDelaunay(ind_vert, triangulationData, stack)
{
  var vertices = triangulationData.vert;
  var triangles = triangulationData.tri;
  var adjacency = triangulationData.adj;
  var v_new = vertices[ind_vert];
  
  while(stack.length > 0)
  {
    let ind_tri_pair = stack.pop(); //[index of tri to check, adjncy index to goto triangle that contains new point]
    let ind_tri = ind_tri_pair[0];
     
    let ind_tri_vert = triangles[ind_tri]; //vertex indices of the triangle
    let v_tri = [];
    for (let i = 0; i < 3; i++)
      v_tri[i] = vertices[ind_tri_vert[i]];
      
    if (!isDelaunay(v_tri, v_new)) 
    {
      //v_new lies inside the circumcircle of the triangle, so need to swap diagonals
      
      let outernode_tri = ind_tri_pair[1]; // [0,1,2] node-index of vertex that's not part of the common edge
      let ind_tri_neigh = adjacency[ind_tri][outernode_tri];
      
      if (ind_tri_neigh < 0)
        throw "negative index";
      
      //Find the 0-1-2 index of the outer vertex in the neighboring triangle (which contains the new point)
      let outernode_tri_neigh = adjacency[ind_tri_neigh].indexOf(ind_tri);
      
      let outernode_tri_p1 = (outernode_tri + 1) % 3; //index of node after the outernode
      let outernode_tri_p2 = (outernode_tri + 2) % 3;
      
      let outernode_tri_neigh_p1 = (outernode_tri_neigh + 1) % 3; //index of node after the outernode
      let outernode_tri_neigh_p2 = (outernode_tri_neigh + 2) % 3;
      
      //Swap diagonal
      triangles[ind_tri][outernode_tri_p2] = triangles[ind_tri_neigh][outernode_tri_neigh];
      triangles[ind_tri_neigh][outernode_tri_neigh_p2] = triangles[ind_tri][outernode_tri];
      
      //Update adjacencies for triangles opposite outernode
      adjacency[ind_tri][outernode_tri] = adjacency[ind_tri_neigh][outernode_tri_neigh_p1];
      adjacency[ind_tri_neigh][outernode_tri_neigh] = adjacency[ind_tri][outernode_tri_p1];
      
      //Update adjacencies for neighbors of ind_tri
      let ind_tri_outerp1 = adjacency[ind_tri][outernode_tri_p1];
      if (ind_tri_outerp1 >= 0)
      {
        let neigh_node = adjacency[ind_tri_outerp1].indexOf(ind_tri);
        adjacency[ind_tri_outerp1][neigh_node] = ind_tri_neigh;
      }
      
      //Update adjacencies for neighbors of ind_tri_neigh
      let ind_tri_neigh_outerp1 = adjacency[ind_tri_neigh][outernode_tri_neigh_p1];
      if (ind_tri_neigh_outerp1 >= 0)
      {
        let neigh_node = adjacency[ind_tri_neigh_outerp1].indexOf(ind_tri_neigh);
        adjacency[ind_tri_neigh_outerp1][neigh_node] = ind_tri;
      }
      
      //Update adjacencies for triangles opposite the node after the outernode
      adjacency[ind_tri][outernode_tri_p1] = ind_tri_neigh;
      adjacency[ind_tri_neigh][outernode_tri_neigh_p1] = ind_tri;
      
      //Add the triangles opposite the new vertex to the stack
      let ind_tri_outerp2 = adjacency[ind_tri][outernode_tri_p2];
      if (ind_tri_outerp2 >= 0)
      {
        let neigh_node = adjacency[ind_tri_outerp2].indexOf(ind_tri);
        stack.push([ind_tri_outerp2, neigh_node]);
      }
      
      let ind_tri_neigh_outer = adjacency[ind_tri_neigh][outernode_tri_neigh]; 
      if (ind_tri_neigh_outer >= 0)
      {
        let neigh_node = adjacency[ind_tri_neigh_outer].indexOf(ind_tri_neigh);
        stack.push([ind_tri_neigh_outer, neigh_node]);
      }
      
      //Find the index for cur_tri in the adjacency of the neighbor
      //let neigh_adj_ind = adjacency[cur_tri_adj[2]].indexOf(ind_tri);
            
    }
    
  }
}

function isDelaunay(v_tri, p)
{
  var vec02 = v_tri[0].sub(v_tri[2]); //v_tri[0] - v_tri[2]
  var vec12 = v_tri[1].sub(v_tri[2]);
  var vec0p = v_tri[0].sub(p);
  var vec1p = v_tri[1].sub(p);
  
  var cos_a = vec02.x*vec12.x + vec02.y*vec12.y;
  var cos_b = vec1p.x*vec0p.x + vec1p.y*vec0p.y;
  
  if (cos_a >= 0 && cos_b >= 0)
    return true;
  else if (cos_a < 0 && cos_b < 0)
    return false;
  
  var sin_ab = (vec02.x*vec12.y - vec12.x*vec02.y)*cos_b
              +(vec1p.x*vec0p.y - vec0p.x*vec1p.y)*cos_a;
              
  if (sin_ab < 0)
    return false;
  else  
    return true;
}
