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
  
  
  const generateColorScale = (ranges, colors) => {
    const colorscale = [];
    let currentPosition = 0.0;
    let maxPosition = 0; 

    const processRange = (range, color, previousEnd) => {
      let rangeLength = 0; 

      if (range.length === 2) {
        const[start, end] = range; 

        if (start > previousEnd) {
          currentPosition += start - previousEnd;
        }
        rangeLength = end - start;
      }
      else if (range.length === 1) {
        rangeLength = range[0];
      }
      else {
        return previousEnd;
      }
      currentPosition += rangeLength; 
      colorscale.push([currentPosition, color]);
      maxPosition = Math.max(maxPosition, currentPosition);

      return currentPosition;
    };

    let previousEnd = 0; 
    ranges.forEach((range, index) => {
      previousEnd = processRange(range, colors[index], previousEnd);
    });

    if (maxPosition === 0) {
        console.log("No valid ranges provided.");
        return []; 
    }

    const normalizedColorscale = colorscale.map(([position, color]) => [
        Math.round((position / maxPosition) * 10) / 10,
        color,
    ]);
    
    return normalizedColorscale;
  };


  const generateChart = (evaluation) => {
    const { drug_name, observed_level, normal_level_mg, toxic_level_mg, lethal_level_mg } = evaluation;

    

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
        } 
        else if (range.startsWith(">")) {
          return [parseFloat(range.slice(1).trim()), Infinity];
        }  
        else if (range.startsWith("<")) {
          return [-Infinity, parseFloat(range.slice(2).trim())];
        } 
        else {
          const value = parseFloat(range);
          if (isNaN(value)) {
              throw new Error(`Invalid number: ${range}`);
          }
          return [value];
        }
      } 
      catch (error) {
        console.error(`Error parsing range: ${range}`, error);
        return null;
      }
    };

    const normalRange = parseRange(normal_level_mg) || [];
    const toxicRange = parseRange(toxic_level_mg) || [];
    const lethalRange = parseRange(lethal_level_mg) || [];
    const ranges = [normalRange, toxicRange, lethalRange];



    console.log("Normal Level String:", normal_level_mg);
    console.log("Toxic Level String:", toxic_level_mg);
    console.log("Lethal Level String:", lethal_level_mg);
    console.log("Ranges in Float:", ranges);

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
    console.log("minValue:", minValue, "maxValue:", maxValue);

    
    
    
    const colors = ["green", "yellow", "red"];
    
    const validRanges = ranges.filter((range) => range.length);

    if (validRanges.length === 2) {
      const missingIndex = ranges.findIndex((range) => !range.length);
      const [lowRange, highRange] = validRanges;
      const inferredRange = [lowRange[1], highRange[0]];

      ranges[missingIndex] = inferredRange;
    }
   
    const colorscale = generateColorScale(ranges, colors);
    console.log("colorscale values: ", colorscale);
    const heatmapData = {
      z: [
        [normalRange[0] || null, normalRange[1] || null],
        [toxicRange[0] || null, toxicRange[1] || null],
        [lethalRange[0] || null, lethalRange[1] || null],
      ],
      x: ["normal", "toxic", "lethal"],
      y: [minValue, maxValue],
      type: "heatmap",
      colorscale: colorscale,
      showscale: true,
      colorbar: { title: "Level (mg%)" },
    };

    // Line chart for the observed level
    const observedMarker = {
      x: ["Observed"],
      y: [observed_level],
      mode: "markers",
      //line: { color: "blue", width: 2 },
      marker: { 
        size: 6, 
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