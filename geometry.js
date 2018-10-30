// Constrained Delaunay Triangulation code in JavaScript
// Copyright 2018 Savithru Jayasinghe

class Point
{
  constructor(x,y)
  {
    this.x = x;
    this.y = y;
  }
  
  dot(p1)
  {
    return (this.x*p1.x + this.y*p1.y);
  }
  
  add(p1)
  {
    return new Point(this.x + p1.x, this.y + p1.y);
  }
  
  sub(p1)
  {
    return new Point(this.x - p1.x, this.y - p1.y);
  }
  
  sqDistanceTo(p1)
  {
    return (this.x - p1.x)*(this.x - p1.x) + (this.y - p1.y)*(this.y - p1.y);
  }
  
  toStr()
  {
    return "(" + this.x.toFixed(3) + ", " + this.y.toFixed(3) + ")";
  }
}

function cross(vec0, vec1)
{
  return (vec0.x*vec1.y - vec0.y*vec1.x);
}

function barycentericCoordTriangle(p, pt0, pt1, pt2)
{
  var vec0 = pt1.sub(pt0);
  var vec1 = pt2.sub(pt0);
  var vec2 = p.sub(pt0);
  
  var d00 = vec0.dot(vec0);
  var d01 = vec0.dot(vec1);
  var d11 = vec1.dot(vec1);
  var d20 = vec2.dot(vec0);
  var d21 = vec2.dot(vec1);
  var denom = d00*d11 - d01*d01;
  var s = (d11 * d20 - d01 * d21) / denom;
  var t = (d00 * d21 - d01 * d20) / denom;
  var u = 1.0 - s - t;
  
  return {s:s, t:t, u:u};
}

function isEdgeIntersecting(edgeA, edgeB)
{
  var vecA0A1 = edgeA[1].sub(edgeA[0]);
  var vecA0B0 = edgeB[0].sub(edgeA[0]);
  var vecA0B1 = edgeB[1].sub(edgeA[0]);
  
  var AxB0 = cross(vecA0A1, vecA0B0);
  var AxB1 = cross(vecA0A1, vecA0B1);
  
  //Check if the endpoints of edgeB are on the same side of edgeA
  if ((AxB0 > 0 && AxB1 > 0) || (AxB0 < 0 && AxB1 < 0))
    return false;
  
  var vecB0B1 = edgeB[1].sub(edgeB[0]);
  var vecB0A0 = edgeA[0].sub(edgeB[0]);
  var vecB0A1 = edgeA[1].sub(edgeB[0]);
  
  var BxA0 = cross(vecB0B1, vecB0A0);
  var BxA1 = cross(vecB0B1, vecB0A1);
  
  //Check if the endpoints of edgeA are on the same side of edgeB
  if ((BxA0 > 0 && BxA1 > 0) || (BxA0 < 0 && BxA1 < 0))
    return false;

  //Special case of colinear edges
  if (Math.abs(AxB0) < 1e-14 && Math.abs(AxB1) < 1e-14)
  {
    //Separated in x
    if ( (Math.max(edgeB[0].x, edgeB[1].x) < Math.min(edgeA[0].x, edgeA[1].x)) ||
         (Math.min(edgeB[0].x, edgeB[1].x) > Math.max(edgeA[0].x, edgeA[1].x)) )
      return false;
      
    //Separated in y
    if ( (Math.max(edgeB[0].y, edgeB[1].y) < Math.min(edgeA[0].y, edgeA[1].y)) ||
         (Math.min(edgeB[0].y, edgeB[1].y) > Math.max(edgeA[0].y, edgeA[1].y)) )
      return false;
  }
  
  return true;
}

function isQuadConvex(p0, p1, p2, p3)
{
  var diag0 = [p0, p2];
  var diag1 = [p1, p3];
  
  return isEdgeIntersecting(diag0, diag1);
}
