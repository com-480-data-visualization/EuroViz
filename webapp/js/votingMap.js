console.log("Hello from votingMap.js");

window.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("voting-map-container");
  if (container) {
    const message = document.createElement("p");
    message.textContent = "From votingMap.js!";
    container.appendChild(message);
  } else {
    console.warn("Couldn't find #voting-map-container");
  }
});
