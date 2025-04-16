

window.addEventListener("DOMContentLoaded", () => {
  const container = d3.select("#voting-map-container");
  if (container) {
    const svg = d3.select("#geo-map");

    const containerWidth = container.node().getBoundingClientRect().width;
    const containerHeight = containerWidth * 0.75;
  
    svg.attr("width", containerWidth).attr("height", containerHeight);
  
    const projection = d3.geoMercator()
      .scale(containerWidth / 6)
      .translate([containerWidth / 6, containerHeight / 1.8]);
  
    const path = d3.geoPath().projection(projection);

    const mapGroup = svg.append("g");
    d3.json("data/map.geo.json")
    .then(geoData => {
      mapGroup.selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("stroke", "#fff");
    })
    .catch(error => console.error("Error loading GeoJSON data:", error));
    const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", (event) => {
      mapGroup.attr("transform", event.transform);
    });

  svg.call(zoom);
  } else {
    console.warn("Couldn't find #voting-map-container");
  }
});

