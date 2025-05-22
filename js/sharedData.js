function loadPlaceholders(file, Id, callback) {
  fetch(file)
    .then(response => response.text())
    .then(data => {
      document.getElementById(Id).innerHTML = data;
      if (callback) callback();
    })
    .catch(error => console.error(`Error loading ${file}:`, error));
}

loadPlaceholders('header.html', 'header-placeholder', () => {
  const currentPage = window.location.pathname.split('/').pop();
  const activeLink = document.querySelector(`.nav-link[href="${currentPage}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }

});
  loadPlaceholders('footer.html', 'footer-placeholder');

  document.addEventListener("DOMContentLoaded", () => {
    const yearSelect = document.getElementById("year-select");
    const startYear = 2021; 
    const endYear = 2023; 
  
    for (let year = endYear; year >= startYear; year--) {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    }
  });