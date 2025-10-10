export default function Overall({ setActiveContent }) {
    return  (
      <button
      className="
        p-4 
        text-left 
        border border-blue-700 
        rounded-xl 
        transition 
        duration-300 
        hover:bg-blue-700 
        hover:shadow-lg 
        hover:scale-105
        text-white
        mb-2
      "
      onClick={() => setActiveContent("tool")}
    >
      Tool
    </button>
    );
}