import { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function ToolContent() {
  const [tools, setTools] = useState([]);
  const [tool, setTool] = useState("");
  const [projects, setProjects] = useState([]);
  const [project, setProject] = useState("");
  const [steppings, setSteppings] = useState([]);
  const [stepping, setStepping] = useState("");
  const [coverage, setCoverage] = useState(null);
  const [activeTab, setActiveTab] = useState("events");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const barHeight = 50;

  // 🔹 Fetch tools dynamically
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/project/tools/")
      .then((res) => setTools(res.data))
      .catch((err) => console.error("Error fetching tools:", err));
  }, []);

  // 🔹 Fetch projects whenever tool changes
  useEffect(() => {
    if (!tool) return;
    setProject("");
    setStepping("");
    setCoverage(null);

    axios
      .get(`http://127.0.0.1:8000/project/projects/?tool=${tool}`)
      .then((res) => setProjects(res.data))
      .catch((err) => console.error("Error fetching projects:", err));
  }, [tool]);

  // 🔹 Fetch steppings whenever project changes
  useEffect(() => {
    if (!tool || !project) return;
    setStepping("");
    setCoverage(null);

    axios
      .get(
        `http://127.0.0.1:8000/project/steppings/?tool=${tool}&project=${project}`
      )
      .then((res) => setSteppings(res.data))
      .catch((err) => console.error("Error fetching steppings:", err));
  }, [tool, project]);

  // 🔹 Fetch coverage whenever stepping changes
  useEffect(() => {
    if (!tool || !project || !stepping) return;

    axios
      .get(
        `http://127.0.0.1:8000/project/coverage/?tool=${tool}&project=${project}&stepping=${stepping}`
      )
      .then((res) => setCoverage(res.data))
      .catch((err) => console.error("Error fetching coverage:", err));
  }, [tool, project, stepping]);

  const chartHeight = coverage
    ? Math.max(coverage.events.length * barHeight, 150)
    : 150;

  return (
    <div className="p-4">
      {/* 🔹 Dropdowns */}
      <div className="flex space-x-4 mb-6">
        <select
          className="p-2 border rounded w-48"
          value={tool}
          onChange={(e) => setTool(e.target.value)}
        >
          <option value="">-- Select Tool --</option>
          {tools.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {tool && (
          <select
            className="p-2 border rounded w-48"
            value={project}
            onChange={(e) => setProject(e.target.value)}
          >
            <option value="">-- Select Project --</option>
            {projects.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}

        {project && (
          <select
            className="p-2 border rounded w-48"
            value={stepping}
            onChange={(e) => setStepping(e.target.value)}
          >
            <option value="">-- Select Stepping --</option>
            {steppings.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 🔹 Tabs */}
      {coverage && (
        <div>
          <div className="flex border-b mb-4">
            <button
              className={`px-4 py-2 ${
                activeTab === "events"
                  ? "border-b-2 border-blue-600 font-semibold"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab("events")}
            >
              Event Coverage
            </button>
            <button
              className={`px-4 py-2 ${
                activeTab === "testcases"
                  ? "border-b-2 border-blue-600 font-semibold"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab("testcases")}
            >
              Testcase Coverage
            </button>
          </div>

          {/* 🔹 Tab Content */}
          {activeTab === "events" && (
            <div className="w-full bg-white p-4 rounded shadow">
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart
                  data={coverage.events}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 50, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Bar dataKey="count" barSize={30} cursor="pointer">
                    {coverage.events.map((event, index) => (
                      <Cell
                        key={event.id}
                        fill={event.count >= event.threshold ? "green" : "red"}
                        onClick={() =>
                          setSelectedEvent(
                            selectedEvent?.id === event.id ? null : event
                          )
                        }
                      />
                    ))}
                  </Bar>

                  {/* Event Description */}
                  {selectedEvent &&
                    coverage.events.map((event, index) =>
                      selectedEvent.id === event.id ? (
                        <foreignObject
                          key={`desc-${event.id}`}
                          x={50}
                          y={index * barHeight + 30}
                          width={300}
                          height={40}
                        >
                          <div
                            xmlns="http://www.w3.org/1999/xhtml"
                            style={{
                              background: "#f3f4f6",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "12px",
                            }}
                          >
                            {event.description}
                          </div>
                        </foreignObject>
                      ) : null
                    )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeTab === "testcases" && (
            <div className="w-full bg-white p-4 rounded shadow">
              <TestcasePanels testcases={coverage.testcases} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TestcasePanels({ testcases }) {
  const [expanded, setExpanded] = useState(null);

  const togglePanel = (id) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <div className="space-y-3">
      {testcases.map((tc) => (
        <div
          key={tc.id}
          className="border rounded-lg shadow bg-white"
        >
          {/* 🔹 Summary Header */}
          <div
            className="p-4 cursor-pointer flex justify-between items-center bg-gray-50"
            onClick={() => togglePanel(tc.id)}
          >
            <div>
              <p className="font-semibold">{tc.name}</p>
              <p className="text-sm text-gray-500">ID: {tc.id}</p>
            </div>
            <div className="text-sm text-right">
              <p>Status: <span className="font-medium">{tc.latestResult.status}</span></p>
              <p>Platform: {tc.latestResult.platform || "Unknown"}</p>
              <p>Steps Failed: {tc.latestResult.failedSteps || 0}</p>
              <p>Overall: {tc.latestResult.overallResult || "N/A"}</p>
            </div>
          </div>

          {/* 🔹 Expanded Steps */}
          {expanded === tc.id && (
            <div className="p-4 border-t">
              {tc.latestResult.steps?.map((step, idx) => {
                const bg =
                  step.status === "pass"
                    ? "bg-green-500"
                    : step.status === "fail"
                    ? "bg-red-500"
                    : "bg-gray-400";
                return (
                  <div
                    key={idx}
                    className={`h-4 mb-1 ${bg} rounded`}
                    title={`${step.id}: ${step.status}`}
                  />
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
