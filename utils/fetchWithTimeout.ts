/**
 * Fetch with timeout to prevent hanging requests
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param timeout - Timeout in milliseconds (default: 10000ms)
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Supabase query with timeout wrapper
 * @param queryPromise - The Supabase query promise
 * @param timeout - Timeout in milliseconds (default: 5000ms)
 */
export async function supabaseWithTimeout<T>(
  queryPromise: Promise<T>,
  timeout: number = 5000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Supabase query timeout after ${timeout}ms`)), timeout)
  );

  return Promise.race([queryPromise, timeoutPromise]);
}
