
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Only allow POST requests for creating a Stripe session
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { userId, priceId } = req.body;

  // Basic validation of required fields
  if (!userId || !priceId) {
    return res
      .status(400)
      .json({ error: 'Missing required fields: userId or priceId' });
  }

  try {
    // Ensure the Stripe secret key is available
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key is not configured');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel`,
      metadata: { userId },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    // Log the error for debugging purposes
    console.error('Error creating Stripe session:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      details: error.message,
    });
  }
};
