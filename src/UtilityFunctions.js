/**
 *
 * @param url
 * @param query
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
 * Attempts to find the given prefix from prefix.cc
 * @param prefix - the prefix to expand
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