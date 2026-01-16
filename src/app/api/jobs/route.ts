import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Build the job object
    const newJob = {
      company: data.company,
      title: data.title,
      location: data.location,
      type: data.job_type,
      remote: data.remote === "Yes",
      salary: data.salary || "",
      posted: "Just now",
      tags: data.tags
        ? data.tags.split(",").map((tag: string) => tag.trim()).filter(Boolean)
        : [],
      href: data.job_url || "",
    };

    // Read the current jobs file
    const jobsFilePath = path.join(process.cwd(), "src/data/jobs.json");
    const fileContents = await fs.readFile(jobsFilePath, "utf-8");
    const jobs = JSON.parse(fileContents);

    // Add new job at the beginning
    jobs.unshift(newJob);

    // Write back to file
    await fs.writeFile(jobsFilePath, JSON.stringify(jobs, null, 2) + "\n");

    return NextResponse.json({ success: true, job: newJob });
  } catch (error) {
    console.error("Error adding job:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add job" },
      { status: 500 }
    );
  }
}
