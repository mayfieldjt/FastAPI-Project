import React from "react";
import "./result.css";

const Result = ({ results, evaluation, onSelectDrug, hasSelection }) => {
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
        </div>
      )}
    </div>
  );
};

export default Result;