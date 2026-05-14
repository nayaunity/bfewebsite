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

function inferCompany(headline, lines) {
  if (!headline) return null;
  const atMatch = headline.match(/\bat\s+(.+)$/i);
  if (atMatch) return normalizeWhitespace(atMatch[1]);

  const pipeLine = lines.find((line) => / at /i.test(line));
  if (pipeLine) {
    const match = pipeLine.match(/\bat\s+(.+)$/i);
    if (match) return normalizeWhitespace(match[1]);
  }

  return null;
}

function extractConnections() {
  const anchors = Array.from(document.querySelectorAll('a[href*="/in/"]'));
  const seen = new Set();
  const connections = [];

  for (const anchor of anchors) {
    const profileUrl = normalizeLinkedInUrl(anchor.href);
    if (!profileUrl || seen.has(profileUrl)) continue;

    const card = anchor.closest("li, .entity-result, .mn-connection-card, .discover-person-card, .search-result, .artdeco-card") || anchor.parentElement;
    if (!card) continue;

    const name = normalizeWhitespace(anchor.textContent || anchor.getAttribute("aria-label") || "");
    if (!name || name.length < 3) continue;

    const lines = getTextLines(card);
    const filteredLines = lines.filter((line) => line !== name);
    const headline = filteredLines[0] || null;
    const location = filteredLines.find((line, index) => index > 0 && line.length < 80) || null;
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
