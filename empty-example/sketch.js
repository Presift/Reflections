let numRows = 10;
let numCols = 20;
let gridSize = 50;
let canvasWidth = numCols * gridSize;
let canvasHeight = numRows * gridSize;
let strokeWeightVal = gridSize/10;

let gameObjects = [];
let gameObjectsToReveal = [];
let selectedStart = null;
let selectedEnd = null;
let selectedObj = null;

let drawUserGuidedSegment = false;
let ignoreRelease = false;
let submitButton = null;
let textPrompt1 = "Locate and select the 1st virtual image's appearance on the mirror."
let textPrompt2 = "Nice work! Now select the segment that represents the perceived distance of the 1st virtual image."
let textPrompt3 = "Excellent! Locate and select the 2nd virtual image's appearance on the mirror."
let textPrompt4 = "Nice work! Now select the segment that represents the perceived distance of the 2nd virtual image."
let tryAgainPrompt = "Try again";
let noSelectionPrompt = "Please make a selection";
let textPrompts = [textPrompt1, textPrompt2, textPrompt3, textPrompt4];
let answers = [];
let trialIdx = 0;

function setup() {
  createCanvas(canvasWidth, canvasHeight);
  this.submitButton = createButton("Submit");
  this.submitButton.position(0, canvasHeight);
  this.submitButton.mouseClicked(handleSubmit.bind(this));
  this.submitButton.mousePressed(submitButtonPressed.bind(this)); // this is to ensure that mouseReleased doesn't nullify the user's selection
  
  this.backgroundColor = color(0,0,0);
  background(this.backgroundColor)

  let mirrorDistance = 6;
  let mirrorColor =  color(80, 170, 170);
  let virtualMirrorColor = color(170, 170, 170);
  let originObjColor = color(0, 0, 255);
  let virtualObjColor = color(80, 150, 255);
  let distanceColor = color(34, 139, 34);
  let distanceColor2 = color(139, 34, 139);
  let intersectionColor = color(255, 255, 255);
  let reflectionSegmentColor = color(60, 60, 60);
  
  let mirrorXStart = 1
  let mirror = new Mirror(mirrorXStart, 1, 1, 8, mirrorColor);
  let mirror2 = new Mirror(mirrorXStart + mirrorDistance, 1, 1 + mirrorDistance, 8, mirrorColor);
  let virtualMirror = new Mirror(mirrorXStart + mirrorDistance * 2, 1, 1 + mirrorDistance * 2, 8, virtualMirrorColor);
  let virtualMirror2 = new Mirror(mirrorXStart + mirrorDistance * 3, 1, 1 + mirrorDistance * 3, 8, virtualMirrorColor);
  let observer = new Observer(mirrorXStart + mirrorDistance - 2, 7);

  let originalItemXOffset = mirrorDistance/3
  let originalItem = new Item(mirrorXStart + originalItemXOffset, 2, originObjColor);
  let virtualItem = new Item(mirrorXStart + mirrorDistance + (mirrorDistance - originalItemXOffset), 2, virtualObjColor);
  let virtualItem2 = new Item(mirrorXStart + mirrorDistance * 2 +  originalItemXOffset, 2, virtualObjColor);
  
  let lineToMirror = new Segment(originalItem.x1, originalItem.y1, 7, 2, distanceColor);
  
  let intersection = new Pivot(lineToMirror, mirror2, intersectionColor);
  let rightAngleSymbol = new RightAngle(intersection.x1, intersection.y1);

  let virtualMirrorToVirtual = new Segment(virtualItem.x1, virtualItem.y1, virtualMirror.x1, 2, distanceColor2);
  let intersection2 = new Pivot(virtualMirrorToVirtual, virtualMirror, intersectionColor);
  let reflectionSegment = new Segment(virtualItem.x1, virtualItem.y1, observer.x1, observer.y1, reflectionSegmentColor);
  let reflectionSegment2 = new Segment(virtualItem2.x1, virtualItem2.y1, observer.x1, observer.y1, reflectionSegmentColor);
  let intersection3 = new Intersection(reflectionSegment, mirror2, intersectionColor);
  let intersection4 = new Intersection(reflectionSegment2, mirror2, intersectionColor);
  
  mirror.visible = true;
  mirror2.visible = true;
  observer.visible = true;
  originalItem.visible = true;
  lineToMirror.visible = true;
  intersection.visible = true;
  virtualMirror.visible = true;
  rightAngleSymbol.visible = true;
  reflectionSegment.autoReveal = false;
  reflectionSegment2.autoReveal = false;

  this.gameObjects = [rightAngleSymbol, mirror, mirror2, virtualMirror, virtualMirror2,
                      lineToMirror, virtualMirrorToVirtual,
                      reflectionSegment, reflectionSegment2, 
                      observer, originalItem, virtualItem, virtualItem2,                   
                      intersection,  intersection2, intersection3, intersection4,
                      ];
  answers = [intersection3, reflectionSegment, intersection4, reflectionSegment2];
                    
}

function draw() {  
  // drawGrid();
  background(this.backgroundColor)
  textAlign(CENTER, CENTER);
  textSize(16);
  stroke(color(0,0,0));
  text(trialIdx >= textPrompts.length ? "Great work! That's all for now, folks." : textPrompts[trialIdx], canvasWidth/2, canvasHeight - 50);

  for (var i = 0; i < this.gameObjects.length; i++) {
      this.gameObjects[i].display();
  }

  if (this.drawUserGuidedSegment) {
    this.drawLiveSegment();
  }
}

function mousePressed() {
  if (ignoreRelease) {
    return;
  }
  let obj = this.getCollision(mouseX, mouseY);
  if (!obj) {
    this.endSelection()
    return;
  }
  this.handleCollision(obj)
}

function mouseDragged() {
  if (!this.selectedObj) {
    return;
  } 

  let obj = this.getCollision(mouseX, mouseY);

  if (!obj) {
    if (!this.selectedEnd) {
      this.drawUserGuidedSegment = true;
    } 
    return;
  }

  // if segment is selected, draw radius of same length through drag location
  if (this.selectedObj instanceof Segment) {
    this.drawUserGuidedSegment = true;
    return;
  }

  if (this.selectedObj != obj) {
    this.handleNewCollision(obj);
  }
}


function mouseReleased() {
  if (ignoreRelease) {
    return;
  }
  
  this.drawUserGuidedSegment = false;
  this.selectedStart = null;
  this.selectedEnd = null;

  if (this.gameObjectsToReveal) {
    for (var i = 0; i < this.gameObjectsToReveal.length; i ++) {
      this.gameObjectsToReveal[i].visible = true;
    }
  }
  this.gameObjectsToReveal = [];
}

function handleSubmit() {
  if (trialIdx >= answers.length) {
    return;
  }
  
  if (this.selectedObj == answers[trialIdx]) {
    trialIdx ++;
  }
  ignoreRelease = false;
}

function submitButtonPressed() {
  ignoreRelease = true;
}

function drawGrid() {
  fill(255, 255, 255)
  stroke(0, 0, 0) 
  strokeWeight(1)
  for (let x = 0; x < canvasWidth; x += gridSize) {
    for (let y = 0; y < canvasHeight; y += gridSize) {
      rect(x, y, gridSize, gridSize);
    }
  }
}

function drawLiveSegment() {
  let pivotX = this.selectedStart.x1 * gridSize;
  let pivotY = this.selectedStart.y1 * gridSize;
  
  // Translate the origin to the pivot point
  translate(pivotX, pivotY);
  
  let angle = atan2(mouseY - pivotY, mouseX - pivotX);
  
  // Rotate the coordinate system by the angle
  rotate(angle);
  
  if (this.selectedObj instanceof Segment) {
    stroke(this.selectedObj.highlightColor);
    line(0, 0, this.selectedObj.length * gridSize, 0);
  } else {
    stroke(255, 165, 0);
    d = dist(pivotX, pivotY, mouseX, mouseY);
    line(0, 0, d, 0);
  }
  
  // Restore the coordinate system to its original position
  rotate(-angle);
  translate(-pivotX, -pivotY);


  let segmentLength = this.selectedObj.length;
  let endX = this.selectedStart.x1 + segmentLength * cos(angle);
  let endY = this.selectedStart.y1 + segmentLength * sin(angle);

  let obj = getCollision(endX * gridSize, endY * gridSize);
  if (obj instanceof Item && !obj.visible) {
    obj.visible = true;

    // add any relevant segments for reveal queue
    this.gameObjectsToReveal = obj.getReveals(this.gameObjects);
  }

}

function handleNewCollision(obj) {
    let segmentMatch = this.getSegment(obj.x1, obj.y1, this.selectedObj.x1, this.selectedObj.y1);
    // if line exists between these 2 objects
    if (segmentMatch) {
      segmentMatch.visible = true;
      this.selectedEnd = obj;
      this.handleCollision(segmentMatch)
      // get reveals
      this.gameObjectsToReveal = segmentMatch.getReveals(this.gameObjects);
    } 
    return;
}

function handleCollision(obj) {
  if (this.selectedObj == null) {
    obj.select(true);
    this.selectedObj = obj;
    this.selectedStart = obj;
    return;
  }
  if (this.selectedObj == obj) {
    this.endSelection();
    return;
  }
  else {
    this.selectedObj.select(false);
    obj.select(true);
    this.selectedObj = obj;
    this.selectedStart = this.selectedStart ? this.selectedStart : obj;
    return;
  }
}

function endSelection() {
  if (this.selectedObj) {
    this.selectedObj.select(false);
    this.selectedObj = null;
  }
}

function getCollision(mouseX, mouseY) {
  for (var i =0; i < this.gameObjects.length; i++ ) {
    let obj = this.gameObjects[i];
    if (obj.collidesWith(mouseX, mouseY)) {
      return obj;
    }
  }
  return null;
}

function getSegment(x1, y1, x2, y2) {
  for (var i = 0; i < this.gameObjects.length; i ++){
    let obj = this.gameObjects[i];
    if (obj instanceof Segment) {
      if ((obj.x1 == x1 && obj.y1 == y1 && obj.x2 == x2 && obj.y2 == y2) || (obj.x1 == x2 && obj.y1 == y2 && obj.x2 == x1 && obj.y2 == y1)) {
        return obj;
      }
    }
  }
  return null;
}

class GameObject {

  x1 = 0;
  y1 = 0;
  visible = false;
  autoReveal = true;
  color = color(255, 0, 0);
  highlightColor = color(255, 255, 0);
  unselectColor = this.color;

  constructor(x, y, color) {
    this.x1 = x;
    this.y1 = y;
    this.color = color || this.color;
    this.unselectColor = color || this.color;
    this.display()
  }

  get length() { return 0 }

  collidesWith(mouseX, mouseY) { return false }


  display() {
    if (!this.visible) {
      return;
    } 
    this.draw()   
  }

  draw() {}

  equals(other) {
    if (other instanceof GameObject) {
      return this.x1 === other.x1 && this.y1 === other.y1 && this.x2 == other.x2 && this.y2 == other.y2;
    }
    return false;
  }

  intersectsWith(otherObjects) {
    // TODO: this is not air tight...
    var objects = [];
    for (var i = 0; i < otherObjects.length; i++ ) {
      let obj = otherObjects[i];
      if (obj instanceof GameObject && !this.equals(obj)) {
        if ((this.x1 == obj.x1 && this.y1 == obj.y1) || (this.x1 == obj.x2 && this.y1 == obj.y2)) {
          objects.push(obj);
        }
      }
    }
    return objects;
  }

  isPointOnSegment(px, py, x1, y1, x2, y2) {
    let d1 = dist(px, py, x1, y1);
    let d2 = dist(px, py, x2, y2);
    let segmentLength = dist(x1, y1, x2, y2);
    let sumOfDistances = d1 + d2;
    return abs(sumOfDistances - segmentLength) < 0.01;
  }

  getReveals(gameObjects) { return [] }

  select(isSelected) {
    this.color = isSelected ? this.highlightColor : this.unselectColor
    this.display()
  }

}

class Segment extends GameObject {

  constructor(x1, y1, x2, y2, color) {
    super(x1, y1, color);
    this.x2 = x2;
    this.y2 = y2;
    
    this.display();
  }

  get length() {
    return dist(this.x1, this.y1, this.x2, this.y2);
  }

  draw() {
    stroke(this.color);
    strokeWeight(strokeWeightVal);
    line(this.x1 * gridSize, this.y1 * gridSize, this.x2 * gridSize, this.y2 * gridSize);
  }

  select(isSelected) {
    this.color = isSelected ? this.highlightColor : this.unselectColor
    this.display()
  }

  intersectsWith(otherObjects) {
    // TODO: this is not air tight...
    var objects = [];
    for (var i = 0; i < otherObjects.length; i++ ) {
      let obj = otherObjects[i];
      if (obj instanceof GameObject && !this.equals(obj)) {
        // print(`obj x1, y1, x2, y2 ${obj.x1}, ${obj.y1}, ${obj.x2}. ${obj.y2}`)
        if (this.isPointOnSegment(obj.x1, obj.y1, this.x1, this.y1, this.x2, this.y2)) {
          objects.push(obj);
        }
      }
    }
    return objects;
  }

  getReveals(gameObjects) {
    let objectsToReveal = []
    let intersectObjs = this.intersectsWith(gameObjects);
    for (var i=0; i< intersectObjs.length; i++) {
      if (intersectObjs[i].autoReveal) {
        objectsToReveal.push(intersectObjs[i])
      }
    }
    return objectsToReveal;
  }

}

class Mirror extends Segment {

  constructor(x1, y1, x2, y2, color) {
    super(x1, y1, x2, y2, color);
  }
}

class Observer extends GameObject {

  draw() {
    stroke(this.color);
    fill(this.color);
    ellipse(this.x1 * gridSize, this.y1 * gridSize, gridSize, gridSize)
  }

  collidesWith(mouseX, mouseY) { 
    let d = dist(mouseX, mouseY, this.x1 * gridSize, this.y1 * gridSize);
    return d < gridSize;
  }
}

class Item extends GameObject {

  constructor(x1, y1, color) {
    super(x1, y1, color);
  }

  draw() {
    stroke(this.color);
    fill(this.color);

    let halfSideLength = gridSize / 2;
    let height = (Math.sqrt(3) / 2) * gridSize;
    let centerX = gridSize * this.x1;
    let centerY = gridSize * this.y1;
  
    // // Calculate the vertices of the equilateral triangle
    let x1 = centerX - halfSideLength;
    let y1 = centerY + (height / 3);
    let x2 = centerX + halfSideLength;
    let y2 = centerY + (height / 3);
    let x3 = centerX;
    let y3 = centerY - (2 * height / 3);
  
    triangle(x1, y1, x2, y2, x3, y3);
  }

  collidesWith(mouseX, mouseY) { 
    let d = dist(mouseX, mouseY, this.x1 * gridSize, this.y1 * gridSize);
    return d < gridSize;
  }

  getReveals(gameObjects) {
    let objectsToReveal = []
    let intersectObjs = this.intersectsWith(gameObjects);
    for (var i=0; i< intersectObjs.length; i++) {
      if (intersectObjs[i].autoReveal) {
        let downstreamReveals = intersectObjs[i].getReveals(gameObjects);
        downstreamReveals.push(intersectObjs[i])
        objectsToReveal = objectsToReveal.concat(downstreamReveals);
      }
    }
    return objectsToReveal;
  }

}

class Intersection extends GameObject {
  
  constructor(s1, s2, color) {
    let x = s1.x1;
    let y = s1.y1;
    let x2 = s1.x2;
    let y2 = s1.y2;
    let x3 = s2.x1;
    let y3 = s2.y1;
    let x4 = s2.x2;
    let y4 = s2.y2;
  
    // Calculate the denominator of the equations
    let denominator = ((y4 - y3) * (x2 - x)) - ((x4 - x3) * (y2 - y));
  
    // Calculate the numerator of the first equation
    let numerator1 = ((x4 - x3) * (y - y3)) - ((y4 - y3) * (x - x3));
  
    // Calculate the numerator of the second equation
    let numerator2 = ((x2 - x) * (y - y3)) - ((y2 - y) * (x - x3));
  
    // Check if the lines are parallel
    if (denominator == 0) {
      return null;
    }
  
    let t1 = numerator1 / denominator;
    let t2 = numerator2 / denominator;
  
    // Check if the intersection point lies within both line segments
    if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
      let x1 = x + (t1 * (x2 - x));
      let y1 = y + (t1 * (y2 - y));
      super(x1, y1, color)
    } 
  }

  draw() {
    stroke(color(0,0,0));
    fill(this.color);
    ellipse(this.x1 * gridSize, this.y1 * gridSize, gridSize/2, gridSize/2)
  }

  collidesWith(mouseX, mouseY) { 
    let d = dist(mouseX, mouseY, this.x1 * gridSize, this.y1 * gridSize);
    return d < gridSize/2;
  }
}

class Pivot extends Intersection {
  draw() {
    stroke(color(80,80,80));
    fill(this.color);
    ellipse(this.x1 * gridSize, this.y1 * gridSize, gridSize/4, gridSize/4)
  }
}

class RightAngle extends GameObject {
  constructor(x, y, color) {
    super(x, y, color);
  }

  get length() {
    return gridSize/3;
  }

  draw() {
    stroke(color(80,80,80));
    fill(this.color);
  
    // Draw the horizontal line
    line(this.x1 * gridSize - this.length, this.y1 * gridSize + this.length, this.x1 * gridSize, this.y1 * gridSize + this.length);
    
    // Draw the vertical line
    line(this.x1 * gridSize - this.length, this.y1 * gridSize, this.x1 * gridSize - this.length, this.y1 * gridSize + this.length);
  }
}