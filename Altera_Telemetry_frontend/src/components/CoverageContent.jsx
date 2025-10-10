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

  const API_URL = "http://127.0.0.1:8000/coverage/";

  // Fetch coverage data
  const fetchCoverages = async () => {
    try {
      const res = await axios.get(API_URL);
      setCoverages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCoverages();
  }, []);

  // Handle form input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Add or update coverage
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // clear previous error

    // Frontend pre-check for duplicates
    const duplicate = coverages.some(
      (c) =>
        c.event_id.trim().toLowerCase() === formData.event_id.trim().toLowerCase() &&
        c.ip.trim().toLowerCase() === formData.ip.trim().toLowerCase() &&
        c.id !== editingId // ignore the record being edited
    );

    if (duplicate) {
      setError("This event_id + IP combination already exists!");
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
        const messages = Object.values(err.response.data)
          .flat()
          .join(" ");
        setError(messages);
      } else {
        setError("Something went wrong!");
      }
    }
  };

  // Delete coverage
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}${id}/`);
      fetchCoverages();
    } catch (err) {
      console.error(err);
    }
  };

  // Start editing
  const handleEdit = (coverage) => {
    setEditingId(coverage.id);
    setFormData({
      event_id: coverage.event_id,
      event_name: coverage.event_name,
      event_type: coverage.event_type,
      ip: coverage.ip,
      threshold: coverage.threshold,
    });
    setError(""); // clear error when editing
  };

  // Filtered list
  const filteredCoverages = coverages.filter(
    (c) =>
      c.event_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ip.toLowerCase().includes(searchTerm.toLowerCase())
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

      {/* Coverage List */}
      <table className="w-full border-collapse border">
        <thead>
          <tr>
            <th className="border p-2">Event ID</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Type</th>
            <th className="border p-2">IP</th>
            <th className="border p-2">Threshold</th>
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
