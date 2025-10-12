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

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      alert("Please select a CSV file first.");
      return;
    }

    const uploadData = new FormData();
    uploadData.append("file", csvFile);

    try {
      setUploading(true);
      const response = await axios.post(
        "http://127.0.0.1:8000/coverage/bulk-upload/",
        uploadData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      alert(response.data?.message || "CSV uploaded successfully!");
      setCsvFile(null);
      e.target.reset();
      fetchCoverages();
    } catch (error) {
      console.error("Upload failed:", error);
      if (error.response?.data?.error) {
        alert(`Upload failed: ${error.response.data.error}`);
      } else {
        alert("Upload failed. Please check your CSV and try again.");
      }
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
    } catch (error) {
      console.error("Template download failed:", error);
      alert("Failed to download template file.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}${id}/`);
      fetchCoverages();
    } catch (err) {
      console.error(err);
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
    setError("");
  };

  const getUniqueValues = (key) =>
    Array.from(new Set(coverages.map((c) => c[key]))).map((val) => val.toString());

  const handleFilterToggle = (key) => {
    setDropdownOpen({ ...dropdownOpen, [key]: !dropdownOpen[key] });
  };

  const handleFilterChange = (key, value) => {
    let newFilters = { ...filters };
    if (newFilters[key].includes(value)) {
      newFilters[key] = newFilters[key].filter((v) => v !== value);
    } else {
      newFilters[key].push(value);
    }
    setFilters(newFilters);
  };

  const resetFilters = () => {
    setFilters({
      event_id: [],
      event_name: [],
      event_type: [],
      ip: [],
      threshold: [],
    });
  };

  const filteredCoverages = coverages.filter((c) => {
    const matchesSearch =
      c.event_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ip.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilters =
      (filters.event_id.length === 0 || filters.event_id.includes(c.event_id)) &&
      (filters.event_name.length === 0 || filters.event_name.includes(c.event_name)) &&
      (filters.event_type.length === 0 || filters.event_type.includes(c.event_type)) &&
      (filters.ip.length === 0 || filters.ip.includes(c.ip)) &&
      (filters.threshold.length === 0 || filters.threshold.includes(c.threshold.toString()));

    return matchesSearch && matchesFilters;
  });

  const renderDropdown = (key) => (
    <div className="relative">
      <button
        type="button"
        onClick={() => handleFilterToggle(key)}
        className="w-full border p-1 mt-1 rounded text-left"
      >
        {filters[key].length > 0 ? filters[key].join(", ") : "All"}
      </button>
      {dropdownOpen[key] && (
        <div className="absolute z-10 bg-white border p-2 mt-1 max-h-40 overflow-y-auto w-full shadow-lg">
          {getUniqueValues(key).map((val) => (
            <label key={val} className="block">
              <input
                type="checkbox"
                value={val}
                checked={filters[key].includes(val)}
                onChange={() => handleFilterChange(key, val)}
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
      <h2 className="text-xl font-bold mb-4">Coverage List</h2>

      {/* Search */}
      <input
        type="text"
        placeholder="Search..."
        className="mb-4 p-2 border rounded"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Template Download + CSV Upload */}
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
            className={`p-2 text-white rounded ${uploading ? "bg-gray-400" : "bg-purple-600"}`}
          >
            {uploading ? "Uploading..." : "Upload CSV"}
          </button>
        </form>
      </div>

      <button
        onClick={resetFilters}
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

      {/* Coverage Table */}
      <table className="w-full border-collapse border">
        <thead>
          <tr>
            <th className="border p-2">Event ID {renderDropdown("event_id")}</th>
            <th className="border p-2">Name {renderDropdown("event_name")}</th>
            <th className="border p-2">Type {renderDropdown("event_type")}</th>
            <th className="border p-2">IP {renderDropdown("ip")}</th>
            <th className="border p-2">Threshold {renderDropdown("threshold")}</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCoverages.map((c) => (
            <tr key={c.id}>
              <td className="border p-2">{c.event_id}</td>
              <td className="border p-2">{c.event_name}</td>
              <td className="border p-2">{c.event_type}</td>
              <td className="border p-2">{c.ip}</td>
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
          {filteredCoverages.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center p-2">
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
