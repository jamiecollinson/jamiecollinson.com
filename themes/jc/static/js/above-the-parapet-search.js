(function() {
    "use strict";

    var searchRoot = document.querySelector("[data-search-ui]");
    if (!searchRoot) {
        return;
    }

    var searchInput = searchRoot.querySelector("[data-search-input]");
    var clearButton = searchRoot.querySelector("[data-search-clear]");
    var statusNode = searchRoot.querySelector("[data-search-status]");
    var resultsRegion = searchRoot.querySelector("[data-search-results]");
    var resultsList = searchRoot.querySelector("[data-search-results-list]");
    var emptyNode = searchRoot.querySelector("[data-search-empty]");
    var archiveSection = document.querySelector("[data-search-archive]");
    var indexUrl = searchRoot.getAttribute("data-index-url") || "/above-the-parapet/index.json";
    var cacheKey = "parapet-search-index:" + indexUrl;

    if (!searchInput || !clearButton || !statusNode || !resultsRegion || !resultsList || !emptyNode || !archiveSection) {
        return;
    }

    searchRoot.hidden = false;

    var indexEntries = null;
    var indexPromise = null;
    var inputDebounceTimer = null;
    var searchSequence = 0;

    var DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

    var WORD_REGEX = /[a-z0-9]+/gi;
    var DEBOUNCE_MS = 120;
    var SNIPPET_LENGTH = 180;
    var SNIPPET_LEAD_IN = 70;

    function escapeHtml(value) {
        return value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function escapeRegex(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function normalizeWhitespace(value) {
        return value.replace(/\s+/g, " ").trim();
    }

    function normalizeQuery(value) {
        return normalizeWhitespace(value.toLowerCase());
    }

    function tokenize(query) {
        return query.match(WORD_REGEX) || [];
    }

    function tokenizeText(value) {
        return value.toLowerCase().match(WORD_REGEX) || [];
    }

    function formatDate(isoDate) {
        var date = new Date(isoDate);
        if (Number.isNaN(date.getTime())) {
            return "";
        }
        return DATE_FORMATTER.format(date);
    }

    function showArchiveMode() {
        archiveSection.hidden = false;
        resultsRegion.hidden = true;
        emptyNode.hidden = true;
        resultsList.innerHTML = "";
        statusNode.textContent = "";
    }

    function showSearchMode() {
        archiveSection.hidden = true;
        resultsRegion.hidden = false;
    }

    function setLoadingState() {
        showSearchMode();
        emptyNode.hidden = true;
        resultsList.innerHTML = "";
        statusNode.textContent = "Loading archive index...";
    }

    function highlightText(text, terms) {
        if (!terms.length) {
            return escapeHtml(text);
        }

        var escapedTerms = terms
            .filter(function(term) {
                return term.length > 0;
            })
            .sort(function(left, right) {
                return right.length - left.length;
            })
            .map(escapeRegex);

        if (!escapedTerms.length) {
            return escapeHtml(text);
        }

        var matcher = new RegExp("(" + escapedTerms.join("|") + ")", "gi");
        var output = "";
        var cursor = 0;
        var match;

        while ((match = matcher.exec(text)) !== null) {
            var matchStart = match.index;
            var matchEnd = matchStart + match[0].length;

            output += escapeHtml(text.slice(cursor, matchStart));
            output += "<mark>" + escapeHtml(text.slice(matchStart, matchEnd)) + "</mark>";
            cursor = matchEnd;
        }

        output += escapeHtml(text.slice(cursor));
        return output;
    }

    function firstWordPrefixPosition(haystack, term) {
        var regex = new RegExp("\\b" + escapeRegex(term), "i");
        var match = regex.exec(haystack);
        return match ? match.index : -1;
    }

    function snippetAround(content, contentLower, terms, focusTerm) {
        if (!content) {
            return "";
        }

        var position = -1;
        if (focusTerm) {
            position = firstWordPrefixPosition(contentLower, focusTerm);
            if (position < 0) {
                position = contentLower.indexOf(focusTerm);
            }
        }

        if (position < 0) {
            for (var i = 0; i < terms.length; i += 1) {
                position = firstWordPrefixPosition(contentLower, terms[i]);
                if (position >= 0) {
                    break;
                }
                position = contentLower.indexOf(terms[i]);
                if (position >= 0) {
                    break;
                }
            }
        }

        if (position < 0) {
            position = 0;
        }

        var start = Math.max(0, position - SNIPPET_LEAD_IN);
        var end = Math.min(content.length, start + SNIPPET_LENGTH);

        if (start > 0) {
            var prevSpace = content.lastIndexOf(" ", start);
            if (prevSpace >= 0 && start - prevSpace <= 24) {
                start = prevSpace + 1;
            }
        }

        if (end < content.length) {
            var nextSpace = content.indexOf(" ", end);
            if (nextSpace >= 0 && nextSpace - end <= 24) {
                end = nextSpace;
            }
        }

        var snippet = content.slice(start, end).trim();
        if (start > 0) {
            snippet = "..." + snippet;
        }
        if (end < content.length) {
            snippet = snippet + "...";
        }
        return highlightText(snippet, terms);
    }

    function prepareIndex(rawEntries) {
        return rawEntries
            .filter(function(entry) {
                return entry && entry.title && entry.permalink;
            })
            .map(function(entry) {
                var content = normalizeWhitespace(entry.content || "");
                var title = normalizeWhitespace(entry.title || "");
                return {
                    title: title,
                    permalink: entry.permalink,
                    date: entry.date || "",
                    dateValue: Date.parse(entry.date || "") || 0,
                    content: content,
                    titleLower: title.toLowerCase(),
                    contentLower: content.toLowerCase(),
                    titleTokens: tokenizeText(title),
                    contentTokens: tokenizeText(content)
                };
            });
    }

    function loadIndexFromCache() {
        try {
            var cached = sessionStorage.getItem(cacheKey);
            if (!cached) {
                return null;
            }
            return JSON.parse(cached);
        } catch (_error) {
            return null;
        }
    }

    function saveIndexToCache(rawEntries) {
        try {
            sessionStorage.setItem(cacheKey, JSON.stringify(rawEntries));
        } catch (_error) {
            // Ignore quota/storage failures.
        }
    }

    async function ensureIndexLoaded() {
        if (indexEntries) {
            return indexEntries;
        }
        if (indexPromise) {
            return indexPromise;
        }

        indexPromise = (async function() {
            var cachedEntries = loadIndexFromCache();
            if (Array.isArray(cachedEntries)) {
                indexEntries = prepareIndex(cachedEntries);
                return indexEntries;
            }

            var response = await fetch(indexUrl, { credentials: "same-origin" });
            if (!response.ok) {
                throw new Error("Search index request failed with status " + response.status);
            }

            var rawEntries = await response.json();
            if (!Array.isArray(rawEntries)) {
                throw new Error("Search index has an unexpected format");
            }

            saveIndexToCache(rawEntries);
            indexEntries = prepareIndex(rawEntries);
            return indexEntries;
        })();

        return indexPromise;
    }

    function scoreEntry(entry, terms) {
        var score = 0;
        var snippetTerm = "";
        var snippetTermWeight = -1;
        var snippetTermIndex = Number.MAX_SAFE_INTEGER;

        for (var i = 0; i < terms.length; i += 1) {
            var term = terms[i];

            var titlePrefix = entry.titleTokens.some(function(token) {
                return token.startsWith(term);
            });
            var bodyPrefix = entry.contentTokens.some(function(token) {
                return token.startsWith(term);
            });
            var titleContains = entry.titleLower.indexOf(term) >= 0;
            var bodyContains = entry.contentLower.indexOf(term) >= 0;

            if (!titlePrefix && !titleContains && !bodyPrefix && !bodyContains) {
                return null;
            }

            if (titlePrefix) {
                score += 80;
            } else if (titleContains) {
                score += 45;
            }

            if (bodyPrefix) {
                score += 25;
            } else if (bodyContains) {
                score += 10;
            }

            if (bodyPrefix || bodyContains) {
                var weight = bodyPrefix ? 2 : 1;
                var position = bodyPrefix
                    ? firstWordPrefixPosition(entry.contentLower, term)
                    : entry.contentLower.indexOf(term);

                if (position < 0) {
                    position = Number.MAX_SAFE_INTEGER;
                }

                if (weight > snippetTermWeight || (weight === snippetTermWeight && position < snippetTermIndex)) {
                    snippetTerm = term;
                    snippetTermWeight = weight;
                    snippetTermIndex = position;
                }
            }
        }

        if (!snippetTerm) {
            snippetTerm = terms[0] || "";
        }

        return {
            score: score,
            snippetTerm: snippetTerm
        };
    }

    function buildResults(entries, terms) {
        var matches = [];

        for (var i = 0; i < entries.length; i += 1) {
            var entry = entries[i];
            var scored = scoreEntry(entry, terms);
            if (!scored) {
                continue;
            }

            matches.push({
                entry: entry,
                score: scored.score,
                snippetTerm: scored.snippetTerm
            });
        }

        matches.sort(function(left, right) {
            if (right.score !== left.score) {
                return right.score - left.score;
            }
            return right.entry.dateValue - left.entry.dateValue;
        });

        return matches;
    }

    function renderMatches(matches, terms, query) {
        showSearchMode();
        resultsList.innerHTML = "";

        if (!matches.length) {
            emptyNode.hidden = false;
            statusNode.textContent = "No matches for \"" + query + "\".";
            return;
        }

        emptyNode.hidden = true;
        statusNode.textContent = matches.length + " result" + (matches.length === 1 ? "" : "s") + " for \"" + query + "\".";

        for (var i = 0; i < matches.length; i += 1) {
            var match = matches[i];
            var item = document.createElement("li");
            item.className = "parapet-search-results__item";

            var heading = document.createElement("div");
            heading.className = "parapet-search-results__heading";

            var link = document.createElement("a");
            link.href = match.entry.permalink;
            link.textContent = match.entry.title;
            heading.appendChild(link);

            var date = formatDate(match.entry.date);
            if (date) {
                var dateNode = document.createElement("span");
                dateNode.className = "parapet-search-results__date";
                dateNode.textContent = date;
                heading.appendChild(dateNode);
            }

            item.appendChild(heading);

            var snippet = document.createElement("p");
            snippet.className = "parapet-search-results__snippet";
            snippet.innerHTML = snippetAround(
                match.entry.content,
                match.entry.contentLower,
                terms,
                match.snippetTerm
            );
            item.appendChild(snippet);

            resultsList.appendChild(item);
        }
    }

    async function runSearch() {
        searchSequence += 1;
        var sequence = searchSequence;

        var normalizedQuery = normalizeQuery(searchInput.value || "");
        var terms = tokenize(normalizedQuery);
        clearButton.hidden = normalizedQuery.length === 0;

        if (!terms.length) {
            showArchiveMode();
            return;
        }

        setLoadingState();

        try {
            var entries = await ensureIndexLoaded();
            if (sequence !== searchSequence) {
                return;
            }
            var matches = buildResults(entries, terms);
            renderMatches(matches, terms, normalizedQuery);
        } catch (_error) {
            if (sequence !== searchSequence) {
                return;
            }
            showSearchMode();
            emptyNode.hidden = false;
            resultsList.innerHTML = "";
            statusNode.textContent = "Search is temporarily unavailable.";
        }
    }

    function queueSearch() {
        window.clearTimeout(inputDebounceTimer);
        inputDebounceTimer = window.setTimeout(function() {
            runSearch();
        }, DEBOUNCE_MS);
    }

    function primeIndexLoad() {
        if (!indexPromise && !indexEntries) {
            ensureIndexLoaded().catch(function() {
                // Keep UI responsive; errors are handled during explicit searches.
            });
        }
    }

    searchInput.addEventListener("focus", primeIndexLoad, { once: true });
    searchInput.addEventListener("input", function() {
        primeIndexLoad();
        queueSearch();
    });

    clearButton.addEventListener("click", function() {
        searchInput.value = "";
        clearButton.hidden = true;
        searchInput.focus();
        queueSearch();
    });

    showArchiveMode();
})();
