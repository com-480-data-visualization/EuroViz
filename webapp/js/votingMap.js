let selectedYear = 2023;
let voteType = "total_points";
let svg, path, linkGroup, mapGroup;
let selectedCountry = null;
let countryPointsByYear = {}
let projection;
const voteTypeMap = { "total_points" : "Total votes",
                      "tele_points"   : "Telephone votes",
                      "jury_points"   : "Jury votes"
}

window.addEventListener("DOMContentLoaded", () => {
  const container = d3.select("#voting-map-container");
  if (!container.empty()) {
    svg = d3.select("#geo-map");

    if (svg.select("defs").empty()) {
      const defs = svg.append("defs");

      defs
        .append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "2 -3 6 6")
        .attr("refX", 4)
        .attr("refY", 0)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-3L6,0L0,3")
        .style("fill", "black")
        .style("stroke", "none");

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

    projection = d3.geoMercator()
      .scale(containerWidth / 4)
      .translate([containerWidth / 5, containerHeight / 1.7]);

    path = d3.geoPath().projection(projection);

    mapGroup = svg.append("g");
    // for lines
    linkGroup = svg.append("g").attr("id", "line");

    const zoom = d3
      .zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        mapGroup.attr("transform", event.transform);
        linkGroup.attr("transform", event.transform);
      });

    svg.call(zoom);
    updatedataBasedOnYear(selectedYear);
    renderMap(selectedYear, projection);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const infoDisplayTitle = document.querySelector("#info-display h3");

  const yearSelect = document.getElementById("year-select");
  const votingTypeSelect = document.getElementById("votingType-select");

  selectedYear = yearSelect.value;

  infoDisplayTitle.textContent = selectedYear;
  yearSelect.addEventListener("change", (event) => {

    updateInfoDisplay(selectedYear, null, null);
    deselectCountry()

    selectedYear = event.target.value;
    infoDisplayTitle.textContent = selectedYear;
    updateVotingTypeOptions(selectedYear);

    voteType = "total_points";
    votingTypeSelect.value = "total_points";
    updatedataBasedOnYear(selectedYear);
    renderMap(selectedYear, projection);
  });

    votingTypeSelect.addEventListener("change", (event) => {
  
    voteType = event.target.value;
    if (selectedCountry != null){
      handleSelectedCountry(selectedCountry, projection, true)
    }
    
    });

});

const loadCountryYearPoints = async (year) => {
    const response = await fetch('./data/voting_map_data.json');
    const data = await response.json();
    return data[year] || {};
};

async function updatedataBasedOnYear(year) {
  countryPointsByYear = await loadCountryYearPoints(year);
}

async function handleSelectedCountry(countryName, projection, isChangeVoteType) {

  if (selectedCountry === countryName && !isChangeVoteType) {
    updateInfoDisplay(selectedYear, null, null);
    deselectCountry();
    return;
  }
  selectedCountry = countryName;
  linkGroup.selectAll("line").remove();

  // Load capitals data
  const capitals = await loadCountryCoordinates();

  const selectedCapitalCoordinates = await getCaptialCoordinates(
    capitals,
    countryName,
    projection
  );

  const countryVotedFor = countryPointsByYear[countryName];
  if (!countryVotedFor) {
    console.error("No countries found:" + countryName);
    return;
  }
  const top5 = Object.entries(countryVotedFor)
    .sort((a, b) => b[1][voteType] - a[1][voteType]);

  updateInfoDisplay(selectedYear ,selectedCountry, top5);

  top5.slice(0, 5).forEach(([toCountry, points]) => {
    getCaptialCoordinates(capitals, toCountry, projection).then((coords) => {
      if (!coords || !selectedCapitalCoordinates) return;
      linkGroup
        .append("line")
        .attr("x1", selectedCapitalCoordinates[0])
        .attr("y1", selectedCapitalCoordinates[1])
        .attr("x2", coords[0])
        .attr("y2", coords[1])
        .attr("stroke", "black")
        .attr("stroke-width", Math.max(1, points[voteType] / 6))
        .attr("marker-end", "url(#arrow)");
    });
  });
}

function updateInfoDisplay(year, countryName, pointsGivenToCountries) {
  const infoDisplay = document.getElementById("info-display");

  infoDisplay.innerHTML = "";
  if (countryName === null && pointsGivenToCountries == null) {
    //const topFive = topFiveCountriesByYear[year];

    const title = document.createElement("h3");
    title.textContent = `Top 5 in ${year}:`;
    infoDisplay.appendChild(title);
    // For top 5 data
    // topFive.forEach(({ country, position, song, artist }) => {
    //   const p = document.createElement("p");
    //   p.textContent = `${position}. ${country} - ${song} by ${artist}`;
    //   p.classList.add("no-hover");
    //   infoDisplay.appendChild(p);
    // });
    const p = document.createElement("p");
    p.textContent = "Click on a country to see who they voted for";
    p.classList.add("info-footer", "no-hover");
    infoDisplay.appendChild(p);
    return;
  }

  const title = document.createElement("h3");
  title.textContent = `${countryName}'s ${voteTypeMap[voteType]}`;
  infoDisplay.appendChild(title);

  
  pointsGivenToCountries.forEach(([country, points], counter) => {
    const p = document.createElement("p");

    p.textContent = `${counter + 1}: ${country} ${points[voteType]} points`;
    p.style.cursor = "pointer"; 

    p.addEventListener("click", () => {
      handleSelectedCountry(country, path.projection(), false); 
    });
    infoDisplay.appendChild(p);
  });
}


async function deselectCountry() {
  selectedCountry = null;
  linkGroup.selectAll("line").remove();
  mapGroup.selectAll("path").classed("selected", false);
}

async function getCaptialCoordinates(capitals, country, projection) {
  const result = capitals.features.find(
    (obj) => obj.properties.country === country
  );
  const coordinates = result.geometry.coordinates;
  if (!coordinates) return null;
  return projection([coordinates[0], coordinates[1]]);
}

const loadCountryCoordinates = async () => {
  const response = await fetch("./data/capitals.geojson");
  const countryCoordinates = await response.json();
  return countryCoordinates;
};

function renderMap(year, projection) {
  d3.json("data/map.geo.json")
    .then((geoData) => {
      const features = geoData.features;

      mapGroup.selectAll("*").remove();
      linkGroup.selectAll("*").remove();

      selectedCountry = null;

      mapGroup
        .selectAll("path")
        .data(features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("stroke", "#fff")
        .classed("unavailable", d => !countryPointsByYear[d.properties.name_en])
        .on("click", (event, d) => {
        
          if (countryPointsByYear[d.properties.name_en]) {
            mapGroup.selectAll("path").classed("selected", false);
            d3.select(event.currentTarget).classed("selected", true);
            
            const countryName = d.properties.name_en;
            handleSelectedCountry(countryName, projection, false);
          }
        });
    })
    .catch((e) => console.error("Error loading data", e));
}

function updateVotingTypeOptions(selectedYear) {
  const votingTypeSelect = document.getElementById("votingType-select");
  votingTypeSelect.innerHTML = "";
  if (selectedYear > 2015) {
    votingTypeSelect.innerHTML = `
      <option value="total_points">All votes</option>
      <option value="tele_points">Tele votes</option>
      <option value="jury_points">Jury votes</option>
    `;
  } else {
    votingTypeSelect.innerHTML = `<option value="total_points">All votes</option>`;
  }
}
updateVotingTypeOptions(selectedYear);