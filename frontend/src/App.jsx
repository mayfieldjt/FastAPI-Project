import React, { useState } from "react";
import Form from "./components/Form";
import Result from "./components/Result";
import { searchDrug, evaluateDrug } from "./api/api";
import "./App.css";

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [observedLevel, setObservedLevel] = useState("");
  const [results, setResults] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [hasSelection, setHasSelection] = useState(false); 

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setResults([]); 
      setHasSelection(false); 
      return; 
    }

    try {
      const data = await searchDrug(searchTerm);
      setResults(data);
      setEvaluation(null); 
      setHasSelection(false); 
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEvaluate = async () => {
    if (!searchTerm.trim()) {
      alert("Please enter a drug name before evaluating."); 
      setEvaluation(null); 
      return; 
    }

    try {
      const data = await evaluateDrug(searchTerm, observedLevel);
      setEvaluation(data);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    setObservedLevel("");
    setResults([]);
    setEvaluation(null);
    setHasSelection(true);
  };

  const handleSelectDrug = (drugName) => {
    setSearchTerm(drugName);
    setResults([]); 
    setHasSelection(true); 
  };

  return (
    <div className="app">
      <h1 className="app-title">Winek's Drug and Chemical Blood-Level Method</h1>
      <Form
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        observedLevel={observedLevel}
        setObservedLevel={setObservedLevel}
        onSearch={handleSearch}
        onEvaluate={handleEvaluate}
      />
      <Result
        results={results}
        evaluation={evaluation}
        onSelectDrug={handleSelectDrug}
        hasSelection={hasSelection} 
      />
      <button onClick={handleReset} className="reset-button">
        Reset
      </button>
    </div>
  );
};

export default App;