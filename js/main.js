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
  console.log(box, bbox, shape)
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

// Three function that change the tooltip when user hover / move / leave a cell
const mouseover = function (event, d) {
  tooltip
    .style("opacity", 1)
  d3.select(this)
    .style("stroke", "black")
    .style("opacity", 1)
}
const mousemove = function (event, d) {
  const ix = d3.select(this).attr("ix")
  tooltip
    .html("index: " + ix + "<br>value: " + format(d))
    .style("left", (event.x) + 50 + "px")
    .style("top", (event.y) + 50 + "px")
}
const mouseleave = function (event, d) {
  tooltip
    .style("opacity", 0)
  d3.select(this)
    .style("stroke", "none")
}

const color = d3.scaleSequential(d3.interpolateInferno)
const l2color = d3.scaleSequential(d3.interpolateBlues)
//const xAxis = svg.append("g")
//const yAxis = svg.append("g")


// The main functin that draws everything once we have our data
function draw(data, shape) {

  const [dataRows, dataCols] = shape;
  const rowSums = Array(dataRows).fill(0);
  const colSums = Array(dataCols).fill(0);
  data.forEach((x, i) => {
    const row = Math.trunc(i / dataCols);
    const col = i % dataCols;
    rowSums[row] += x * x;
    colSums[col] += x * x;
  });

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

  // For now we're defaulting to sorting by row and column l2 norms
  // but this should be selectable in the future
  const px = permutator(colSums);
  const py = permutator(rowSums);

  svg.selectAll(".m")
    .data(data)
    .join("rect")
    .attr("class", "m")
    .attr("x", (d, i) => x(px(i % dataCols)))
    .attr("y", (d, i) => y(py(Math.trunc(i / dataCols))))
    .attr("ix", (d, i) => i)
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .style("fill", (d) => color(d))
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)

  var l2 = rowSums.map(x => Math.sqrt(x));
  l2color.domain([d3.min(l2), d3.max(l2)]);
  svg.selectAll(".r")
    .data(l2)
    .join("rect")
    .attr("class", "r")
    .attr("x", m.right + 2 * x.bandwidth())
    .attr("y", (d, i) => y(py(i)))
    .attr("ix", (d, i) => i)
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("fill", (d) => l2color(d))
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)

  l2 = colSums.map(x => Math.sqrt(x));
  l2color.domain([d3.min(l2), d3.max(l2)]);
  svg.selectAll(".c")
    .data(l2)
    .join("rect")
    .attr("class", "c")
    .attr("y", m.bottom + 2 * y.bandwidth())
    .attr("x", (d, i) => x(px(i)))
    .attr("ix", (d, i) => i)
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("fill", (d) => l2color(d))
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)

}

const drawLayer = function (layer) {

  const shape = layer.kernel.shape
  tf.tidy(() => {
    layer.getWeights()[0].data().then(data => draw(data, shape));
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

