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
 * @returns {Promise<Response>}
 */
export async function fetchExpansionOfPrefix(prefix) {
  const response = await fetch('http://prefix.cc/' + prefix + '.file.json', {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  });

  return response.json();
}

export async function fetchPrefixOfExpansion(expansion) {
  const response = await fetch('http://prefix.cc/reverse', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accepts: 'application/json'
    },
    body: new URLSearchParams({expansion})
  });

  return response.json();
}