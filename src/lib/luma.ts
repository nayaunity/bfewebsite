import "server-only";
import { put } from "@vercel/blob";

const LUMA_BASE_URL = "https://agents.lumalabs.ai/v1/generations";

interface LumaGenerationResponse {
  id: string;
  type: string;
  state: "queued" | "processing" | "completed" | "failed";
  model: string;
  created_at: string;
  output: { type: string; url: string }[];
  failure_reason: string | null;
  failure_code: string | null;
}

function getApiKey(): string {
  const key = process.env.LUMA_AGENTS_API_KEY;
  if (!key) throw new Error("LUMA_AGENTS_API_KEY is not set");
  return key;
}

export async function createGeneration(
  prompt: string,
  options?: {
    aspectRatio?: string;
    outputFormat?: "png" | "jpeg";
    style?: "auto" | "manga";
  }
): Promise<LumaGenerationResponse> {
  const body: Record<string, unknown> = {
    prompt,
    model: "uni-1",
    type: "image",
  };
  if (options?.aspectRatio) body.aspect_ratio = options.aspectRatio;
  if (options?.outputFormat) body.output_format = options.outputFormat;
  if (options?.style) body.style = options.style;

  const res = await fetch(LUMA_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("Retry-After") || "10", 10);
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return createGeneration(prompt, options);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(`Luma API ${res.status}: ${err.detail || JSON.stringify(err)}`);
  }

  return res.json();
}

export async function pollUntilDone(
  generationId: string,
  maxWaitMs = 180_000
): Promise<LumaGenerationResponse> {
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    const res = await fetch(`${LUMA_BASE_URL}/${generationId}`, {
      headers: { Authorization: `Bearer ${getApiKey()}` },
    });

    if (!res.ok) {
      throw new Error(`Luma poll ${res.status} for ${generationId}`);
    }

    const gen: LumaGenerationResponse = await res.json();

    if (gen.state === "completed") return gen;

    if (gen.state === "failed") {
      throw new Error(
        `Luma generation failed: ${gen.failure_reason} (${gen.failure_code})`
      );
    }

    await new Promise((r) => setTimeout(r, 3000));
  }

  throw new Error(`Luma generation ${generationId} timed out after ${maxWaitMs}ms`);
}

export async function generateAndUploadToBlob(
  prompt: string,
  blobPath: string,
  options?: {
    aspectRatio?: string;
    outputFormat?: "png" | "jpeg";
  }
): Promise<{ blobUrl: string; lumaJobId: string }> {
  const gen = await createGeneration(prompt, options);
  const completed = await pollUntilDone(gen.id);

  const imageUrl = completed.output[0]?.url;
  if (!imageUrl) throw new Error("Luma completed but no output URL");

  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error(`Failed to download Luma image: ${imageRes.status}`);

  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
  const ext = options?.outputFormat === "jpeg" ? "jpg" : "png";

  const blob = await put(`${blobPath}.${ext}`, imageBuffer, {
    access: "public",
    addRandomSuffix: true,
    contentType: ext === "jpg" ? "image/jpeg" : "image/png",
  });

  return { blobUrl: blob.url, lumaJobId: gen.id };
}

export async function generateMultipleImages(
  prompts: { prompt: string; section: string; aspectRatio?: string }[],
  userId: string
): Promise<{ section: string; blobUrl: string; lumaJobId: string; prompt: string }[]> {
  const results = await Promise.allSettled(
    prompts.map((p) =>
      generateAndUploadToBlob(p.prompt, `portfolio/${userId}/${p.section}`, {
        aspectRatio: p.aspectRatio || "16:9",
        outputFormat: "png",
      }).then((r) => ({ ...r, section: p.section, prompt: p.prompt }))
    )
  );

  return results
    .filter((r): r is PromiseFulfilledResult<{ section: string; blobUrl: string; lumaJobId: string; prompt: string }> => r.status === "fulfilled")
    .map((r) => r.value);
}
