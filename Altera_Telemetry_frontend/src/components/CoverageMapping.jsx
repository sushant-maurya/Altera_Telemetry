import React, { useEffect, useState } from "react";
import axios from "axios";

export default function CoverageMapping() {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ips, setIps] = useState([]);
  const [selectedIp, setSelectedIp] = useState("");
  const [newIp, setNewIp] = useState("");
  const [addingNewIp, setAddingNewIp] = useState(false);
  const [sheetName, setSheetName] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const COVERAGE_API = "http://127.0.0.1:8000/coverage/";
  const MAPPING_API = "http://127.0.0.1:8000/coverage/coverage-mapping/";
  const UPLOAD_API = "http://127.0.0.1:8000/coverage/coverage-mapping/bulk-upload/"; // Your backend upload endpoint

  // Fetch all IPs from Coverage model
  useEffect(() => {
    const fetchIps = async () => {
      try {
        const res = await axios.get(COVERAGE_API);
        const uniqueIps = Array.from(new Set(res.data.map((c) => c.ip)));
        setIps(uniqueIps);
      } catch (err) {
        console.error("Failed to fetch IPs:", err);
      }
    };
    fetchIps();
  }, []);

  // Fetch mappings whenever selectedIp changes
  useEffect(() => {
    const fetchMappings = async () => {
      if (!selectedIp) {
        setMappings([]);
        return;
      }
      try {
        setLoading(true);
        const res = await axios.get(`${MAPPING_API}?ip=${selectedIp}`);
        setMappings(res.data);
      } catch (err) {
        console.error("Failed to fetch mappings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMappings();
  }, [selectedIp]);

  // Add new IP to the list
  const handleAddNewIp = () => {
    if (!newIp.trim()) return alert("Please enter a valid IP.");
    if (!ips.includes(newIp)) {
      setIps((prev) => [...prev, newIp]);
    }
    setSelectedIp(newIp);
    setAddingNewIp(false);
    setNewIp("");
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedIp) return alert("Select or add an IP first.");
    if (!sheetName.trim()) return alert("Sheet name is mandatory.");
    if (!file) return alert("Please select an Excel file.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sheet_name", sheetName);
    formData.append("ip", selectedIp);

    try {
      setUploading(true);
      const res = await axios.post(UPLOAD_API, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(res.data?.message || "File uploaded successfully!");
      setFile(null);
      setSheetName("");
      // Refresh mapping table after upload
      const updatedMappings = await axios.get(`${MAPPING_API}?ip=${selectedIp}`);
      setMappings(updatedMappings.data);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Check your sheet or try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Coverage Mapping / Matrix</h2>

      {/* IP Dropdown */}
      <div className="mb-4 flex items-center space-x-2">
        <label className="font-semibold">Select IP:</label>
        <select
          value={selectedIp}
          onChange={(e) => setSelectedIp(e.target.value)}
          className="border p-1 rounded"
        >
          <option value="">-- Select IP --</option>
          {ips.map((ip) => (
            <option key={ip} value={ip}>
              {ip}
            </option>
          ))}
        </select>
        <button
          className="p-1 bg-gray-500 text-white rounded"
          onClick={() => setAddingNewIp(true)}
        >
          Add new IP
        </button>
        {selectedIp && (
          <button
            className="p-1 bg-red-500 text-white rounded"
            onClick={() => setSelectedIp("")}
          >
            Reset
          </button>
        )}
      </div>

      {/* Add new IP input */}
      {addingNewIp && (
        <div className="mb-4 flex items-center space-x-2">
          <input
            type="text"
            placeholder="Enter new IP"
            value={newIp}
            onChange={(e) => setNewIp(e.target.value)}
            className="border p-1 rounded"
          />
          <button
            className="p-1 bg-green-500 text-white rounded"
            onClick={handleAddNewIp}
          >
            Add IP
          </button>
          <button
            className="p-1 bg-gray-400 text-white rounded"
            onClick={() => {
              setAddingNewIp(false);
              setNewIp("");
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Upload Section */}
      {selectedIp && (
        <div className="mb-4 flex items-center space-x-2">
          <input
            type="text"
            placeholder="Sheet name"
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
            className="border p-1 rounded"
          />
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0])}
            className="border p-1 rounded"
          />
          <button
            className={`p-2 text-white rounded ${uploading ? "bg-gray-400" : "bg-blue-600"}`}
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      )}

      {/* Mapping Table */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="w-full border-collapse border">
          <thead>
            <tr>
              <th className="border p-2">Coverage ID</th>
              <th className="border p-2">Mapped Events</th>
            </tr>
          </thead>
          <tbody>
            {mappings.length > 0 ? (
              mappings.map((m) => (
                <tr key={`${m.ip}-${m.coverage_id}`}>
                  <td className="border p-2">{m.coverage_id}</td>
                  <td className="border p-2">
                    {m.matched_events?.map((ev, index) => (
                        <span
                        key={index}
                        className={`px-2 py-1 m-1 rounded text-sm font-semibold ${
                            ev.is_matched ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                        }`}
                        >
                        {ev.event}
                        </span>
                    ))}
                    </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="text-center p-2">
                  No mappings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
