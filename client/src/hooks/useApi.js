import { useState, useCallback } from 'react';

const BASE_URL = '/api';

/**
 * Lightweight fetch wrapper with loading/error state management.
 */
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const url = `${BASE_URL}${endpoint}`;
      const config = {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      };

      if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((endpoint) => request(endpoint), [request]);

  const post = useCallback(
    (endpoint, body) => request(endpoint, { method: 'POST', body }),
    [request]
  );

  const del = useCallback(
    (endpoint) => request(endpoint, { method: 'DELETE' }),
    [request]
  );

  return { get, post, del, loading, error, setError };
}
