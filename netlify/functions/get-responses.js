const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    let userId = null;
    let limit = 100;

    // Handle both GET (query params) and POST (body) requests
    if (event.httpMethod === 'GET') {
      if (event.queryStringParameters) {
        userId = event.queryStringParameters.userId;
        limit = parseInt(event.queryStringParameters.limit) || 100;
      }
    } else if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      userId = body.userId;
      limit = body.limit || 100;
    }
    
    let filter = {};
    if (userId) {
      filter = {
        property: "User ID",
        title: { equals: userId }
      };
    }

    const queryPayload = {
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      sorts: [{ property: "Created At", direction: "descending" }],
      page_size: Math.min(limit, 100)
    };

    const response = await fetch(`https://api.notion.com/v1/databases/${process.env.DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(queryPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Notion query error', 
          details: errorText 
        })
      };
    }

    const result = await response.json();
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Query function error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      })
    };
  }
};
