import React, { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function Indicators() {
  const [ips, setIps] = useState([]);
  const [selectedIp, setSelectedIp] = useState("");
  const [coverageData, setCoverageData] = useState([]);
  const [searchEvent, setSearchEvent] = useState("");
  const [searchedEventData, setSearchedEventData] = useState(null);

  const [loadingDropdown, setLoadingDropdown] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const API_BASE = "http://127.0.0.1:8000";

  // Fetch unique IPs for dropdown
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

  // Fetch coverage for selected IP (dropdown)
  const fetchCoverageData = async (ip) => {
    if (!ip) return;
    setLoadingDropdown(true);
    try {
      const res = await axios.get(`${API_BASE}/coverage/indicator/`, { params: { ip } });
      setCoverageData(res.data);
    } catch (err) {
      console.error("Failed to fetch coverage data:", err);
    } finally {
      setLoadingDropdown(false);
    }
  };

  const handleIpChange = (e) => {
    const ip = e.target.value;
    setSelectedIp(ip);
    fetchCoverageData(ip);
  };

  // Search for specific event and build pie chart
  
	const handleSearch = async () => {
  if (!searchEvent.trim()) {
    setSearchedEventData(null);
    return;
  }

  setLoadingSearch(true);
  try {
    const res = await axios.get(`${API_BASE}/coverage/coverage-event/`);
    const eventData = res.data.find(
      (e) => e.event_id.toLowerCase() === searchEvent.toLowerCase()
    );

    if (eventData) {
      const pieData = [];
      let total_hit = 0;
      let total_threshold = 0;

      const COLORS = ["#4caf50", "#2196f3", "#ff9800", "#9c27b0", "#f44336"];

      eventData.ips.forEach((ipObj, idx) => {
        const hit = ipObj.hit || 0;
        const threshold = ipObj.threshold || 1;

        total_hit += hit;
        total_threshold += threshold;

        // Individual hit slice per IP with different color
        pieData.push({
          name: `${ipObj.ip} Hit`,
          value: hit,
          color: COLORS[idx % COLORS.length], // rotate colors if more IPs
        });
      });

      // Combined remaining slice
      const remaining = total_threshold - total_hit;
      if (remaining > 0) {
        pieData.push({
          name: "Remaining",
          value: remaining,
          color: "#f44336",
        });
      }

      setSearchedEventData({
        event_id: eventData.event_id,
        pieData,
      });
    } else {
      setSearchedEventData(null);
    }
  } catch (err) {
    console.error("Failed to fetch event coverage data:", err);
  } finally {
    setLoadingSearch(false);
  }
};
	  
  const getPartitionColor = (idx, hit) => (idx < hit ? "#4caf50" : "#d3d3d3");

  return (
    <div className="p-4">
      {/* Pie Chart Section */}
      <h2 className="text-xl font-bold mb-4">Coverage Event Covered</h2>
      <div className="mb-6 border p-3 rounded bg-gray-50">
        <h3 className="font-semibold mb-2">Coverage Event Search</h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Enter Event ID..."
            value={searchEvent}
            onChange={(e) => setSearchEvent(e.target.value)}
            className="border p-1 rounded flex-1"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Search
          </button>
        </div>

        {loadingSearch && <div className="mt-3">Loading...</div>}

        {searchedEventData && !loadingSearch && (
		  <div className="mt-4">
			<h4 className="font-semibold mb-2">Event: {searchedEventData.event_id}</h4>
			<PieChart width={350} height={300}>
			  <Pie
				data={searchedEventData.pieData}
				cx="50%"
				cy="50%"
				dataKey="value"
				nameKey="name"
				outerRadius={100}
				// Remove label prop entirely
			  >
				{searchedEventData.pieData.map((entry, index) => (
				  <Cell key={`cell-${index}`} fill={entry.color} />
				))}
			  </Pie>
			  <Tooltip formatter={(value, name) => [`${value}`, name]} />
			  
			</PieChart>
		  </div>
		)}

        {!searchedEventData && searchEvent && !loadingSearch && (
          <div className="mt-3 text-gray-500">
            No matching event found for "{searchEvent}"
          </div>
        )}
      </div>

      {/* Dropdown Section */}
      <h2 className="text-xl font-bold mb-4">Testcase Health Indicators</h2>
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

      {loadingDropdown && <div>Loading coverage data...</div>}

      {!loadingDropdown &&
        coverageData.map((coverage) => (
          <div key={coverage.coverage_id} className="mb-6">
            <h3 className="font-semibold mb-1">{coverage.coverage_id}</h3>
            <div className="flex w-full border" style={{ height: "30px" }}>
              {coverage.events.map((event, idx) => {
                const threshold = event.threshold || 1;
                const hit = event.hit || 0;
                return (
                  <div
                    key={event.event_id}
                    className="flex flex-1"
                    style={{
                      borderRight: idx !== coverage.events.length - 1 ? "2px solid #fff" : "none",
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
            <div className="flex justify-between mt-1 text-sm">
              {coverage.events.map((event) => (
                <span key={event.event_id}>{event.event_id}</span>
              ))}
            </div>
          </div>
        ))}

      {!loadingDropdown && coverageData.length === 0 && selectedIp && (
        <div>No coverage data for this IP.</div>
      )}
    </div>
  );
}
