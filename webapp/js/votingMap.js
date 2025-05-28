let selectedYear = 2023;
let voteType = "total_points";
let svg, path, linkGroup, mapGroup;
let selectedCountry = null;
let countryPointsByYear = {}
let yearTopFive = {}
let projection;
let capitals;


const voteTypeMap = { "total_points" : "Total votes",
                      "tele_points"   : "Telephone votes",
                      "jury_points"   : "Jury votes"
}
 //// Event Listners
// Load d3 when app starts
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
      .translate([containerWidth / 5, containerHeight / 1.5]);

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

    // Run when the app renders
    updateLoadCountryCoordinates();
    updateVotingTypeOptions(selectedYear);
    updateLoadTopFiveYear(selectedYear).then(() => {
      updateInfoDisplay(selectedYear, null, null)
    });

    // need year data before render map
    updatedataBasedOnYear(selectedYear).then(() => {;
      renderMap(selectedYear, projection)});

  }
});
// Load UI components and add event listners to them
document.addEventListener("DOMContentLoaded", () => {
  const infoDisplayTitle = document.querySelector("#info-display h3");

  const yearSelect = document.getElementById("year-select");
  const votingTypeSelect = document.getElementById("votingType-select");

  selectedYear = yearSelect.value;

  infoDisplayTitle.textContent = selectedYear;

  yearSelect.addEventListener("change", (event) => {
    deselectCountry()

    selectedYear = event.target.value;
    infoDisplayTitle.textContent = selectedYear;
    updateVotingTypeOptions(selectedYear);

    voteType = "total_points";
    votingTypeSelect.value = "total_points";
    updateLoadTopFiveYear(selectedYear).then(() => {
      updateInfoDisplay(selectedYear, null, null)});
      // need year data before render map
    updatedataBasedOnYear(selectedYear).then(() => {;
      renderMap(selectedYear, projection)});
  });
  votingTypeSelect.addEventListener("change", (event) => {
    voteType = event.target.value;
    if (selectedCountry != null){
      handleSelectedCountry(selectedCountry, projection, true)
    }
  });
});

//// Functions
// Handle when a country is being pressed
async function handleSelectedCountry(countryName, projection, isChangeVoteType) {
  if (selectedCountry === countryName && !isChangeVoteType) {
    updateInfoDisplay(selectedYear, null, null);
    deselectCountry();
    return;
  }

  selectedCountry = countryName;
  linkGroup.selectAll("line").remove();
  
  // Load capitals data

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

// map Render
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
 // Update the info display
function updateInfoDisplay(year, countryName, pointsGivenToCountries) {
  const infoDisplay = document.getElementById("info-display");
  infoDisplay.innerHTML = "";
  // Eurovison was pause this year
  if (year == 2020){
    const title = document.createElement("h3");
    title.textContent = `No data for year 2020`;
    infoDisplay.appendChild(title);
    return;
  }
  // If no country is selected show top 5 winners for current years
  if (countryName === null && pointsGivenToCountries == null) {
    updateLoadTopFiveYear(selectedYear)

    const title = document.createElement("h3");
    title.textContent = `Top 5 in ${year}:`;
    infoDisplay.appendChild(title);
    // For top 5 data
    const topFiveWithCountry = Object.entries(yearTopFive).map(([country, data]) => ({ country, ...data }));
    topFiveWithCountry.sort((a, b) => a.pos - b.pos);

    topFiveWithCountry.forEach(({ pos, country, song, performer }) => {
      const p = document.createElement("p");
      p.textContent = `${pos}. ${country} - ${song} by ${performer}`;
      p.classList.add("no-hover");
      infoDisplay.appendChild(p);
    });
    const p = document.createElement("p");
    p.textContent = "Click on a country to see who they voted for";
    p.classList.add("info-footer", "no-hover");
    infoDisplay.appendChild(p);
    return;
  }

  // Show the votes that country voted on
  const title = document.createElement("h3");
  title.textContent = `${countryName}'s ${voteTypeMap[voteType]}`;
  infoDisplay.appendChild(title);
  pointsGivenToCountries.forEach(([country, points], counter) => {
    const p = document.createElement("p");

    p.textContent = `${counter + 1}: ${country} ${points[voteType]} points`;
    p.style.cursor = "pointer"; 

    // If we click the country we select that country
    p.addEventListener("click", () => {
      mapGroup.selectAll("path").classed("selected", false);
     mapGroup.selectAll("path")
            .filter(function(d) { return d.properties.name_en === country; })
            .classed("selected", true);
      handleSelectedCountry(country, path.projection(), false); 
    });

    infoDisplay.appendChild(p);
  });
    const p2 = document.createElement("p");
    p2.textContent = 'Only showing top 5 arrows'
    p2.style.cursor = "default";
    p2.classList.add("info-footer", "no-hover");
    infoDisplay.appendChild(p2);
}
// If we the user press the same country agian or changes the year
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

// Update the data 
async function updatedataBasedOnYear(year) {
  countryPointsByYear = await loadCountryYearPoints(year);
}
async function updateLoadTopFiveYear(year) {
  yearTopFive = await loadTopFiveYear(year);
}
const updateLoadCountryCoordinates = async () =>{
  capitals = await loadCountryCoordinates();
} 

// Data fetchers
const loadCountryCoordinates = async () => {
  const response = await fetch("./data/capitals.geojson");
  const countryCoordinates = await response.json();
  return countryCoordinates;
};

const loadCountryYearPoints = async (year) => {
    const response = await fetch('./data/voting_map_data.json');
    const data = await response.json();
    return data[year] || {};
};
const loadTopFiveYear = async (year) => {
    const response = await fetch('./data/top_5_data.json');
    const data = await response.json();
    return data[year] || {};
};


