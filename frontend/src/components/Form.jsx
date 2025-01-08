import React from "react";
import "./form.css";

const Form = ({
  searchTerm,
  setSearchTerm,
  observedLevel,
  setObservedLevel,
  onSearch,
  onEvaluate,
}) => {
  const handleKeyPress = (event, action) => {
    if (event.key === "Enter") {
      action();
    }
  };

  return (
    <div className="form">
      <div>
        <input
          type="text"
          placeholder="Search Drug"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => handleKeyPress(e, onSearch)}
        />
        <button onClick={onSearch}>Search</button>
      </div>
      <div>
        <input
          type="number"
          placeholder="Observed Level (mg%)"
          value={observedLevel}
          onChange={(e) => setObservedLevel(e.target.value)}
          onKeyDown={(e) => handleKeyPress(e, onEvaluate)}
        />
        <button onClick={onEvaluate}>Evaluate</button>
      </div>
    </div>
  );
};

export default Form;