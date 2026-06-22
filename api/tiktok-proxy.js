import axios from 'axios';

export const handler = async (req, res) => {
  const { endpoint, method = 'GET', data, headers } = req.body;
  
  // Validate request to tiktokglobalshop.com
  if (!endpoint.startsWith('/api/v202309/')) {
    return res.status(403).json({ error: 'Forbidden endpoint' });
  }

  try {
    const response = await axios({
      method,
      url: `https://tiktokglobalshop.com${endpoint}`,
      data,
      headers: {
        'x-shop-app-key': process.env.TIKTOK_SHOP_APP_KEY,
        'x-shop-access-token': process.env.TIKTOK_SHOP_ACCESS_TOKEN,
        'x-vendor-secret-stream': process.env.TIKTOK_VENDOR_SECRET_STREAM,
        'Content-Type': 'application/json',
        ...headers
      }
    });
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to proxy request' });
  }
};
