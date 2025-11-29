const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// const { createClient } = require('@supabase/supabase-js'); // Example DB

// const supabase = createClient(process.env.SUPABASE_URL, process.env.DB_SERVICE_KEY);

exports.handler = async (event) => {
    const signature = event.headers['stripe-signature'];
    let stripeEvent;

    try {
        // Construct the event object for security
        stripeEvent = stripe.webhooks.constructEvent(
            event.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.log(`⚠️  Webhook Error: ${err.message}`);
        return { statusCode: 400, body: `Webhook Error: ${err.message}` };
    }

    const dataObject = stripeEvent.data.object;

    // Handle the event
    switch (stripeEvent.type) {
        case 'checkout.session.completed':
            // Payment success. This is the server-side source of truth.
            console.log('Checkout session completed:', dataObject.id);

            // 1. Fulfill the purchase (e.g., update DB, send confirmation email)
            // const { error } = await supabase
            //     .from('transactions')
            //     .update({ status: 'fulfilled' })
            //     .eq('stripe_session_id', dataObject.id);
            
            // 2. Send FULFILLMENT email (SendGrid placeholder)

            break;
        case 'payment_intent.succeeded':
            // A payment intent succeeded (Can be redundant with checkout.session.completed)
            console.log('Payment Intent Succeeded:', dataObject.id);
            break;
        case 'payment_intent.payment_failed':
            // Payment failed logic
            console.log('Payment Failed:', dataObject.id);
            break;
        // ... handle other event types
        default:
            console.log(`Unhandled event type ${stripeEvent.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
};