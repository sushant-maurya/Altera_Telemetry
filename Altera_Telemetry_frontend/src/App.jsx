import { useState } from "react";
import Header from './components/Header.jsx';
import Overall from './components/Overall.jsx';
import Tool from  './components/Tool.jsx';
import Subscribe  from './components/Subscribe.jsx';
import ToolContent from "./components/ToolContent.jsx";
import Coverage  from "./components/Coverage.jsx";
import CoverageContent from "./components/CoverageContent.jsx"

function App() {
  const [activeContent, setActiveContent] = useState("overall");

  return (
    <div className="h-screen flex flex-col">
      <Header />

      <div className="flex flex-1">
        <div className="w-[10%] bg-blue-900 text-white flex flex-col">
          <Overall setActiveContent={setActiveContent} />
          <Tool setActiveContent={setActiveContent}  />
          <Coverage setActiveContent={setActiveContent}  />
          <Subscribe setActiveContent={setActiveContent}  />
          
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-gray-100 p-8">
          {activeContent === "overall" && (
            <div>
              <h1 className="text-2xl font-bold mb-4">Overall Content is here</h1>
              <p>This is the content shown when you click the Overall Panel.</p>
            </div>
          )}
          {activeContent === "tool" && <ToolContent />
            }
          {activeContent === "subscribe" && (
            <div>
              <h1 className="text-2xl font-bold mb-4">Our subscribe option is here</h1>
              <p>This is the content for another panel item.</p>
            </div>
          )}
          {activeContent === "coverage" && <CoverageContent />
            
          }
        </div>
      </div>
    </div>
  );
}

export default App;
