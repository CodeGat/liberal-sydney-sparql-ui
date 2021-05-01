/**
 * submits a query to the given blazegraph instance rooted at a given url
 * @param query {string} - string-based query
 * @returns {Promise<Object>}
 */
export async function submitQuery(query) {
  const url = "http://localhost:9999/blazegraph/sparql"; //todo: "https://lmb.cdhr.anu.edu.au/blazegraph/sparql";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'blaze_lmb:yu%9R92Dps6GWPC+',
      Accept: 'application/sparql-results+json',
      'Access-Control-Allow-Origin': 'https://lmb.cdhr.anu.edu.au'
    },
    body: new URLSearchParams({'query': query})
  });

  return response.json();
}

/**
 * Attempts to expand the given prefix from prefix.zazuko.com
 * @param prefix {string} - the prefix to expand
 * @returns {Promise<any>}
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
 * @param expansion {string} - the expansion to contract
 * @returns {Promise<Response>}
 */
export async function fetchPrefixOfExpansion(expansion) {
  const encodedExpansion = encodeURIComponent(expansion + '#a');
  const response = await fetch('https://prefix.zazuko.com/api/v1/shrink?q=' + encodedExpansion, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accepts: 'application/json'
    }
  });

  return response.json();
}