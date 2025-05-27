let selectedYear = 2023;
let voteType = 0;
let svg, path, linkGroup, mapGroup;
let selectedCountry = null;
let countriesNormalizedPoints = {};

//// Event listners
// load when app starts
window.addEventListener("DOMContentLoaded", () => {
  const container = d3.select("#color-map-container");
  if (!container.empty()) {
    svg = d3.select("#geo-cmap");

    if (svg.select("defs").empty()) {
      const defs = svg.append("defs");

      defs
        .append("pattern")
        .attr("id", "diagonalHatch")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", 6)
        .attr("height", 6)
        .append("path")
        .attr("d", "M0,0 l6,6 M-1,1 l2,-2 M5,7 l2,-2")
        .attr("stroke", "#999")
        .attr("stroke-width", 1);
    }
    const containerWidth = container.node().getBoundingClientRect().width;
    const containerHeight = containerWidth * 0.75;

    svg.attr("width", containerWidth).attr("height", containerHeight);

    const projection = d3
      .geoMercator()
      .scale(containerWidth / 4)
      .translate([containerWidth / 5, containerHeight / 1.7]);

    path = d3.geoPath().projection(projection);

    mapGroup = svg.append("g");
    const zoom = d3
      .zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        mapGroup.attr("transform", event.transform);
      });

    svg.call(zoom);
    updateCountriesNormalizedPoints(selectedYear);
    updateVotingTypeOptions(selectedYear);
  }
});
// load containers, and add event listners to them
document.addEventListener("DOMContentLoaded", () => {
  const infoDisplayTitle = document.querySelector("#info-display h3");

  const yearSelect = document.getElementById("year-select");
  const votingTypeSelect = document.getElementById("votingType-select");

  selectedYear = yearSelect.value;

  infoDisplayTitle.textContent = selectedYear;
  yearSelect.addEventListener("change", (event) => {
    selectedYear = +event.target.value;
    infoDisplayTitle.textContent = selectedYear;
    updateVotingTypeOptions(selectedYear);
    voteType = 0;
    votingTypeSelect.value = 0;
    updateCountriesNormalizedPoints(selectedYear);
    updateInfoDisplay(selectedYear)
  });

  votingTypeSelect.addEventListener("change", (event) => {
    voteType = +event.target.value;
    updateCountriesNormalizedPoints(selectedYear);
  });
});

document.addEventListener("click", (e) => {
  if (!e.target.closest("path")) {
    document.getElementById("country-tooltip").style.display = "none";
  }
});

async function handleSelectedCountry(
  countryName,
  countryTotalPoints,
  event
) {
  const tooltip = document.getElementById("country-tooltip");
  tooltip.innerHTML = `<strong>${countryName}</strong><br>Points: ${countryTotalPoints}`;
  tooltip.style.display = "block";
  tooltip.style.left = event.clientX + "px";
  tooltip.style.top = event.clientY + "px";
}

function renderMap(year) {
  d3.json("data/map.geo.json")
    .then((geoData) => {
      const features = geoData.features;

      mapGroup.selectAll("*").remove();
      selectedCountry = null;

      const colorScale = d3
        .scaleLinear()
        .domain([0, 1])
        .range(["powderblue", "midnightblue"]);

      mapGroup
        .selectAll("path")
        .data(features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("stroke-width", 0.5)
        .attr("fill", (d) => {
          const countryData = countriesNormalizedPoints[d.properties.name_en];
          if (countryData) {
            const score = countryData
              ? countryData.normalized[voteType]
              : undefined;
            return score !== undefined ? colorScale(score) : "#ccc";
          }
          return undefined;
        })
        .classed(
          "unavailable",
          (d) => !countriesNormalizedPoints[d.properties.name_en]
        )
        .on("click", (event, d) => {
          if (countriesNormalizedPoints[d.properties.name_en]) {
            const countryName = d.properties.name_en;
            const countryData = countriesNormalizedPoints[d.properties.name_en];

            const countryTotalPoints = countryData
              ? countryData.votes[voteType]
              : undefined;
            handleSelectedCountry(
              countryName,
              countryTotalPoints,
              event
            );
          }
        });
    })
    .catch((error) => console.error("Error loading GeoJSON data:", error));
}


function updateInfoDisplay(year) {
  const infoDisplay = document.getElementById("info-display");
  if (year == 2020){
  const title = document.createElement("h3");
    title.textContent = `No data for year 2020`;
    title.id = "2020";
    infoDisplay.appendChild(title);
    return; 
  }
  const have2020 = document.getElementById("2020");
  if (have2020) have2020.remove();
}

const loadCountryYearPoints = async (year) => {
  const response = await fetch("./data/colorMap.json");
  const data = await response.json();
  return data[year] || {};
};

// load the data and render the map, this is decoupled in voting map
async function updateCountriesNormalizedPoints(year) {
  countriesNormalizedPoints = await loadCountryYearPoints(year);
  renderMap(year);
}

function updateVotingTypeOptions(selectedYear) {
  const votingTypeSelect = document.getElementById("votingType-select");
  votingTypeSelect.innerHTML = "";
  if (selectedYear > 2015) {
    votingTypeSelect.innerHTML = `
      <option value="0">All votes</option>
      <option value="1">Tele votes</option>
      <option value="2">Jury votes</option>
    `;
  } else {
    votingTypeSelect.innerHTML = `<option value="0">All votes</option>`;
  }
}
