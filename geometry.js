// Constrained Delaunay Triangulation code in JavaScript
// Copyright 2018 Savithru Jayasinghe
// Licensed under the MIT License (LICENSE.txt)

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

  scale(s)
  {
    return new Point(this.x*s, this.y*s);
  }

  sqDistanceTo(p1)
  {
    return (this.x - p1.x)*(this.x - p1.x) + (this.y - p1.y)*(this.y - p1.y);
  }

  toStr()
  {
    return "(" + this.x.toFixed(3) + ", " + this.y.toFixed(3) + ")";
  }

  copyFrom(p)
  {
    this.x = p.x;
    this.y = p.y;
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

function isEdgeIntersectingAtEndpoint(edgeA, edgeB)
{
  const rsq_tol = 1e-13;
  if (edgeA[0].sqDistanceTo(edgeB[0]) < rsq_tol)
    return true;

  if (edgeA[0].sqDistanceTo(edgeB[1]) < rsq_tol)
    return true;

  if (edgeA[1].sqDistanceTo(edgeB[0]) < rsq_tol)
    return true;

  if (edgeA[1].sqDistanceTo(edgeB[1]) < rsq_tol)
    return true;

  return false;
}

function isQuadConvex(p0, p1, p2, p3)
{
  var diag0 = [p0, p2];
  var diag1 = [p1, p3];

  return isEdgeIntersecting(diag0, diag1);
}

function isSameEdge(edge0, edge1)
{
  return ((edge0[0] == edge1[0] && edge0[1] == edge1[1]) ||
          (edge0[1] == edge1[0] && edge0[0] == edge1[1]))
}

function getCircumcenter(p0, p1, p2)
{
  var d = 2*(p0.x*(p1.y - p2.y) + p1.x*(p2.y - p0.y) + p2.x*(p0.y - p1.y));

  var p0_mag = p0.x*p0.x + p0.y*p0.y;
  var p1_mag = p1.x*p1.x + p1.y*p1.y;
  var p2_mag = p2.x*p2.x + p2.y*p2.y;

  var xc = (p0_mag*(p1.y - p2.y) + p1_mag*(p2.y - p0.y) + p2_mag*(p0.y - p1.y)) / d;
  var yc = (p0_mag*(p2.x - p1.x) + p1_mag*(p0.x - p2.x) + p2_mag*(p1.x - p0.x)) / d;
  //var pc = new Point(xc, yc);
  //var r = Math.sqrt(pc.sqDistanceTo(p0));

  return new Point(xc, yc); //[pc, r];
}

function getPointOrientation(edge, p)
{
  const vec_edge01 = edge[1].sub(edge[0]);
  const vec_edge0_to_p = p.sub(edge[0]);
  return cross(vec_edge01, vec_edge0_to_p);
  // if (area > 0)
  //   return 1;
  // else if (area < 0)
  //   return -1;
  // else
  //   return 0;
}
