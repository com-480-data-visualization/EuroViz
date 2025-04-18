
function loadPlaceholders(file, placeholderId) {
    fetch(file)
      .then(response => response.text())
      .then(data => {
        document.getElementById(placeholderId).innerHTML = data;
      })
      .catch(error => console.error(`Error loading ${file}:`, error));
  }
  
  loadPlaceholders('header.html', 'header-placeholder');
  loadPlaceholders('footer.html', 'footer-placeholder');

  document.addEventListener("DOMContentLoaded", () => {
    const yearSelect = document.getElementById("year-select");
    const startYear = 1957; 
    const endYear = 2023; 
  
    for (let year = endYear; year >= startYear; year--) {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    }
  });