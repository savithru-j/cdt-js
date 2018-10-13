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
