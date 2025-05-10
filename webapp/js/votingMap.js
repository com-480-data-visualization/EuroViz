const countryPointsByYear = {
  2023: {
    Switzerland: { Germany: 4, France: 3, Italy: 3, Austria: 2 },
    Netherlands: { Belgium: 4, Germany: 3 },
    Germany: { France: 4, Italy: 3, Spain: 2 },
    France: { Germany: 4, "United Kingdom": 3, Spain: 2 },
    Italy: { Germany: 4, France: 3, Spain: 2 },
    Spain: { Italy: 4, France: 3, "United Kingdom": 2 },
    "United Kingdom": { Germany: 5, Italy: 3, France: 2 },
  },
  2022: {
    Israel: { Cyprus: 3, Greece: 2 },
    Greece: { Turkey: 4, Bulgaria: 3, Cyprus: 3 },
    Turkey: { Greece: 4, Bulgaria: 3, Armenia: 2, Georgia: 2 },
    Morocco: { Spain: 3 },
    Cyprus: { Greece: 3, Israel: 3 },
    Iceland: { Norway: 3, Denmark: 2 },
    Croatia: { Slovenia: 4, Hungary: 3, Bosnia: 3 },
    "Bosnia & Herzegovina": { Croatia: 3, Serbia: 3 },
    Slovenia: { Austria: 4, Italy: 2, Croatia: 4 },
    Switzerland: { Belgium: 4, France: 3, Germany: 2 },
    Netherlands: { Belgium: 5, France: 3, Germany: 2 },
    Belgium: { France: 5, Germany: 3, Netherlands: 2 },
    France: { Belgium: 4, Germany: 3, Switzerland: 2 },
    Germany: { France: 4, Belgium: 3, Netherlands: 2 },
  },
  2021: {
    Norway: { Sweden: 4, Denmark: 2, Finland: 2 },
    Yugoslavia: { Serbia: 4, Croatia: 3, Bosnia: 3 },
    Spain: { Portugal: 4, France: 3, Andorra: 2 },
    Finland: { Sweden: 3, Norway: 2, Estonia: 3 },
    Portugal: { Spain: 4 },
    Ireland: { "United Kingdom": 4 },
    Malta: { Italy: 3 },
    Sweden: { Norway: 4, Denmark: 3, Finland: 2 },
    Denmark: { Sweden: 4, Norway: 3, Finland: 2 },
    Iceland: { Denmark: 4, Sweden: 3, Norway: 2 },
  }
};


const topFiveCountriesByYear = {
  2023: [
    { country: "Germany", position: 1 , song : "Song A", artist : "Artist A"},
    { country: "France", position: 2 , song : "Song B", artist : "Artist B"},
    { country: "Italy", position: 3 , song : "Song C", artist : "Artist C"},
    { country: "Spain", position: 4 , song : "Song D", artist : "Artist D"},
    { country: "United Kingdom", position: 5 , song : "Song E", artist : "Artist E"},
  ],
  2022: [
    { country: "Switzerland", position: 1 , song : "Song F", artist : "Artist F"},
    { country: "Netherlands", position: 2 , song : "Song G", artist : "Artist G"},
    { country: "Belgium", position: 3 , song : "Song H", artist : "Artist H"},
    { country: "France", position: 4 , song : "Song I", artist : "Artist I"},
    { country: "Germany", position: 5 , song : "Song J", artist : "Artist J"},
  ],
  2021: [
    { country: "Norway", position: 1 , song : "Song K", artist : "Artist K"},
    { country: "Sweden", position: 2 , song : "Song L", artist : "Artist L"},
    { country: "Denmark", position: 3 , song : "Song M", artist : "Artist M"},
    { country: "Finland", position: 4 , song : "Song N", artist : "Artist N"},
    { country: "Iceland", position: 5 , song : "Song O", artist : "Artist O"},
  ],
};

let selectedYear = 2023;
let svg, path, linkGroup, mapGroup;
let selectedCountry = null;

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
    linkGroup = svg.append("g").attr("id", "relation-lines");

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


async function handleSelectedCountry(countryName, projection, allFeatures) {

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
    console.error("No related countries found for:" + countryName);
    return;
  }

  updateInfoDisplay(selectedYear ,selectedCountry, pointsGivenToCountries);

  Object.keys(pointsGivenToCountries).forEach(relatedName => {

     getCaptialCoordinates(capitals, relatedName, projection).then((coords) => {
      if (!coords) {
        console.error("No coordinates found for:" + relatedName);
        return;
      }      
      linkGroup
      .append("line")
      .attr("x1", selectedCapitalCoordinates[0])
      .attr("y1", selectedCapitalCoordinates[1])
      .attr("x2", coords[0])
      .attr("y2", coords[1])
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("marker-end", "url(#arrow)")
      });
    });

}

function updateInfoDisplay(year, countryName, pointsGivenToCountries) {
  const infoDisplay = document.getElementById("info-display");
  if (!infoDisplay) {
    console.error("Info display element not found.");
    return;
  }
  infoDisplay.innerHTML = "";
  if (countryName === null) {
    const topFive = topFiveCountriesByYear[year];
    
    const title = document.createElement("h3");
    title.textContent = `Top 5 in ${year}:`;
    infoDisplay.appendChild(title);
    topFive.forEach(({ country, position, song, artist }) => {
      const p = document.createElement("p");
      p.textContent = `${position}. ${country} - ${song} by ${artist}`;
      p.classList.add("no-hover"); 
      infoDisplay.appendChild(p);
    });
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

  sortedCountries.forEach(([country, points]) => {
    const p = document.createElement("p");
    p.textContent = `${country}: ${points}`;
    p.style.cursor = "pointer"; 

    p.addEventListener("click", () => {
      handleSelectedCountry(country, path.projection(), []); 
    });


    infoDisplay.appendChild(p);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const yearSelect = document.getElementById("year-select");
  const infoDisplayTitle = document.querySelector("#info-display h3");

  selectedYear = yearSelect.value;
  infoDisplayTitle.textContent = selectedYear; 
  yearSelect.addEventListener("change", (event) => {
    selectedYear = +event.target.value;
    infoDisplayTitle.textContent = selectedYear;
    updateInfoDisplay(selectedYear, null, null); 
    renderMap(selectedYear); 
  });
});

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
  try {
    const response = await fetch('./data/capitals.json');
    const countryCoordinates = await response.json();

    return countryCoordinates; // This will return the parsed object
  } catch (error) {
    console.error('Error loading country coordinates:', error);
  }
};

function renderMap(year, projection) {
  d3.json("data/map.geo.json")
    .then(geoData => {
      const features = geoData.features;

      // Clear previous paths and lines
      mapGroup.selectAll("*").remove();
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
            handleSelectedCountry(countryName, projection, features);
          }
        });
    })
    .catch(error => console.error("Error loading GeoJSON data:", error));
}



