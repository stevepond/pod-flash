import { createRoot } from "react-dom/client";
import { DigestComponent } from "./components/Digest.js";
import "./index.css";

const App = () => {
  // For now, we'll use a hardcoded digest ID
  // In a real app, this would come from the URL or props
  const digestId = "test-digest-1";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">Podcast Digest</h1>
        </div>
      </header>
      <main>
        <DigestComponent digestId={digestId} />
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
