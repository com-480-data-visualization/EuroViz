
window.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("color-map-container");
  if (container) {
    const message = document.createElement("p");
    message.textContent = "FROM colorMap.js";
    container.appendChild(message);
  } else {
    console.warn("Couldn't find #color-map-container");
  }
});
