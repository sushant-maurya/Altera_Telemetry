import React, { useState } from "react";
import CoverageContent from "./CoverageContent";
import CoverageMapping from "./CoverageMapping";
import Indicators  from "./Indicators";

export default function CoveragePage() {
  const [activeTab, setActiveTab] = useState("list");

  return (
    <div className="p-4">
      {/* Tabs */}
      <div className="flex space-x-4 border-b mb-4">
        <button
          className={`px-4 py-2 ${
            activeTab === "list"
              ? "border-b-2 border-blue-600 font-semibold"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("list")}
        >
          Coverage Event List
        </button>

        <button
          className={`px-4 py-2 ${
            activeTab === "matrix"
              ? "border-b-2 border-blue-600 font-semibold"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("matrix")}
        >
          Coverage Mapping / Matrix
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === "indicator"
              ? "border-b-2 border-blue-600 font-semibold"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("indicator")}
        >
          Indicators
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "list" && <CoverageContent />}
      {activeTab === "matrix" && <CoverageMapping />}
      {activeTab === "indicator" && <Indicators />}
    </div>
  );
}
