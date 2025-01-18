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

    console.log("Normal Level:", normal_level_mg);
    console.log("Toxic Level:", toxic_level_mg);
    console.log("Lethal Level:", lethal_level_mg);

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
      ...lethalRange
      //observed_level
    ].filter((val) => typeof val === "number");

    if (allValues.length === 0) {
      console.log("No valid values for chart");
      return { chartData: [], minValue: 0, maxValue: 100 };
    }

    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);

    console.log("Chart will render with min value:", minValue, "and max value:", maxValue);

    // Heatmap data for ranges
    const heatmapData = {
      z: [
        normalRange.length === 2 ? normalRange : [null, null],
        toxicRange.length === 2 ? toxicRange : [null, null],
        lethalRange.length === 2 ? lethalRange : [null, null],
      ],
      x: ["Normal", "Toxic", "Lethal"],
      y: ["Low", "High"],
      type: "heatmap",
      colorscale: [
        [0.0, "#00FF00"],
        [0.5, "#FFFF00"],
        [1.0, "#FF0000"],
      ],
      showscale: true,
      colorbar: { title: "Level (mg%)" },
    };

    // Line chart for the observed level
    const patientObservation = {
      x: ["Observed"],
      y: [observed_level],
      mode: "markers",
      //line: { color: "blue", width: 2 },
      marker: { size: 12, color: "blue", symbol: "diamond" },
      name: `Observed Level (${observed_level} mg%)`,
    };

    return { chartData: [heatmapData, patientObservation], minValue, maxValue };
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
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", height: "100vh", paddingTop: "0px" }}>
          <div style={{ width: "100%", height: "500px" }}>
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
            <div style={{ width: "80%", height: "400px", justifyContent: "center" }}>
            {(() => {
              const { chartData, minValue, maxValue } = generateChart(evaluation);
              return (
                <Plot
                  data={chartData}
                  layout={{
                    //title: `Evaluation Chart for ${evaluation.drug_name}`,
                    xaxis: {
                      tickangle: -45,
                    },
                    yaxis: {
                      title: "Levels (mg%)",
                      range: [minValue, maxValue],
                    },
                    legend: {
                      orientation: "h",
                      y: -0.2,
                    },
                    hovermode: "closest",
                  }}
                  style={{ width: "100%", height: "100%" }}
                />
              );
            })()}
            </div>
          </div>
        </div>
      ) : (
        evaluation && <p>Invalid evaluation data.</p>
      )}
    </div>
  );
};

export default Result;