function normalizeWhitespace(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function normalizeLinkedInUrl(href) {
  try {
    const url = new URL(href, window.location.origin);
    if (!/linkedin\.com$/i.test(url.hostname) && !/linkedin\.com$/i.test(url.hostname.replace(/^www\./, ""))) {
      return null;
    }
    if (!url.pathname.includes("/in/")) return null;
    return `https://www.linkedin.com${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return null;
  }
}

function getTextLines(node) {
  return normalizeWhitespace(node.innerText || "")
    .split("\n")
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);
}

function cleanHeadline(value, fullName) {
  let cleaned = normalizeWhitespace(value);
  if (!cleaned) return null;

  cleaned = cleaned.replace(/\s+Connected on\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}$/i, "").trim();
  if (!cleaned) return null;

  const normalizedName = normalizeWhitespace(fullName);
  if (normalizedName) {
    if (cleaned.startsWith(normalizedName)) {
      cleaned = normalizeWhitespace(cleaned.slice(normalizedName.length));
    } else {
      const compactName = normalizedName.replace(/\s+/g, "");
      const compactHeadline = cleaned.replace(/\s+/g, "");
      if (compactHeadline.startsWith(compactName)) {
        const suffix = compactHeadline.slice(compactName.length);
        cleaned = normalizeWhitespace(suffix.replace(/([a-z])([A-Z])/g, "$1 $2"));
      }
    }
  }

  return cleaned || null;
}

function inferCompany(headline, lines) {
  const cleanedHeadline = cleanHeadline(headline);
  if (!cleanedHeadline) return null;

  const atSymbolMatch = cleanedHeadline.match(/@\s*([^|,•·]+)$/);
  if (atSymbolMatch) return normalizeWhitespace(atSymbolMatch[1]);

  const atMatch = cleanedHeadline.match(/\bat\s+([^|,•·]+)$/i);
  if (atMatch) return normalizeWhitespace(atMatch[1]);

  const pipeLine = lines.find((line) => / at /i.test(line));
  if (pipeLine) {
    const match = pipeLine.match(/\bat\s+([^|,•·]+)$/i);
    if (match) return normalizeWhitespace(match[1]);
  }

  return null;
}

function firstText(root, selectors) {
  for (const selector of selectors) {
    const node = root.querySelector(selector);
    const text = normalizeWhitespace(node && node.textContent ? node.textContent : "");
    if (text) return text;
  }
  return null;
}

const NAME_SELECTORS = [
  ".mn-connection-card__name",
  ".discover-person-card__name",
  ".entity-result__title-text a span[aria-hidden='true']",
  ".entity-result__title-text span[aria-hidden='true']",
  ".artdeco-entity-lockup__title span[aria-hidden='true']",
  ".artdeco-entity-lockup__title",
  "span[data-anonymize='person-name']",
];

const HEADLINE_SELECTORS = [
  ".mn-connection-card__occupation",
  ".discover-person-card__occupation",
  ".entity-result__primary-subtitle",
  ".artdeco-entity-lockup__subtitle",
];

const LOCATION_SELECTORS = [
  ".mn-connection-card__location",
  ".discover-person-card__location",
  ".entity-result__secondary-subtitle",
  ".artdeco-entity-lockup__caption",
];

function extractConnections() {
  const anchors = Array.from(document.querySelectorAll('a[href*="/in/"]'));
  const seen = new Set();
  const connections = [];

  for (const anchor of anchors) {
    const profileUrl = normalizeLinkedInUrl(anchor.href);
    if (!profileUrl || seen.has(profileUrl)) continue;

    const card = anchor.closest("li, .entity-result, .mn-connection-card, .discover-person-card, .search-result, .artdeco-card") || anchor.parentElement;
    if (!card) continue;

    const lines = getTextLines(card);
    const name = firstText(card, NAME_SELECTORS)
      || normalizeWhitespace(anchor.getAttribute("aria-label") || "")
      || lines[0]
      || normalizeWhitespace(anchor.textContent || "");
    if (!name || name.length < 3) continue;

    const filteredLines = lines
      .map((line) => cleanHeadline(line, name) || line)
      .filter((line) => line && line !== name && !/^Connected on\b/i.test(line));
    const headline = cleanHeadline(firstText(card, HEADLINE_SELECTORS) || filteredLines[0] || null, name);
    const location = firstText(card, LOCATION_SELECTORS)
      || filteredLines.find((line, index) => index > 0 && line.length < 80)
      || null;
    const avatar = card.querySelector("img");

    seen.add(profileUrl);
    connections.push({
      fullName: name,
      headline,
      currentCompany: inferCompany(headline, filteredLines),
      location,
      profileUrl,
      avatarUrl: avatar && avatar.src ? avatar.src : null,
    });
  }

  return connections;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && message.type === "collect-linkedin-connections") {
    sendResponse({ connections: extractConnections() });
  }
});
