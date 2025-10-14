import React, { useEffect, useState } from "react";
import axios from "axios";

export default function CoverageContent({ setActiveContent }) {
  const [coverages, setCoverages] = useState([]);
  const [formData, setFormData] = useState({
    event_id: "",
    event_name: "",
    event_type: "",
    ip: "",
    threshold: 0,
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [filters, setFilters] = useState({
    event_id: [],
    event_name: [],
    event_type: [],
    ip: [],
    threshold: [],
  });

  const [dropdownOpen, setDropdownOpen] = useState({
    event_id: false,
    event_name: false,
    event_type: false,
    ip: false,
    threshold: false,
  });

  // 🔹 Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const API_URL = "http://127.0.0.1:8000/coverage/";

  useEffect(() => {
    fetchCoverages();
  }, []);

  const fetchCoverages = async () => {
    try {
      const res = await axios.get(API_URL);
      setCoverages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const duplicate = coverages.some(
      (c) =>
        c.event_id.trim().toLowerCase() === formData.event_id.trim().toLowerCase() &&
        c.ip.trim().toLowerCase() === formData.ip.trim().toLowerCase() &&
        c.id !== editingId
    );

    if (duplicate) {
      setError(
        "This Event ID and IP combination already exist. Event ID and IP must be unique"
      );
      return;
    }

    try {
      if (editingId) {
        await axios.put(`${API_URL}${editingId}/`, formData);
      } else {
        await axios.post(API_URL, formData);
      }

      setFormData({
        event_id: "",
        event_name: "",
        event_type: "",
        ip: "",
        threshold: 0,
      });
      setEditingId(null);
      fetchCoverages();
    } catch (err) {
      if (err.response && err.response.data.non_field_errors) {
        setError(err.response.data.non_field_errors[0]);
      } else if (err.response && err.response.data) {
        const messages = Object.values(err.response.data).flat().join(" ");
        setError(messages);
      } else {
        setError("Something went wrong!");
      }
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // ✅ Improved sorting logic for Event ID
  const sortedCoverages = [...coverages].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const { key, direction } = sortConfig;

    if (key === "event_id") {
      // extract numeric part from IDs like E1, E12, EVT3 etc.
      const numA = parseInt(a.event_id.replace(/\D/g, ""), 10);
      const numB = parseInt(b.event_id.replace(/\D/g, ""), 10);

      // Compare numeric part first, fallback to string if not numbers
      if (!isNaN(numA) && !isNaN(numB)) {
        return direction === "asc" ? numA - numB : numB - numA;
      } else {
        return direction === "asc"
          ? a.event_id.localeCompare(b.event_id)
          : b.event_id.localeCompare(a.event_id);
      }
    }

    if (key === "event_count") {
      return direction === "asc"
        ? a.event_count - b.event_count
        : b.event_count - a.event_count;
    }

    // default string or numeric sort
    const aVal = a[key];
    const bVal = b[key];
    if (typeof aVal === "string") {
      return direction === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    } else if (typeof aVal === "number") {
      return direction === "asc" ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });

  // 🔹 Heatmap color
  const getHeatmapColor = (count, threshold) => {
    if (threshold === 0) return "rgb(200,200,200)";
    let ratio = count / threshold;
    if (ratio < 0) ratio = 0;

    if (ratio <= 1) {
      const r = 255;
      const g = Math.round(80 + 175 * ratio);
      const b = 80;
      return `rgb(${r},${g},${b})`;
    }

    const r = Math.round(Math.max(255 - 175 * (ratio - 1), 0));
    const g = 200;
    const b = 80;
    return `rgb(${r},${g},${b})`;
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) return alert("Please select a CSV file first.");
    const uploadData = new FormData();
    uploadData.append("file", csvFile);
    try {
      setUploading(true);
      const response = await axios.post(
        "http://127.0.0.1:8000/coverage/bulk-upload/",
        uploadData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      alert(response.data?.message || "CSV uploaded successfully!");
      setCsvFile(null);
      e.target.reset();
      fetchCoverages();
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please check your CSV.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/coverage/template/",
        { responseType: "blob" }
      );
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", "coverage_template.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert("Failed to download template file.");
    }
  };

  const handleEdit = (coverage) => {
    setEditingId(coverage.id);
    setFormData({
      event_id: coverage.event_id,
      event_name: coverage.event_name,
      event_type: coverage.event_type,
      ip: coverage.ip,
      threshold: coverage.threshold,
    });
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API_URL}${id}/`);
    fetchCoverages();
  };

  const renderDropdown = (key) => (
    <div className="relative">
      <button
        type="button"
        onClick={() =>
          setDropdownOpen({ ...dropdownOpen, [key]: !dropdownOpen[key] })
        }
        className="w-full border p-1 mt-1 rounded text-left"
      >
        {filters[key].length > 0 ? filters[key].join(", ") : "All"}
      </button>
      {dropdownOpen[key] && (
        <div className="absolute z-10 bg-white border p-2 mt-1 max-h-40 overflow-y-auto w-full shadow-lg">
          {Array.from(new Set(coverages.map((c) => c[key]))).map((val) => (
            <label key={val} className="block">
              <input
                type="checkbox"
                checked={filters[key].includes(val)}
                onChange={() => {
                  const newFilter = filters[key].includes(val)
                    ? filters[key].filter((v) => v !== val)
                    : [...filters[key], val];
                  setFilters({ ...filters, [key]: newFilter });
                }}
                className="mr-1"
              />
              {val}
            </label>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4">
      

      {/* Search */}
      <input
        type="text"
        placeholder="Search..."
        className="mb-4 p-2 border rounded"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="flex items-center space-x-4 mb-4">
        <button
          onClick={handleDownloadTemplate}
          className="p-2 bg-green-600 text-white rounded"
        >
          Download Template
        </button>

        <form
          onSubmit={handleFileUpload}
          encType="multipart/form-data"
          className="flex items-center space-x-2"
        >
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files[0])}
            className="border p-1 rounded"
            required
          />
          <button
            type="submit"
            disabled={uploading}
            className={`p-2 text-white rounded ${
              uploading ? "bg-gray-400" : "bg-purple-600"
            }`}
          >
            {uploading ? "Uploading..." : "Upload CSV"}
          </button>
        </form>
      </div>

      <button
        onClick={() =>
          setFilters({
            event_id: [],
            event_name: [],
            event_type: [],
            ip: [],
            threshold: [],
          })
        }
        className="mb-2 p-1 bg-gray-500 text-white rounded"
      >
        Reset Filters
      </button>
       {/* Form */}
      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
        {error && <div className="text-red-500">{error}</div>}
        <input
          type="text"
          name="event_id"
          placeholder="Event ID"
          value={formData.event_id}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="event_name"
          placeholder="Event Name"
          value={formData.event_name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="event_type"
          placeholder="Event Type"
          value={formData.event_type}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="ip"
          placeholder="IP"
          value={formData.ip}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="threshold"
          placeholder="Threshold"
          value={formData.threshold}
          onChange={handleChange}
          required
        />
        <button type="submit" className="p-2 bg-blue-700 text-white rounded">
          {editingId ? "Update" : "Add"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormData({
                event_id: "",
                event_name: "",
                event_type: "",
                ip: "",
                threshold: 0,
              });
              setError("");
            }}
            className="ml-2 p-2 bg-gray-400 text-white rounded"
          >
            Cancel
          </button>
        )}
      </form>
      {/* Table */}
      <table className="w-full border-collapse border">
        <thead>
          <tr>
            <th
              className="border p-2 cursor-pointer"
              onClick={() => handleSort("event_id")}
            >
              Event ID{" "}
              {sortConfig.key === "event_id"
                ? sortConfig.direction === "asc"
                  ? "↑"
                  : "↓"
                : ""}
              {renderDropdown("event_id")}
            </th>
            <th className="border p-2">Name {renderDropdown("event_name")}</th>
            <th className="border p-2">Type {renderDropdown("event_type")}</th>
            <th className="border p-2">IP {renderDropdown("ip")}</th>
            <th
              className="border p-2 cursor-pointer"
              onClick={() => handleSort("event_count")}
            >
              Hit Count{" "}
              {sortConfig.key === "event_count"
                ? sortConfig.direction === "asc"
                  ? "↑"
                  : "↓"
                : ""}
            </th>
            <th className="border p-2">
              Threshold {renderDropdown("threshold")}
            </th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedCoverages.map((c) => (
            <tr key={c.id}>
              <td className="border p-2">{c.event_id}</td>
              <td className="border p-2">{c.event_name}</td>
              <td className="border p-2">{c.event_type}</td>
              <td className="border p-2">{c.ip}</td>
              <td
                className="border p-2 font-semibold text-center"
                style={{
                  backgroundColor: getHeatmapColor(c.event_count, c.threshold),
                  color: "#fff",
                }}
              >
                {c.event_count}
              </td>
              <td className="border p-2">{c.threshold}</td>
              <td className="border p-2 space-x-2">
                <button
                  onClick={() => handleEdit(c)}
                  className="p-1 bg-yellow-500 text-white rounded"
                >
                  Modify
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-1 bg-red-500 text-white rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {sortedCoverages.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center p-2">
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
