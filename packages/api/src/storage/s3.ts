// Temporary simplified S3 implementation to avoid AWS SDK import issues
// TODO: Re-implement with proper AWS SDK when build issues are resolved

export async function uploadFile(
  data: Buffer,
  key: string,
  contentType: string
): Promise<void> {
  console.log(`[S3] Simulating upload of ${key} (${data.length} bytes)`);
  // Simulate upload delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  console.log(`[S3] Upload completed for ${key}`);
}

export async function getSignedDownloadUrl(key: string): Promise<string> {
  console.log(`[S3] Generating signed URL for ${key}`);
  // Return a mock signed URL
  return `https://mock-s3.example.com/${key}?signed=true`;
}

export async function deleteFile(key: string): Promise<void> {
  console.log(`[S3] Simulating deletion of ${key}`);
  // Simulate deletion delay
  await new Promise((resolve) => setTimeout(resolve, 50));
  console.log(`[S3] Deletion completed for ${key}`);
}
