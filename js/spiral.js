// Initialize default and global layer/model numbers
var cycleCount = 3
var segmentCount = 6
var startRadius = 5
var startAngle = 0
const maxSegments = 24;

// Create some basic functions for reuse later on

// Creates a bounding box for containing stuff
const bbox = function (width, height, leftOffset, topOffset) {
  return {
    width,
    height,
    left: leftOffset,
    bottom: height + topOffset,
    right: leftOffset + width,
    top: topOffset
  };
}

// Creates a bounding box for a matrix with the shape specified 
// that fully fits inside of the outer bounding box taking up
// as much space as it can given the respective shapes
const mbox = function (bbox, shape) {
  const [gridHeight, gridWidth] = shape;
  // leave an extra margin for aggregator displays
  const box = {}
  if (gridHeight / gridWidth > bbox.height / bbox.width) {
    // tall matrix, use bbox height, adjust width
    box.height = bbox.height;
    box.width = box.height * gridWidth / gridHeight;
    box.top = bbox.top;
    box.left = bbox.left + (bbox.width - box.width) / 2; // need to fix based on margin
  } else {
    // fat matrix, use bbox width, adjust height
    box.width = bbox.width;
    box.height = box.width * gridHeight / gridWidth;
    box.left = bbox.left;
    box.top = bbox.top + (bbox.height - boxHeight) / 2; // need to take margin into account
  }
  box.bottom = box.top + box.height;
  box.right = box.left + box.width;
  return box;
}


// Get the window size and fill it with one big svg
const width = window.innerWidth * .95;
const height = window.innerHeight * .95;
const svg = d3.create("svg")
  .attr("width", width)
  .attr("height", height);

// Append the SVG element.
container.append(svg.node());


const color = d3.scaleSequential(d3.interpolateSinebow)

const maxX = 10
const minX = -10
const maxY = 10
const minY = -10
const numCols = maxX-minX+1
const numRows = maxY-minY+1

  const shape = [numRows, numCols]

  const m = mbox(bbox(width, height, 0, 0), shape)
  color.domain([0, maxSegments]);

  // Declare the x (horizontal position) scale.
  const gridX = d3.scaleBand()
    .domain([...Array(numCols).keys()])
    .range([m.left, m.right]);

  const scaleX = d3.scaleLinear()
    .domain([minX-.5, maxX+.5])
    .range([m.left, m.right]);

  // Declare the y (vertical position) scale.
  const gridY = d3.scaleBand()
    .domain([...Array(numRows).keys()])
    .range([m.top, m.bottom]);

  const scaleY = d3.scaleLinear()
    .domain([minY-.5, maxY+.5])
    .range([m.top, m.bottom]);

  function drawGrid() {

  svg.selectAll(".m")
    .data([...Array(numRows*numCols).keys()])
    .join("rect")
    .attr("class", "m")
    .attr("x", (d, i) => gridX(i % numCols))
    .attr("y", (d, i) => gridY(Math.trunc(i / numCols)))
    .attr("width", gridX.bandwidth())
    .attr("height", gridY.bandwidth())
    .style("stroke", "black")
    .style("fill", "white")

//  fill the grid as a simple visual test -- circles should be centered
//  in each grid square
//  
//  svg.selectAll(".c")
//    .data([...Array(numRows*numCols).keys()])
//    .join("circle")
//    .attr("class", "c")
//    .attr("cx", (d, i) => x((i % numCols) - (numCols-1)/2))
//    .attr("cy", (d, i) => y(Math.floor(i / numCols - (numRows-1)/2)))
//    .attr("r", gridY.bandwidth()/4)
//    .style("fill", "red")
  }
drawGrid()

const draw = () => {
  const seed = [...Array(segmentCount*cycleCount).keys()]
  const base = Math.pow(2,1/segmentCount)
  const r = (i) => (Math.pow(base,i))
  const theta = (i) => ((i % segmentCount) * 2 * Math.PI / segmentCount)
  //const x = ([r,theta]) => r * Math.cos(theta)
  const xc = ([r,theta]) => r * Math.cos(theta)
  const yc = ([r,theta]) => r * Math.sin(theta)
  const radial = seed.map(i=>[r(i),theta(i)])
  const cartesian = radial.map((i)=>[xc(i),yc(i)])
  console.log(cartesian)
  svg.selectAll(".c")
    .data(cartesian)
    .join("circle")
    .attr("class", "c")
    .attr("cx", ([x,y], i) => scaleX(x))
    .attr("cy", ([x,y], i) => scaleY(y))
    .attr("r", gridY.bandwidth()/4)
    .style("fill", "red")
}
draw()

const maxCycles = 4;
// get rid of the 0 entry and reverse
d3.select("#cycle-select")
    .selectAll('option')
    .data([...Array(maxCycles).keys()].map(k=>k+1))
    .enter()
    .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    .attr("value", function (d) { return d; }) // corresponding value returned by the button
    .attr("selected", (d) => (d==cycleCount ? "selected" : null))

  d3.select("#cycle-select").on("change", function (d) {
    cycleCount = d3.select(this).property("value")
    redraw()
  })




  d3.select("#segment-select")
    .selectAll('option')
    .data([...Array(maxSegments).keys()].map(k=>k+1))
    .enter()
    .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    .attr("value", function (d) { return d; }) // corresponding value returned by the button
    .attr("selected", (d) => (d==segmentCount ? "selected" : null))

  d3.select("#segment-select")
    .on("change", function (d) {
      segmentCount = d3.select(this).property("value")
      redraw() 
    })
const redraw = draw
