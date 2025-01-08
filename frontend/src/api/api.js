const BASE_URL = process.env.VITE_API_URL;

export const searchDrug = async (query) => {
  const response = await fetch(`${BASE_URL}/Search/?drug=${query}`);
  if (!response.ok) {
    throw new Error("Failed to search drug");
  }
  return response.json();
};

export const evaluateDrug = async (drugName, observedLevel) => {
  const response = await fetch(`${BASE_URL}/Evaluate/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ drug: drugName, observed_level: observedLevel }),
  });
  if (!response.ok) {
    throw new Error("Failed to evaluate drug level");
  }
  return response.json();
};
