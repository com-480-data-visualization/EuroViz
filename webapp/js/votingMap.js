

window.addEventListener("DOMContentLoaded", () => {
  const container = d3.select("#voting-map-container");
  if (container) {
    const svg = d3.select("#geo-map");
  const containerWidth = container.node().getBoundingClientRect().width;
  const containerHeight = containerWidth * 0.75;


  svg.attr("width", containerWidth).attr("height", containerHeight);
  const projection = d3.geoMercator()
    .scale(containerWidth / 6) 
    .translate([containerWidth / 2, containerHeight / 2]);
  
    const path = d3.geoPath().projection(projection);
    d3.json("data/map.geo.json")
    .then(geoData => {
      svg.selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("stroke", "#fff");
    })
    .catch(error => console.error("Error loading GeoJSON data:", error));

  } else {
    console.warn("Couldn't find #voting-map-container");
  }


});

window.addEventListener("resize", () => {
  const container = d3.select("#voting-map-container");
  const svg = d3.select("#geo-map");

  const containerWidth = container.node().getBoundingClientRect().width;
  const containerHeight = containerWidth * 0.75;

  svg.attr("width", containerWidth).attr("height", containerHeight);
  const projection = d3.geoMercator()
    .scale(containerWidth / 6)
    .translate([containerWidth / 2, containerHeight / 2]);
  const path = d3.geoPath().projection(projection);
  svg.selectAll("path").attr("d", path);
});
