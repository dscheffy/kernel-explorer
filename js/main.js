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
  const gridMargin = 3;
  const box = {}
  if ((gridHeight + gridMargin) / (gridWidth + gridMargin) > bbox.height / bbox.width) {
    // tall matrix, use bbox height, adjust width
    box.height = bbox.height * (1 - gridMargin / (gridHeight + gridMargin));
    box.width = box.height * gridWidth / gridHeight;
    box.top = bbox.top;
    box.left = bbox.left + (bbox.width - box.width) / 2; // need to fix based on margin
  } else {
    // fat matrix, use bbox width, adjust height
    box.width = bbox.width * (1 - gridMargin / (gridWidth + gridMargin));
    box.height = box.width * gridHeight / gridWidth;
    box.left = bbox.left;
    box.top = bbox.top + (bbox.height - box.height) / 2; // need to take margin into account
  }
  box.bottom = box.top + box.height;
  box.right = box.left + box.width;
  return box;
}


// A number formatter that only shows three significant digits, more gets a bit unruly
const format = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 3 }).format

/**
 * creates a permutator function for mapping an initial index in an array
 * to the index where it would appear if the array was sorted (based on the)
 * order of elements in the originally provided array. This can be used for
 * sorting other arrays of the same length.
 *
 *   const dabc = ["D", "A", "B", "C"];
 *   const permutate = permutator(dabc);
 *   permutate[0]
 *   // 3
 *   permutate[1]
 *   // 0
 */
const permutator = (A) => {
  const p = [...A].map((x, i) => [x, i]).sort((a, b) => a[0] > b[0]).map(([x, i]) => i)
  const p2 = [...p].map((x, i) => [x, i]).sort((a, b) => a[0] > b[0]).map(([x, i]) => i)
  return (x) => p2[x]
}


// Get the window size and fill it with one big svg
const width = window.innerWidth * .95;
const height = window.innerHeight * .95;
const svg = d3.create("svg")
  .attr("width", width)
  .attr("height", height);

// Append the SVG element.
container.append(svg.node());


// create a tooltip
const tooltip = d3.select("#container")
  .append("div")
  .style("opacity", 0)
  .attr("class", "tooltip")
  .style("background-color", "white")
  .style("border", "solid")
  .style("border-width", "2px")
  .style("border-radius", "5px")
  .style("padding", "5px")
  .style("position", "fixed")

const closeButton = tooltip.append("button")
  .html("x")
  .on("click", ()=>tooltip.style("opacity", 0))

const tooltipText = tooltip.append("div")
// Three function that change the tooltip when user hover / move / leave a cell
const mouseover = function (event, d) {
  d3.select(this)
    .style("stroke", "black")
    .style("opacity", 1)
}
const mouseleave = function (event, d) {
  d3.select(this)
    .style("stroke", "none")
}

const color = d3.scaleSequential(d3.interpolateInferno)
const l2color = d3.scaleSequential(d3.interpolateBlues)
//const xAxis = svg.append("g")
//const yAxis = svg.append("g")


// The main functin that draws everything once we have our data
function prepLayer(data, shape) {

  const [dataRows, dataCols] = shape;
  const rowOf = (i) => Math.trunc(i/dataCols);
  const colOf = (i) => i % dataCols;
  var rowNorms = Array(dataRows).fill(0);
  var colNorms = Array(dataCols).fill(0);
  data.forEach((x, i) => {
    const row = rowOf(i);
    const col = colOf(i);
    rowNorms[row] += x * x;
    colNorms[col] += x * x;
  });
  rowNorms = rowNorms.map(x => Math.sqrt(x));
  colNorms = colNorms.map(x => Math.sqrt(x));

const click = function (event, d) {
  const ix = d3.select(this).attr("ix")
  const row = d3.select(this).attr("row")
  const col = d3.select(this).attr("col")
  tooltipText
    .html("value: " + format(d))
  if(col!=null) { 
    tooltipText.append("span").html("<br>column: " + col)
    tooltipText.append("br")
    tooltipText.append("button")
      .html("Sort Columns")
      .on("click", ()=>sortColumns(permutator(colNorms)))
  } else if(row!=null) {
    tooltipText.append("span").html("<br>row: " + row)
    tooltipText.append("br")
    tooltipText.append("button")
      .html("Sort Rows")
      .on("click", ()=>sortRows(permutator(rowNorms)))
  } else if(ix!=null) { 
    const ixcol = colOf(ix)
    const ixrow = rowOf(ix)
    tooltipText.append("span").html("<br>index: " + ix)
    tooltipText.append("span").html("<br>row: " + ixrow)
    tooltipText.append("span").html("<br>column: " + ixcol)
    tooltipText.append("br")
    tooltipText.append("button")
      .html("Sort Rows")
      .on("click", ()=>sortRows(permutator([...Array(dataRows).keys()].map(i=>i*dataCols+ixcol).map(idx=>data[idx]))))
    tooltipText.append("br")
    tooltipText.append("button")
      .html("Sort Columns")
      .on("click", ()=>sortColumns(permutator(data.slice(ixrow*dataCols,(ixrow+1)*dataCols))))
  }
  tooltip
    .style("left", "0px")
    .style("top", "0px")
//    .style("left", (event.x) + 50 + "px")
//    .style("top", (event.y) + 50 + "px")
    .style("position","absolute")
    .style("opacity", 1)
}
  const m = mbox(bbox(width, height, 0, 0), shape)
  color.domain([d3.min(data), d3.max(data)]);

  // Declare the x (horizontal position) scale.
  const x = d3.scaleBand()
    .domain([...Array(dataCols).keys()])
    .range([m.left, m.right]);

  // Declare the y (vertical position) scale.
  const y = d3.scaleBand()
    .domain([...Array(dataRows).keys()])
    .range([m.top, m.bottom]);

  // For now commenting out the axes and opting for a tool tip that
  // shows these details upon request along with the value of any cell
  //  
  // Add the x-axis.
  //xAxis 
  //  .attr("transform", `translate(0,${m.bottom})`)
  //  .call(d3.axisBottom(x).tickSize(0))
  //  .select(".domain").remove();

  // Add the y-axis.
  //yAxis
  //  .attr("transform", `translate(${m.left},0)`)
  //  .call(d3.axisLeft(y).tickSize(0))
  //  .select(".domain").remove();

  // Set the default row and column permutators to basic identity arrays
  var px = permutator([...Array(dataCols).keys()])
  var py = permutator([...Array(dataRows).keys()])
  //const px = permutator(colNorms);
  //const py = permutator(rowNorms);

  function draw() {

  svg.selectAll(".m")
    .data(data)
    .join("rect")
    .attr("class", "m")
    .attr("x", (d, i) => x(i % dataCols))
    .attr("y", (d, i) => y(Math.trunc(i / dataCols)))
    .attr("ix", (d, i) => i)
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .style("fill", (d) => color(d))
    .on("mouseover", mouseover)
    .on("click", click)
    .on("mouseleave", mouseleave)

  l2color.domain([d3.min(rowNorms), d3.max(rowNorms)]);
  svg.selectAll(".r")
    .data(rowNorms)
    .join("rect")
    .attr("class", "r")
    .attr("x", m.right + 2 * x.bandwidth())
    .attr("y", (d, i) => y(i))
    .attr("row", (d, i) => i)
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("fill", (d) => l2color(d))
    .on("mouseover", mouseover)
    .on("click", click)
    .on("mouseleave", mouseleave)

  l2color.domain([d3.min(colNorms), d3.max(colNorms)]);
  svg.selectAll(".c")
    .data(colNorms)
    .join("rect")
    .attr("class", "c")
    .attr("y", m.bottom + 2 * y.bandwidth())
    .attr("x", (d, i) => x(i))
    .attr("col", (d, i) => i)
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("fill", (d) => l2color(d))
    .on("mouseover", mouseover)
    .on("click", click)
    .on("mouseleave", mouseleave)
  }
  draw();
  function sortRows(py) {
    svg.selectAll(".m")
      .transition()   // is there any benefit to this animation?
      .duration(2000)
      .attr("y", (d, i) => y(py(Math.trunc(i / dataCols))))
    svg.selectAll(".r")
      .transition()
      .duration(2000)
      .attr("y", (d, i) => y(py(i)))
  }
  function sortColumns(px) {
    svg.selectAll(".m")
      .transition()
      .duration(2000)
      .attr("x", (d, i) => x(px(i % dataCols)))
    svg.selectAll(".c")
      .transition()
      .duration(2000)
      .attr("x", (d, i) => x(px(i)))
  }
}

// Define a function to handle the selected layer and pass it to the 
// draw function
const drawLayer = function (layer) {

  const shape = layer.kernel.shape
  tf.tidy(() => {
    layer.getWeights()[0].data().then(data => prepLayer(data, shape));
  });
}

// Finally we load the model and draw the kernel
tf.loadLayersModel('models/model.json').then(model => {

  const layerCount = model.layers.length;
  const lastLayer = layerCount - 1

  const layerList = [...Array(layerCount).keys()]
  // get rid of the 0 entry and reverse
  layerList.shift();
  layerList.reverse();
  d3.select("#layer-select")
    .selectAll('option')
    .data(layerList)
    .enter()
    .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    .attr("value", function (d) { return d; }) // corresponding value returned by the button

  d3.select("#layer-select").on("change", function (d) {
    // recover the option that has been chosen
    var selectedLayer = d3.select(this).property("value")
    // run the updateChart function with this selected option
    drawLayer(model.layers[selectedLayer])
  })

  drawLayer(model.layers[lastLayer])


});

