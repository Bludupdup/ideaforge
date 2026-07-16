// frontend/script.js
const form = document.getElementById("predict-form");
const resultDiv = document.getElementById("result");

form.addEventListener("submit", async (e) => {
  e.preventDefault(); // stop normal form submission/page reload

  const features = [
    parseFloat(document.getElementById("f1").value),
    parseFloat(document.getElementById("f2").value),
    parseFloat(document.getElementById("f3").value),
    parseFloat(document.getElementById("f4").value),
  ];

  resultDiv.textContent = "Predicting...";

  try {
    const response = await fetch("http://localhost:8000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features }),
    });

    if (!response.ok) throw new Error("Server error");

    const data = await response.json();
    resultDiv.textContent =
      `Prediction: class ${data.prediction}\nProbabilities: ${data.probabilities.map(p => p.toFixed(2)).join(", ")}`;
  } catch (err) {
    resultDiv.textContent = "Error: could not reach the model API.";
    console.error(err);
  }
});