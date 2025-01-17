import React from "react";
import Plot from "react-plotly.js";
import "./result.css";

const Result = ({ results, evaluation, onSelectDrug, hasSelection }) => {
  const generateChart = (evaluation) => {
    // Extract evaluation data for the chart
    const { drug_name, observed_level, normal_level_mg, toxic_level_mg, lethal_level_mg } = evaluation;

    // Heatmap Data (Normal, Toxic, Lethal Ranges)
    const heatmapData = {
      z: [
        [normal_level_mg || 0, normal_level_mg || 0, normal_level_mg || 0],
        [toxic_level_mg || 0, toxic_level_mg || 0, toxic_level_mg || 0],
        [lethal_level_mg || 0, lethal_level_mg || 0, lethal_level_mg || 0],
      ],
      x: ['Drug A', 'Drug B', 'Drug C'], // Example drugs, update as needed
      y: ['Normal', 'Toxic', 'Lethal'],
      type: 'heatmap',
      colorscale: 'YlOrRd',
      showscale: true,
      colorbar: { title: 'Level (mg%)' },
    };

    // Patient's Observation Line
    const patientObservation = {
      x: ['Drug A', 'Drug B', 'Drug C'], // Example drugs, align with heatmap
      y: [observed_level, observed_level, observed_level],
      mode: 'lines+markers',
      line: { color: 'blue', width: 3 },
      marker: { size: 8, color: 'blue' },
      name: `${drug_name} Observed`,
    };

    // Chart Layout
    const layout = {
      title: `Evaluation Chart for ${drug_name}`,
      xaxis: {
        title: 'Drugs',
        tickangle: -45,
      },
      yaxis: {
        title: 'Levels (mg%)',
        tickvals: [0, normal_level_mg, toxic_level_mg, lethal_level_mg].filter(Boolean),
        ticktext: ['0', 'Normal', 'Toxic', 'Lethal'],
      },
      legend: {
        orientation: 'h',
        y: -0.2,
      },
      hovermode: 'closest',
    };

    // Combine Heatmap and Line Data
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
          <div className="level-boxes">
            <div>
              <strong>Normal Level:</strong>{" "}
              {evaluation.normal_level_mg
                ? `${evaluation.normal_level_mg} mg%`
                : "None"}
            </div>
            <div>
              <strong>Toxic Level:</strong>{" "}
              {evaluation.toxic_level_mg
                ? `${evaluation.toxic_level_mg} mg%`
                : "None"}
            </div>
            <div>
              <strong>Lethal Level:</strong>{" "}
              {evaluation.lethal_level_mg
                ? `${evaluation.lethal_level_mg} mg%`
                : "None"}
            </div>
          </div>

          {/* Render the Chart */}
          <div style={{ width: "100%", height: "600px", marginTop: "20px" }}>
            <Plot
              data={generateChart(evaluation)}
              layout={{
                title: `Evaluation Chart for ${evaluation.drug_name}`,
                xaxis: {
                  title: 'Drugs',
                  tickangle: -45,
                },
                yaxis: {
                  title: 'Levels (mg%)',
                  tickvals: [
                    0,
                    evaluation.normal_level_mg,
                    evaluation.toxic_level_mg,
                    evaluation.lethal_level_mg,
                  ].filter(Boolean),
                  ticktext: ['0', 'Normal', 'Toxic', 'Lethal'],
                },
                legend: {
                  orientation: 'h',
                  y: -0.2,
                },
                hovermode: 'closest',
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
