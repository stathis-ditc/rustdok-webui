/**
 * API Proxy for RustDok Server
 * 
 * This file creates a proxy endpoint that forwards requests from the browser
 * to the rustdok-server. This ensures that the browser never directly communicates
 * with the backend service, providing a more secure and consistent architecture.
 * 
 * The browser makes requests to /api/proxy/*, which are handled by this file
 * and forwarded to the actual rustdok-server.
 */

export default async function handler(req, res) {
  // Get the API URL from environment variables
  const apiUrl = process.env.NEXT_PUBLIC_RUSTDOK_API_URL;
  const apiVersion = process.env.NEXT_PUBLIC_RUSTDOK_API_VERSION || 'v1';
  
  if (!apiUrl) {
    console.error('API_URL is not defined in server environment');
    return res.status(500).json({ 
      error: 'API_URL is not defined in server environment',
      message: 'The server is not properly configured. Please set the NEXT_PUBLIC_RUSTDOK_API_URL environment variable.'
    });
  }
  
  // Get the path from the request
  const { path } = req.query;
  
  // Construct the target URL
  // The path comes as an array from the catch-all route
  const targetPath = path.join('/');
  
  // Get the query string from the request URL
  const queryString = Object.keys(req.query)
    .filter(key => key !== 'path') // Exclude the path parameter
    .map(key => {
      // Handle array values (e.g., ?key=value1&key=value2)
      if (Array.isArray(req.query[key])) {
        return req.query[key].map(val => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`).join('&');
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(req.query[key])}`;
    })
    .join('&');
  
  // Construct the full URL with query parameters
  const targetUrl = `${apiUrl}/api/${apiVersion}/${targetPath}${queryString ? `?${queryString}` : ''}`;
  
  console.log(`[API Proxy] Original URL: ${req.url}`);
  console.log(`[API Proxy] Path array:`, path);
  console.log(`[API Proxy] Query parameters:`, req.query);
  console.log(`[API Proxy] Proxying ${req.method} request to: ${targetUrl}`);
  
  try {
    // Forward relevant headers, but exclude some that might cause issues
    const headers = { ...req.headers };
    
    // Remove headers that shouldn't be forwarded
    delete headers.host;
    delete headers.connection;
    delete headers['content-length']; // Let fetch calculate this
    
    // Log request details in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[API Proxy] Request headers:`, headers);
      if (req.body && Object.keys(req.body).length > 0) {
        console.log(`[API Proxy] Request body:`, typeof req.body === 'object' ? JSON.stringify(req.body).substring(0, 200) + '...' : 'Binary data');
      }
    }
    
    // Create an AbortController to handle timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      // Forward the request to the target URL with timeout
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: headers,
        signal: controller.signal,
        // Forward the body for POST, PUT, PATCH requests
        ...(req.method !== 'GET' && req.method !== 'HEAD' && { 
          body: typeof req.body === 'object' ? JSON.stringify(req.body) : req.body 
        }),
      });
      
      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      // Forward the response headers - using a compatible approach
      // Instead of using headers.raw() which is not available in all environments,
      // we iterate through the headers using the forEach method
      response.headers.forEach((value, key) => {
        // Skip setting content-length as it will be set automatically
        if (key.toLowerCase() !== 'content-length') {
          res.setHeader(key, value);
        }
      });
      
      // Set the status code
      res.status(response.status);
      
      // Check content type to determine how to handle the response
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        // Handle JSON response
        const data = await response.json();
        return res.json(data);
      } else if (contentType.includes('text/')) {
        // Handle text response
        const text = await response.text();
        return res.send(text);
      } else {
        // Handle binary response (images, files, etc.)
        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));
      }
    } catch (fetchError) {
      // Clear the timeout to prevent memory leaks
      clearTimeout(timeoutId);
      
      // Re-throw the error to be caught by the outer try/catch
      throw fetchError;
    }
  } catch (error) {
    console.error('[API Proxy] Error proxying request:', error);
    
    // Provide more detailed error information
    let errorDetails = {
      error: 'Failed to proxy request to API server',
      details: error.message,
      targetUrl
    };
    
    // Add more specific error information based on the error type
    if (error.name === 'AbortError') {
      errorDetails.reason = 'Request timed out after 10 seconds';
      errorDetails.suggestion = 'Check if the RustDok server is running and accessible from the WebUI pod';
      return res.status(504).json(errorDetails); // Gateway Timeout
    } else if (error.code === 'ECONNREFUSED') {
      errorDetails.reason = 'Connection refused';
      errorDetails.suggestion = 'Ensure the RustDok server is running and the URL is correct';
      return res.status(502).json(errorDetails); // Bad Gateway
    } else if (error.code === 'ENOTFOUND') {
      errorDetails.reason = 'DNS lookup failed';
      errorDetails.suggestion = 'Check if the hostname in NEXT_PUBLIC_RUSTDOK_API_URL is correct';
      return res.status(502).json(errorDetails); // Bad Gateway
    }
    
    return res.status(500).json(errorDetails);
  }
} 