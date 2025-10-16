import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Indicators() {
  const [ips, setIps] = useState([]);
  const [selectedIp, setSelectedIp] = useState("");
  const [coverageData, setCoverageData] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = "http://127.0.0.1:8000";

  // Fetch unique IPs
  useEffect(() => {
    const fetchIps = async () => {
      try {
        const res = await axios.get(`${API_BASE}/coverage/unique-ip/`);
        setIps(res.data.ip);
      } catch (err) {
        console.error("Failed to fetch IPs:", err);
      }
    };
    fetchIps();
  }, []);

  // Fetch coverage mapping for selected IP
  const fetchCoverageData = async (ip) => {
    if (!ip) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/coverage/indicator/`, {
        params: { ip },
      });
      setCoverageData(res.data);
    } catch (err) {
      console.error("Failed to fetch coverage data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleIpChange = (e) => {
    const ip = e.target.value;
    setSelectedIp(ip);
    fetchCoverageData(ip);
  };

  // Get color for partition
  const getPartitionColor = (idx, hit) => (idx < hit ? "#4caf50" : "#d3d3d3");

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Testcase Health Indicators</h2>

      {/* IP Dropdown */}
      <div className="mb-4">
        <label className="mr-2 font-semibold">Select IP:</label>
        <select
          value={selectedIp}
          onChange={handleIpChange}
          className="border p-1 rounded"
        >
          <option value="">-- Select IP --</option>
          {ips.map((ip) => (
            <option key={ip} value={ip}>
              {ip}
            </option>
          ))}
        </select>
      </div>

      {loading && <div>Loading coverage data...</div>}

      {!loading &&
        coverageData.map((coverage) => (
          <div key={coverage.coverage_id} className="mb-6">
            <h3 className="font-semibold mb-1">{coverage.coverage_id}</h3>

            {/* Coverage Bar */}
            <div className="flex w-full border" style={{ height: "30px" }}>
              {coverage.events.map((event, idx) => {
                const threshold = event.threshold || 1;
                const hit = event.hit;

                return (
                  <div
                    key={event.event_id}
                    className="flex flex-1"
                    style={{
                      borderRight:
                        idx !== coverage.events.length - 1
                          ? "2px solid #fff"
                          : "none",
                      display: "flex",
                    }}
                  >
                    {Array.from({ length: threshold }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          backgroundColor: getPartitionColor(i, hit),
                        }}
                        title={`${event.event_id} - Hit: ${hit} / Threshold: ${threshold}`}
                      />
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Event labels under bar */}
            <div className="flex justify-between mt-1 text-sm">
              {coverage.events.map((event) => (
                <span key={event.event_id}>{event.event_id}</span>
              ))}
            </div>
          </div>
        ))}

      {!loading && coverageData.length === 0 && selectedIp && (
        <div>No coverage data for this IP.</div>
      )}
    </div>
  );
}
