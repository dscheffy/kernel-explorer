const getQueryParams = () => {
  const qp = {};
  window.location.search
  .replace(/\?/,"")
  .split("&")
  .map(x => x.split("="))
  .filter(x => x && Array.isArray(x) && x.length === 2)
  .forEach(pair => qp[decodeURIComponent(pair[0])]=decodeURIComponent(pair[1]));
  return qp;  
}

const setQueryParams = (qp) => {
  if (history.replaceState) {
    const queryString = !(qp && Object.keys(qp).length > 0) ? "" :
      "?" + Object.keys(qp)
      .map(key => (encodeURIComponent(key) + "=" + encodeURIComponent(qp[key])))
      .join("&");
    var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + queryString;
    window.history.replaceState({path:newurl},'',newurl);
  }
}

var qp = getQueryParams()
var selectable = {...qp}


const buildInput = (name) => {
  const id = name + "-select"
  const value = selectable[name]

  const selectors = d3.select("#selectors")
  selectors.append("label").attr("for",id).text(name+": ");
  
  const input = selectors.append("input")
  input 
    .attr("id",id)
    .attr("type", "text")
    .attr("name",id)
    .attr("value",value)

  input 
    .on("change", function (d) {
      const selection = d3.select(this).property("value")
      selectable[name] = selection
      qp[name] = selection
      setQueryParams(qp)
      redraw() 
    })
}
const buildSelector = (name, options) => {
  const id = name + "-select"
  const value = selectable[name]

  const selectors = d3.select("#selectors")
  selectors.append("label").attr("for",id).text(name+": ");
  
  const selector = selectors.append("select")
  selector.attr("id",id)
  
  selector
    .selectAll("option")
    .data(options)
    .enter()
    .append("option")
    .text(d=>d)
    .attr("value", d=>d) 
    .attr("selected", d => (d==value ? "selected" : null))

  selector
    .on("change", function (d) {
      const selection = d3.select(this).property("value")
      selectable[name] = Number.parseFloat(selection)
      qp[name] = selection
      setQueryParams(qp)
      redraw() 
    })
}

// Initialize default and global layer/model numbers
selectable.cycles ??= 3
selectable.segments ??= 6
selectable.initialRadius ??= 2
selectable.cycleMultiplier ??= 1.8
selectable.startAngle ??= 0
selectable.stride ??= 4
selectable.xShift ??= 0.1
selectable.yShift ??= 0.1
selectable.tile ??= 1
const maxSegments = 24;
const maxCycles = 4;


buildSelector("segments", [...Array(maxSegments).keys()].map(k=>k+1))
buildSelector("cycles", [...Array(maxCycles).keys()].map(k=>k+1))
buildInput("initialRadius")
buildInput("cycleMultiplier")
buildInput("startAngle")
buildInput("stride")
buildInput("xShift")
buildInput("yShift")
buildInput("tile")

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

//http://bunsen.localdomain:8080/spiral.html?yShift=0.2&tile=1&xShift=0.1&startAngle=-20&stride=4&segments=12&cycleMultiplier=1.8&initialRadius=1.9

  const shape = [numRows, numCols]

  const m = mbox(bbox(width, height, 0, 0), shape)
  color.domain([0, maxSegments]);

  // Declare the x (horizontal position) scale.
  const gridX = d3.scaleBand()
    .domain([...Array(numCols).keys()].map(x=>x+minX))
    .range([m.left, m.right]);

  const scaleX = d3.scaleLinear()
    .domain([minX-.5, maxX+.5])
    .range([m.left, m.right]);

  // Declare the y (vertical position) scale.
  const gridY = d3.scaleBand()
    .domain([...Array(numRows).keys()].map(y=>y+minY))
    .range([m.bottom, m.top]);

  const scaleY = d3.scaleLinear()
    .domain([minY-.5, maxY+.5])
    .range([m.bottom, m.top]);

  function drawGrid() {

  svg.selectAll(".m")
    .data([...Array(numRows*numCols).keys()])
    .join("rect")
    .attr("class", "m")
    .attr("x", (d, i) => gridX((i % numCols)+minX))
    .attr("y", (d, i) => gridY(Math.trunc(i / numCols)+minY))
    .attr("width", gridX.bandwidth())
    .attr("height", gridY.bandwidth())
    .style("stroke", "black")
    .style("fill", "white")

  }
drawGrid()

const draw = (offset=[0,0], instance="0") => {
  const [xOffset, yOffset] = offset;
  const seed = [...Array(selectable.segments*selectable.cycles).keys()]
  const base = Math.pow(selectable.cycleMultiplier,1/selectable.segments)
  const r = (i) => (selectable.initialRadius * Math.pow(base,i))
  const theta = (i) => ((i * 2 * Math.PI / selectable.segments) + (selectable.startAngle/180*Math.PI))
  const xc = ([r,theta]) => r * Math.sin(theta) + Number.parseFloat(selectable.xShift)
  const yc = ([r,theta]) => r * Math.cos(theta) + Number.parseFloat(selectable.yShift)
  const polar = seed.map(i=>[r(i),theta(i)])
  const cartesian = polar.map((i)=>[xc(i)+xOffset,yc(i)+yOffset])
  svg.selectAll(".c")
    .data(cartesian)
    .join("circle")
    .attr("class", "c")
    .attr("cx", ([x,y], i) => scaleX(x))
    .attr("cy", ([x,y], i) => scaleY(y))
    .attr("r", gridY.bandwidth()/4)
    .style("fill", "red")
}
const drawInstance = (offset=[0,0], instance="0") => {
  const [xOffset, yOffset] = offset;
  const seed = [...Array(selectable.segments*selectable.cycles).keys()]
  const base = Math.pow(selectable.cycleMultiplier,1/selectable.segments)
  const r = (i) => (selectable.initialRadius * Math.pow(base,i))
  const theta = (i) => ((i * 2 * Math.PI / selectable.segments) + (selectable.startAngle/180*Math.PI))
  const xc = ([r,theta]) => r * Math.sin(theta) + Number.parseFloat(selectable.xShift)
  const yc = ([r,theta]) => r * Math.cos(theta) + Number.parseFloat(selectable.yShift)
  const polar = seed.map(i=>[r(i),theta(i)])
  const cartesian = polar.map((i)=>[xc(i)+xOffset,yc(i)+yOffset])
  svg.selectAll(".r" + instance)
    .data(cartesian)
    .join("rect")
    .attr("class", "r"+instance)
    .attr("x", ([x,y], i) => gridX(Math.round(x)))
    .attr("y", ([x,y], i) => gridY(Math.round(y)))
    .attr("height", gridY.bandwidth())
    .attr("width", gridX.bandwidth())
    .style("fill", "blue")
    .style("opacity", "40%")
}

const drawTiles = () => {

  const repeats = [...Array(Number.parseInt(selectable.tile)).keys()].map(x=>x-Math.floor(selectable.tile/2))
  console.log(selectable.tile,repeats)
  //var repeats = [-5,-4,-3,-2,-1,0,1,2,3,4,5]
  repeats.forEach((xd,xi)=>{
    repeats.forEach((yd,yi)=>(drawInstance([xd*selectable.stride,yd*selectable.stride],"-"+xi+yi)))
  })
}
drawTiles()
draw()
const redraw = () => {drawTiles();draw()}
