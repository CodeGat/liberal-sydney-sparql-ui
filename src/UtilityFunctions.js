/**
 * submits a query to the given blazegraph instance rooted at a given url
 * @param url {string} - blazegraph triplestore endpoint is located here
 * @param query {string} - string-based query
 * @returns {Promise<Object>}
 */
export async function submitQuery(url, query) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/sparql-results+json',
      'Access-Control-Allow-Origin': '*'
    },
    body: new URLSearchParams({'query': query})
  });

  return response.json();
}

/**
 * Attempts to expand the given prefix from prefix.zazuko.com
 * @param prefix - the prefix to expand
 * @returns {Promise<Response>}
 */
export async function fetchExpansionOfPrefix(prefix) {
  const encodedPrefix = encodeURIComponent(prefix + ":a");
  const response = await fetch('https://prefix.zazuko.com/api/v1/expand?q=' + encodedPrefix, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  });

  return response.json();
}

/**
 * Attempts to contract the given expansion into a prefix from prefix.zazuko.com
 * @param expansion - the expansion to contract
 * @returns {Promise<Response>}
 */
export async function fetchPrefixOfExpansion(expansion) {
  const encodedExpansion = encodeURIComponent(expansion);
  const response = await fetch('https://prefix.zazuko.com/api/v1/shrink?q=' + encodedExpansion, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accepts: 'application/json'
    }
  });

  return response.json();
}