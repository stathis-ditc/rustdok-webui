// API endpoint for moving files between folders
import { getBaseApiUrl } from '../../config';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the bucket from the query parameters
    const { bucket } = req.query;
    
    if (!bucket) {
      return res.status(400).json({ error: 'Bucket parameter is required' });
    }

    // Get the source and destination keys from the request body
    const { sourceKey, destinationKey } = req.body;
    
    if (!sourceKey || !destinationKey) {
      return res.status(400).json({ error: 'Source and destination keys are required' });
    }

    console.log(`Moving file from ${sourceKey} to ${destinationKey} in bucket ${bucket}`);

    // Call the backend API to move the file
    const baseUrl = getBaseApiUrl();
    const moveUrl = `${baseUrl}/bucket/${bucket}/move`;
    
    console.log(`Using move URL: ${moveUrl}`);
    
    const response = await fetch(moveUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_key: sourceKey,
        destination_key: destinationKey,
      }),
    });

    // Check if the response is successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from backend API:', errorText);
      return res.status(response.status).json({ error: `Failed to move file: ${errorText}` });
    }

    // Return success response
    return res.status(200).json({ message: 'File moved successfully' });
  } catch (error) {
    console.error('Error moving file:', error);
    return res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
} 