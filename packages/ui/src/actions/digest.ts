export async function generateSummary(digestId: string): Promise<string> {
  try {
    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL || "http://localhost:3000"
      }/api/digests/${digestId}/summary`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed: ${response.statusText}`);
    }

    const { summary } = (await response.json()) as { summary: string };
    return summary;
  } catch (error) {
    console.error("Failed to generate summary:", error);
    throw new Error("Failed to generate summary");
  }
}

// export async function getDigest(digestId: string): Promise<Digest> {
//   try {
//     const response = await fetch(

//       `${
//         import.meta.env.VITE_API_URL || "http://localhost:3000"
//       }/api/digests/${digestId}`,
//       {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     if (response.status === 404) {
//       // Digest not found, create it
//       const createResp = await fetch(
//         `${
//           import.meta.env.VITE_API_URL || "http://localhost:3000"
//         }/api/digests`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ digestId }),
//         }
//       );

//       if (!createResp.ok) {
//         throw new Error(`Failed to create digest: ${createResp.statusText}`);
//       }

//       return await createResp.json();
//     }

//     if (!response.ok) {
//       throw new Error(`Failed to fetch digest: ${response.statusText}`);
//     }

//     return await response.json();
//   } catch (error) {
//     console.error("Failed to fetch digest:", error);
//     throw new Error("Failed to fetch digest");
//   }
// }
