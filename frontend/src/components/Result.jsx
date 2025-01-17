import React from "react";
import Plotly from "plotly.js-basic-dist";
import "./result.css";

const Result = ({ results, evaluation, onSelectDrug, hasSelection }) => {
  // Function to generate chart data
  const generateChart = (evaluation) => {
    const { drug_name, observed_level, normal_level_mg, toxic_level_mg, lethal_level_mg } = evaluation;

    // Heatmap data for ranges
    const heatmapData = {
      z: [
        [normal_level_mg || 0, normal_level_mg || 0, normal_level_mg || 0],
        [toxic_level_mg || 0, toxic_level_mg || 0, toxic_level_mg || 0],
        [lethal_level_mg || 0, lethal_level_mg || 0, lethal_level_mg || 0],
      ],
      x: ["Normal", "Toxic", "Lethal"], // Categories
      y: ["Range 1", "Range 2", "Range 3"], // Mock ranges for visual separation
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
            <li
              key={index}
              onClick={() => onSelectDrug(drug.drug_name)}
            >
              <strong>{drug.drug_name}</strong>: {drug.drug_metadata}
            </li>
          ))}
        </ul>
      ) : (
        !hasSelection && <p>No results found</p>
      )}

      {evaluation && (
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

          {/* Render the chart */}
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
                  tickvals: [
                    0,
                    evaluation.normal_level_mg,
                    evaluation.toxic_level_mg,
                    evaluation.lethal_level_mg,
                  ].filter(Boolean),
                  ticktext: ["0", "Normal", "Toxic", "Lethal"],
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
      )}
    </div>
  );
};

export default Result;
