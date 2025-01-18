import React from "react";
import Plot from "react-plotly.js";
import "./result.css";

const isEvaluationValid = (evaluation) => {
  return (
    evaluation &&
    typeof evaluation.observed_level === "number" &&
    evaluation.drug_name // Ensure the drug name exists
  );
};

const Result = ({ results, evaluation, onSelectDrug, hasSelection, loading }) => {
  const generateChart = (evaluation) => {
    const { drug_name, observed_level, normal_level_mg, toxic_level_mg, lethal_level_mg } = evaluation;

    // Parse string ranges into numbers and handle missing values
    const parseRange = (range) => {
      if (typeof range === "string") {
        const [min, max] = range.split("-").map((val) => parseFloat(val.trim()));
        return [min, max].filter((val) => !isNaN(val));
      }
      return [];
    };

    const normalRange = parseRange(normal_level_mg);
    const toxicRange = parseRange(toxic_level_mg);
    const lethalRange = parseRange(lethal_level_mg);

    const allValues = [
      ...normalRange,
      ...toxicRange,
      ...lethalRange,
      observed_level
    ].filter((val) => typeof val === "number");

    if (allValues.length === 0) {
      return [];
    }

    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);

    // Heatmap data for ranges
    const heatmapData = {
      z: [
        [normalRange[0] || minValue, normalRange[1] || minValue],
        [toxicRange[0] || minValue, toxicRange[1] || minValue],
        [lethalRange[0] || minValue, lethalRange[1] || minValue],
      ],
      x: ["Normal", "Toxic", "Lethal"],
      y: ["Start", "End"],
      type: "heatmap",
      colorscale: "YlOrRd",
      showscale: true,
      colorbar: { title: "Level (mg%)" },
    };

    // Line chart for the observed level
    const patientObservation = {
      x: ["Normal", "Toxic", "Lethal"],
      y: [observed_level, observed_level, observed_level],
      mode: "lines+markers",
      line: { color: "blue", width: 3 },
      marker: { size: 8, color: "blue" },
      name: `${drug_name} Observed`,
    };

    return [heatmapData, patientObservation];
  };

  return (
    <div className="result">
      {results.length > 0 && !hasSelection ? (
        <ul>
          {results.map((drug, index) => (
            <li key={index} onClick={() => onSelectDrug(drug.drug_name)}>
              <strong>{drug.drug_name}</strong>: {drug.drug_metadata}
            </li>
          ))}
        </ul>
      ) : (
        !hasSelection && <p>No results found</p>
      )}

      {loading && <p>Loading evaluation...</p>}

      {evaluation && isEvaluationValid(evaluation) ? (
        <div>
          <h2>Evaluation</h2>
          <p>
            <strong>Drug Name:</strong> {evaluation.drug_name}
          </p>
          <p>
            <strong>Observed Level:</strong> {evaluation.observed_level} mg%
          </p>
          <p>
            <strong>Description:</strong> {evaluation.description}
          </p>

          <div style={{ width: "100%", height: "600px", marginTop: "20px" }}>
            <Plot
              data={generateChart(evaluation)}
              layout={{
                title: `Evaluation Chart for ${evaluation.drug_name}`,
                xaxis: {
                  title: "Levels",
                  tickangle: -45,
                },
                yaxis: {
                  title: "Levels (mg%)",
                  range: [
                    Math.min(...allValues),
                    Math.max(...allValues)
                  ],
                },
                legend: {
                  orientation: "h",
                  y: -0.2,
                },
                hovermode: "closest",
              }}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </div>
      ) : (
        evaluation && <p>Invalid evaluation data.</p>
      )}
    </div>
  );
};

export default Result;