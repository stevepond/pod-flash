import { useState } from "react";
import { generateSummary } from "../actions/digest.js";

interface DigestProps {
  digestId: string;
}

interface Summary {
  summary: string;
  keywords: string[];
}

export function DigestComponent({ digestId }: DigestProps) {
  // const [digest, setDigest] = useState<Digest | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // useEffect(() => {
  //   async function loadDigest() {
  //     try {
  //       const data = await getDigest(digestId);
  //       setDigest(data);
  //     } catch (err) {
  //       setError("Failed to load digest");
  //     }
  //   }
  //   loadDigest();
  // }, [digestId]);

  const handleGenerateSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const newSummary = (await generateSummary(
        digestId
      )) as unknown as Summary;
      setSummary(newSummary);
    } catch (err) {
      setError("Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  // if (!digest) {
  //   return <div>Loading...</div>;
  // }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* <h1 className="text-2xl font-bold mb-4">{digest.title}</h1> */}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Summary</h2>
        {summary ? (
          <>
            <p className="text-gray-700">{summary.summary}</p>
            <p className="text-gray-700">{summary.keywords.join(", ")}</p>
          </>
        ) : (
          <button
            onClick={handleGenerateSummary}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Summary"}
          </button>
        )}
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Keywords</h2>
        <div className="flex flex-wrap gap-2">
          {/* {digest.keywords?.map((keyword) => (
            <span
              key={keyword}
              className="bg-gray-100 px-3 py-1 rounded-full text-sm"
            >
              {keyword}
            </span>
          ))} */}
        </div>
      </div>
    </div>
  );
}
