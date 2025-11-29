const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { amount, email, purpose, userId } = JSON.parse(event.body);

        if (!amount || !email || !purpose) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing required parameters.' }) };
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `RetawgNivil ${purpose.charAt(0).toUpperCase() + purpose.slice(1)}`,
                            description: `Transaction for ${purpose} on RetawgNivil platform.`,
                        },
                        unit_amount: amount, // Amount in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            // Success URL redirects to the confirmation page for client-side verification
            success_url: `${process.env.URL}/payments/confirmation?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.URL}/${purpose}.html`,
            customer_email: email,
            metadata: {
                userId: userId || 'guest',
                purpose: purpose,
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ id: session.id }),
        };

    } catch (error) {
        console.error('Stripe Checkout Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};