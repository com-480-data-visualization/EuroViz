let selectedYear = 2023;
let countryPointsByYear;
let svg, path, linkGroup, mapGroup;
let selectedCountry = null;

// Mapping of country codes to country names
const country_dict = {
    "al": "Albania",
    "am": "Armenia",
    "au": "Australia",
    "at": "Austria",
    "az": "Azerbaijan",
    "by": "Belarus",
    "be": "Belgium",
    "ba": "Bosnia & Herzegovina",
    "bg": "Bulgaria",
    "hr": "Croatia",
    "cy": "Cyprus",
    "cz": "Czech Republic",
    "dk": "Denmark",
    "ee": "Estonia",
    "fi": "Finland",
    "fr": "France",
    "ge": "Georgia",
    "de": "Germany",
    "gr": "Greece",
    "hu": "Hungary",
    "is": "Iceland",
    "ie": "Ireland",
    "il": "Israel",
    "it": "Italy",
    "lv": "Latvia",
    "lt": "Lithuania",
    "lu": "Luxembourg",
    "mt": "Malta",
    "md": "Moldova",
    "mc": "Monaco",
    "me": "Montenegro",
    "ma": "Morocco",
    "nl": "Netherlands",
    "mk": "North Macedonia",
    "no": "Norway",
    "pl": "Poland",
    "pt": "Portugal",
    "ro": "Romania",
    "ru": "Russia",
    "sm": "San Marino",
    "rs": "Serbia",
    "cs": "Serbia & Montenegro",
    "sk": "Slovakia",
    "si": "Slovenia",
    "es": "Spain",
    "se": "Sweden",
    "ch": "Switzerland",
    "tr": "Turkey",
    "ua": "Ukraine",
    "gb": "United Kingdom",
    "yu": "Yugoslavia"
}


let countryPointsByYearTotal = {};
let countryPointsByYearTele = {};
let countryPointsByYearJury = {};

// Load the CSV voting data
d3.csv('../pre-processing/votes.csv').then(function(data) {
  data.forEach(d => {
    const year = +d.year;
    const from = country_dict[d.from_country] || d.from_country;
    const to = country_dict[d.to_country] || d.to_country;

    // Load total points
    const totalPoints = +d.total_points || 0;
    if (!countryPointsByYearTotal[year]) countryPointsByYearTotal[year] = {};
    if (!countryPointsByYearTotal[year][from]) countryPointsByYearTotal[year][from] = {};
    countryPointsByYearTotal[year][from][to] = totalPoints;

    // Load tele points
    const telePoints = +d.tele_points || 0;
    if (!countryPointsByYearTele[year]) countryPointsByYearTele[year] = {};
    if (!countryPointsByYearTele[year][from]) countryPointsByYearTele[year][from] = {};
    countryPointsByYearTele[year][from][to] = telePoints;

    // Load jury points
    const juryPoints = +d.jury_points || 0;
    if (!countryPointsByYearJury[year]) countryPointsByYearJury[year] = {};
    if (!countryPointsByYearJury[year][from]) countryPointsByYearJury[year][from] = {};
    countryPointsByYearJury[year][from][to] = juryPoints;
  });

  countryPointsByYear = countryPointsByYearTotal;

  renderMap(selectedYear, path.projection());

// Add years to the year select dropdown
const yearSelect = document.getElementById("year-select");
if (yearSelect) {
  const yearsSet = new Set([
    ...Object.keys(countryPointsByYearTotal),
    ...Object.keys(countryPointsByYearTele),
    ...Object.keys(countryPointsByYearJury)
  ]);
  const years = Array.from(yearsSet).map(Number).sort((a, b) => a - b);
  yearSelect.innerHTML = "";
  years.forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  });
  yearSelect.value = selectedYear;
}

}).catch(function(error) {
  console.error('Error in loading voting data:', error);
});

// Event listener for the votes select dropdown
const votesSelect = document.getElementById("votes-select");
if (votesSelect) {
  votesSelect.addEventListener("change", (event) => {
    if (event.target.value === "countryPointsByYearTotal") {
      countryPointsByYear = countryPointsByYearTotal;
    } else if (event.target.value === "countryPointsByYearTele") {
      countryPointsByYear = countryPointsByYearTele;
    } else if (event.target.value === "countryPointsByYearJury") {
      countryPointsByYear = countryPointsByYearJury;
    }
    renderMap(selectedYear, path.projection());
    updateInfoDisplay(selectedYear, null, null);
  });
}


window.addEventListener("DOMContentLoaded", () => {
  const container = d3.select("#voting-map-container");
  if (!container.empty()) {
    svg = d3.select("#geo-map");

    if (svg.select("defs").empty()) {
      const defs = svg.append("defs");

      defs.append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "2 -3 6 6")
        .attr("refX", 4)
        .attr("refY", 0)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-3L6,0L0,3")
        .style("fill", "black")
        .style("stroke", "none");

      defs.append("pattern")
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

    const projection = d3.geoMercator()
      .scale(containerWidth / 5)
      .translate([containerWidth / 5, containerHeight / 1.7]);

    path = d3.geoPath().projection(projection);

    mapGroup = svg.append("g");
    linkGroup = svg.append("g").attr("id", "line");

    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        mapGroup.attr("transform", event.transform);
        linkGroup.attr("transform", event.transform);
      });

    svg.call(zoom);


    renderMap(selectedYear, projection);

    const yearSelect = document.getElementById("year-select");
    const infoDisplayTitle = document.querySelector("#info-display h3");

    if (yearSelect) {
      yearSelect.value = selectedYear;
      infoDisplayTitle.textContent = selectedYear;
      updateInfoDisplay(selectedYear, null, null);
      yearSelect.addEventListener("change", (event) => {
        selectedYear = parseInt(event.target.value);
        infoDisplayTitle.textContent = selectedYear;
        renderMap(selectedYear, projection);
      });
    }
  }
});


async function handleSelectedCountry(countryName, projection) {

  if (selectedCountry === countryName) {
    updateInfoDisplay(selectedYear, null, null);
    deselectCountry();
    return;
  }
  selectedCountry = countryName;
  linkGroup.selectAll("line").remove();

  // Load capitals data
  const capitals = await loadCountryCoordinates();

  const selectedCapitalCoordinates = await getCaptialCoordinates(capitals, countryName, projection);

  const pointsGivenToCountries = countryPointsByYear[selectedYear]?.[countryName];
  if (!pointsGivenToCountries) {
    console.error("No countries found:" + countryName);
    return;
  }

  // Get votes from from selectedCountry from selectedYear
  const votes = countryPointsByYear[selectedYear][selectedCountry] || {};

  // Take top 5 most voted countries
  const top5 = Object.entries(votes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); 
  
  updateInfoDisplay(selectedYear ,selectedCountry, top5);

  // Draw arrows to top 5 countries
  top5.forEach(([toCountry, points]) => {
    getCaptialCoordinates(capitals, toCountry, projection).then((coords) => {
      if (!coords || !selectedCapitalCoordinates) return;
      linkGroup
        .append("line")
        .attr("x1", selectedCapitalCoordinates[0])
        .attr("y1", selectedCapitalCoordinates[1])
        .attr("x2", coords[0])
        .attr("y2", coords[1])
        .attr("stroke", "black")
        .attr("stroke-width", Math.max(1, points / 6))
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
  title.textContent = `${countryName}'s points:`;
  infoDisplay.appendChild(title);

  const sortedCountries = Object.entries(pointsGivenToCountries)
    .sort(([, pointsA], [, pointsB]) => pointsB - pointsA); 

  sortedCountries.forEach(([country, points], counter) => {
    const p = document.createElement("p");
    p.textContent = `${counter + 1}: ${points} points`;
    p.style.cursor = "pointer"; 

    p.addEventListener("click", () => {
      handleSelectedCountry(country, path.projection()); 
    });
    infoDisplay.appendChild(p);
  });
}

async function deselectCountry() {
  selectedCountry = null;
  linkGroup.selectAll("line").remove();

}

async function getCaptialCoordinates(capitals, country, projection) {
  const countryCapital = capitals[country];
  if (!countryCapital) return null; 
  return projection([countryCapital[0], countryCapital[1]]);
}

const loadCountryCoordinates = async () => {
    const response = await fetch('./data/capitals.json');
    const countryCoordinates = await response.json();
    return countryCoordinates; 
};

function renderMap(year, projection) {
  d3.json("data/map.geo.json")
    .then(geoData => {
      const features = geoData.features;

      mapGroup.selectAll("*").remove();
      // Clear the lines
      linkGroup.selectAll("*").remove();

      selectedCountry = null;

      mapGroup.selectAll("path")
        .data(features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("stroke", "#fff")
        .attr("fill", d => countryPointsByYear[year]?.[d.properties.name_en] ? "lightgray" : "#ccc")
        .classed("unavailable", d => !countryPointsByYear[year]?.[d.properties.name_en])
        .on("click", (event, d) => {
          if (countryPointsByYear[year]?.[d.properties.name_en]) {
            const countryName = d.properties.name_en;
            handleSelectedCountry(countryName, projection);
          }
        });
    })
    .catch(e => console.error("Error loading data", e));
}
