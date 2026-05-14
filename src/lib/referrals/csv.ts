import type { LinkedInConnectionInput } from "./core";

export interface LinkedInCsvRow {
  firstName: string;
  lastName: string;
  emailAddress: string | null;
  company: string | null;
  position: string | null;
  connectedOn: string | null;
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function parseRow(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

const EXPECTED_HEADERS = ["first name", "last name", "email address", "company", "position", "connected on"];

export function parseLinkedInConnectionsCsv(raw: string): LinkedInCsvRow[] {
  const lines = stripBom(raw)
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) return [];

  const headers = parseRow(lines[0]!).map((h) => h.toLowerCase());

  const firstNameIdx = headers.indexOf("first name");
  const lastNameIdx = headers.indexOf("last name");
  const emailIdx = headers.indexOf("email address");
  const companyIdx = headers.indexOf("company");
  const positionIdx = headers.indexOf("position");
  const connectedOnIdx = headers.indexOf("connected on");

  if (firstNameIdx === -1 || lastNameIdx === -1) {
    const hasExpected = EXPECTED_HEADERS.every((h) => headers.includes(h));
    if (!hasExpected) {
      throw new Error("CSV does not appear to be a LinkedIn Connections export. Expected columns: First Name, Last Name, Email Address, Company, Position, Connected On.");
    }
  }

  const rows: LinkedInCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseRow(lines[i]!);
    const firstName = (fields[firstNameIdx] || "").trim();
    const lastName = (fields[lastNameIdx] || "").trim();
    if (!firstName && !lastName) continue;

    rows.push({
      firstName,
      lastName,
      emailAddress: emailIdx >= 0 ? fields[emailIdx]?.trim() || null : null,
      company: companyIdx >= 0 ? fields[companyIdx]?.trim() || null : null,
      position: positionIdx >= 0 ? fields[positionIdx]?.trim() || null : null,
      connectedOn: connectedOnIdx >= 0 ? fields[connectedOnIdx]?.trim() || null : null,
    });
  }

  return rows;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function csvRowToConnectionInput(row: LinkedInCsvRow): LinkedInConnectionInput | null {
  const fullName = [row.firstName, row.lastName].filter(Boolean).join(" ").trim();
  if (!fullName) return null;

  const companySlug = row.company ? slugify(row.company) : "unknown";
  const nameSlug = slugify(fullName);
  const profileUrl = `csv://${nameSlug}-at-${companySlug}`;

  return {
    fullName,
    headline: row.position || null,
    currentCompany: row.company || null,
    location: null,
    profileUrl,
    avatarUrl: null,
    linkedinPublicId: null,
  };
}
