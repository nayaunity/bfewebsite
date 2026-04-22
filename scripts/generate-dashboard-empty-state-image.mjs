#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const outputPath = path.resolve("public/images/dashboard-empty-state-generated.png");

const prompt = [
  "Create a premium editorial product illustration for a job-search auto-apply dashboard empty state.",
  "Brand direction: warm cream background, coral-orange accents, dark ink details, ambitious and optimistic tone, no purple.",
  "Composition: landscape 3:2, visually rich on the right side with enough breathing room for UI copy on the left.",
  "Show what users can expect from an auto-apply dashboard: floating job cards, status pills like Matched, Applying, Applied, progress flow from resume plus role preferences to live dashboard activity.",
  "A confident Black woman at a laptop can be included, but the dashboard UI cards should remain the focal point.",
  "Style: polished SaaS editorial illustration, layered depth, soft gradients, subtle motion, not photorealistic, no logos, no tiny unreadable text blocks.",
  "The image must feel trustworthy, high-energy, and product-led, suitable for a first-run empty state in a recruiting dashboard.",
].join(" ");

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("OPENAI_API_KEY is required to generate the dashboard empty-state graphic.");
    process.exit(1);
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-2",
      size: "1536x1024",
      prompt,
    }),
  });

  if (!response.ok) {
    console.error(await response.text());
    process.exit(1);
  }

  const payload = await response.json();
  const imageBase64 = payload?.data?.[0]?.b64_json;

  if (!imageBase64) {
    console.error("OpenAI image response did not include b64_json output.");
    process.exit(1);
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, Buffer.from(imageBase64, "base64"));

  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
