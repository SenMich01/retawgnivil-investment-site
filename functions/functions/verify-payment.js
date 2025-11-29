const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// const { createClient } = require('@supabase/supabase-js'); // Example DB

// const supabase = createClient(process.env.SUPABASE_URL, process.env.DB_SERVICE_KEY);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { sessionId } = JSON.parse(event.body);

        if (!sessionId) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Missing session ID.' }) };
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            // 1. **Check if order already fulfilled (Idempotency)**
            // This prevents double-processing if the user refreshes.

            // 2. **Update Database (Placeholder)**
            // const { error: dbError } = await supabase
            //     .from('transactions')
            //     .update({ status: 'confirmed', stripe_session_id: sessionId })
            //     .eq('user_id', session.metadata.userId);

            // if (dbError) throw new Error('DB Update Failed');

            return {
                statusCode: 200,
                body: JSON.stringify({
                    status: 'success',
                    message: 'Payment verified and transaction confirmed.',
                    transactionId: session.payment_intent,
                    amount: session.amount_total,
                    purpose: session.metadata.purpose,
                }),
            };
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ status: 'failed', message: `Payment status is: ${session.payment_status}` }),
            };
        }

    } catch (error) {
        console.error('Verification Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ status: 'error', message: error.message }),
        };
    }
};