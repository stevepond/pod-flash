import { Digest } from "@pod-flash/shared";
import { useState, useEffect } from "react";

export function DigestComponent() {
  const [digests, setDigests] = useState<Digest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDigests();

    // Set up SSE connection for real-time updates
    const eventSource = new EventSource(
      `${
        import.meta.env.VITE_API_URL || "http://localhost:3000"
      }/api/digests/stream/digests`
    );

    console.log(
      "SSE connection established to:",
      `${
        import.meta.env.VITE_API_URL || "http://localhost:3000"
      }/api/digests/stream/digests`
    );

    eventSource.onopen = () => {
      console.log("SSE connection opened");
    };

    eventSource.onmessage = (event) => {
      console.log("SSE message received:", event.data);
      const updatedDigest = JSON.parse(event.data);
      console.log("Parsed digest update:", updatedDigest);
      setDigests((currentDigests) => {
        const newDigests = currentDigests.map((digest) =>
          digest.id === updatedDigest.id
            ? { ...digest, ...updatedDigest }
            : digest
        );
        console.log("Updated digests state:", newDigests);
        return newDigests;
      });
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchDigests = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/digests`
      );
      if (!response.ok) throw new Error("Failed to fetch digests");
      const data = await response.json();
      setDigests(data);
    } catch (err) {
      setError("Failed to fetch digests");
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000"
        }/api/digests/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Upload failed");
      await fetchDigests();
    } catch (err) {
      setError("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload Podcast</h2>
        <input
          type="file"
          accept=".mp3"
          onChange={handleFileUpload}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        {uploading && <p className="mt-2 text-gray-500">Uploading...</p>}
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Digests</h2>
        <div className="space-y-6">
          {digests.map((digest) => (
            <div key={digest.id} className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-2">{digest.title}</h3>
              {digest.status === "COMPLETE" ? (
                <>
                  {digest.summary ? (
                    <p className="text-gray-700 mb-2">{digest.summary}</p>
                  ) : (
                    <p className="text-gray-500 mb-2">No summary available</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {(digest.keywords ?? []).length > 0 ? (
                      (digest.keywords ?? []).map((keyword) => (
                        <span
                          key={keyword}
                          className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm"
                        >
                          {keyword}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">
                        No keywords available
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <p className="text-gray-500">
                    {digest.status === "PROCESSING" ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing your podcast...
                      </span>
                    ) : (
                      <span className="text-red-500">
                        Error processing podcast
                      </span>
                    )}
                  </p>
                  {digest.summary && (
                    <p className="text-gray-700 mt-2">{digest.summary}</p>
                  )}
                  {(digest.keywords ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(digest.keywords ?? []).map((keyword) => (
                        <span
                          key={keyword}
                          className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
