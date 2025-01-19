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
  
  
  const generateColorScale = (normalRange, toxicRange, lethalRange) => {
    const colorscale = [];
    let currentPosition = 0.0;

    if (normalRange.length > 0) {
      const normalLength = normalRange[1] - normalRange[0];
      //colorscale.push([currentPosition, "#00FF00"]); // Start of Normal
      currentPosition += normalLength;
      colorscale.push([currentPosition, "#00FF00"]); // End of Normal
    }

    if (toxicRange.length > 0) {
      const toxicLength = toxicRange[1] - toxicRange[0];
      //colorscale.push([currentPosition, "#FFFF00"]); // Start of Toxic
      currentPosition += toxicLength;
      colorscale.push([currentPosition, "#FFFF00"]); // End of Toxic
    }

    if (lethalRange.length > 0) {
      const lethalLength = lethalRange[1] - lethalRange[0];
      //colorscale.push([currentPosition, "#FF0000"]); // Start of Lethal
      currentPosition += lethalLength;
      colorscale.push([currentPosition, "#FF0000"]); // End of Lethal
    }

    // Normalize the colorscale values to 0.0-1.0 range
    if (currentPosition > 0) {
      colorscale.forEach((entry) => {
        entry[0] = entry[0] / currentPosition;
      });
    }
    console.log("This will be the colorscale values:", colorscale);
    return colorscale;
  };

  const generateChart = (evaluation) => {
    const { drug_name, observed_level, normal_level_mg, toxic_level_mg, lethal_level_mg } = evaluation;

    console.log("Normal Level:", normal_level_mg);
    console.log("Toxic Level:", toxic_level_mg);
    console.log("Lethal Level:", lethal_level_mg);

    // Parse string ranges into numbers and handle missing values
    const parseRange = (range) => {
      if (!range) {
        return null;
      }

      range = range.trim();

      try {
        if (range.includes("-")) {
          const [start, end] = range.split("-").map((val) => parseFloat(val.trim()));
          return [start, end];
        } else if (range.startsWith(">")) {
          return [parseFloat(range.slice(1).trim()), Infinity];
        } else if (range.startsWith(">=")) {
          return [parseFloat(range.slice(2).trim()), Infinity];
        } else if (range.startsWith("<=")) {
          return [-Infinity, parseFloat(range.slice(2).trim())];
        } else {
          const value = parseFloat(range);
          return [value, value];
        }
      } catch (error) {
        console.error(`Error parsing range: ${range}`, error);
        return null;
      }
    };

    const normalRange = parseRange(normal_level_mg) || [];
    const toxicRange = parseRange(toxic_level_mg) || [];
    const lethalRange = parseRange(lethal_level_mg) || [];

    
    

    const allValues = [
      ...normalRange,
      ...toxicRange,
      ...lethalRange,
    ].filter((val) => typeof val === "number" && !isNaN(val));


       
    if (allValues.length === 0) {
      console.log("No valid values for chart");
      return { chartData: [], minValue: 0, maxValue: 100 };
    }

    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues); 

    
    console.log("Chart will render with min value:", minValue, "and max value:", maxValue);
    
    /// Determine missing range and fill if needed
    const ranges = [normalRange, toxicRange, lethalRange];
    const validRanges = ranges.filter((range) => range.length);

    if (validRanges.length === 2) {
      const missingIndex = ranges.findIndex((range) => !range.length);
      const [lowRange, highRange] = validRanges;
      const inferredRange = [lowRange[1], highRange[0]];

      ranges[missingIndex] = inferredRange;
    }
   
    const colorscale = generateColorScale(normalRange, toxicRange, lethalRange);

    
    const heatmapData = {
      // z: [
      //   [normalRange[0] || null, normalRange[1] || null],
      //   [toxicRange[0] || null, toxicRange[1] || null],
      //   [lethalRange[0] || null, lethalRange[1] || null],
      // ],
      z: ranges.map((range) => (range.length ? range : [null, null])),
      x: [""],
      y: [minValue, maxValue],
      type: "heatmap",
      colorscale: colorscale,
      showscale: true,
      colorbar: { title: "Level (mg%)" },
    };

    // Line chart for the observed level
    const observedMarker = {
      x: [""],
      y: [observed_level],
      mode: "markers",
      //line: { color: "blue", width: 2 },
      marker: { 
        size: 12, 
        color: "black", 
        symbol: "arrow-right",
        opacity: 1,
      },
      name: `Observed Level (${observed_level} mg%)`,
    };

    return { chartData: [observedMarker, heatmapData], minValue, maxValue };
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
                    showlegend: false,
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