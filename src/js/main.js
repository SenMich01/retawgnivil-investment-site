// --- Global Utilities & Navigation ---
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelector('.nav-links');
    const menuToggle = document.querySelector('.menu-toggle');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Initialize all page-specific functionality
    if (document.getElementById('investment-calculator')) {
        initInvestmentCalculator();
    }
    if (document.getElementById('equity-acquisition-form')) {
        initEquityAcquisitionForm();
    }
    if (document.getElementById('newsletter-form')) {
        initNewsletterForm();
    }
    if (document.querySelector('.deposit-form')) {
        initPaymentForms();
    }
    if (document.getElementById('confirmation-status')) {
        verifyPayment();
    }
});

// --- Investment Page Logic ---
function initInvestmentCalculator() {
    const form = document.getElementById('investment-calculator');
    const resultElement = document.getElementById('calculator-result');

    form.addEventListener('input', calculateReturns);

    function calculateReturns() {
        const initial = parseFloat(document.getElementById('initial-amount').value) || 0;
        const years = parseInt(document.getElementById('years').value) || 1;
        // Placeholder fixed annual return (e.g., 8%) for demonstration
        const rate = 0.08;

        if (initial > 0 && years > 0) {
            // Compound Interest Formula: A = P(1 + r)^t
            const finalValue = initial * Math.pow(1 + rate, years);
            const totalInterest = finalValue - initial;

            resultElement.innerHTML = `
                <p>After **${years}** years, your projected investment value would be **\$${finalValue.toFixed(2)}**.</p>
                <p>Total Projected Returns: **\$${totalInterest.toFixed(2)}** (Estimated ${rate * 100}% annual return).</p>
            `;
            resultElement.style.display = 'block';
        } else {
            resultElement.textContent = 'Please enter valid positive amounts.';
            resultElement.style.display = 'none';
        }
    }
    // Initial calculation on load
    calculateReturns();
}

// --- Equity Acquisition Page Logic (Multistep Form) ---
function initEquityAcquisitionForm() {
    const form = document.getElementById('equity-acquisition-form');
    if (!form) return;

    let currentStep = 1;
    const steps = form.querySelectorAll('.form-step');
    const progressBar = document.getElementById('progress-bar');
    const totalSteps = steps.length;

    function showStep(step) {
        steps.forEach((s, index) => {
            s.style.display = (index + 1 === step) ? 'block' : 'none';
        });
        const progress = (step / totalSteps) * 100;
        progressBar.style.width = `${progress}%`;
        progressBar.textContent = `Step ${step} of ${totalSteps}`;
        currentStep = step;
    }

    form.addEventListener('click', (e) => {
        if (e.target.matches('.btn-next')) {
            // Basic validation for current step fields before proceeding
            if (validateStep(currentStep)) {
                showStep(currentStep + 1);
                window.scrollTo(0, 0); // Scroll to top on step change
            } else {
                alert('Please fill out all required fields.');
            }
        } else if (e.target.matches('.btn-prev')) {
            showStep(currentStep - 1);
            window.scrollTo(0, 0);
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateStep(currentStep)) {
            alert('Please agree to the terms and conditions.');
            return;
        }

        const submitBtn = form.querySelector('.btn-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        // Placeholder for real submission logic (Netlify Function: submit-proposal)
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            // Step 1: Get signed URL for file uploads (if files exist)
            // In a real app, you'd iterate over files and call create-upload-url for each.
            // For this skeleton, we assume the file fields are skipped or handled later.

            // Step 2: Submit proposal metadata
            const response = await fetch('/.netlify/functions/submit-proposal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                // Show confirmation modal
                document.getElementById('confirmation-id').textContent = result.proposalId || 'RV-XXXX';
                document.getElementById('submission-confirmation').style.display = 'block';
                form.reset();
            } else {
                alert(`Submission failed: ${result.message || 'An unknown error occurred.'}`);
            }

        } catch (error) {
            console.error('Submission error:', error);
            alert('A network error occurred during submission.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Proposal';
        }
    });

    function validateStep(step) {
        const stepElement = steps[step - 1];
        if (!stepElement) return true;

        const requiredInputs = stepElement.querySelectorAll('[required]');
        let isValid = true;

        requiredInputs.forEach(input => {
            if (input.type === 'checkbox' && !input.checked) {
                isValid = false;
            } else if (!input.value.trim()) {
                isValid = false;
            }
            // Add more complex validation (email format, file size, etc.) here
        });

        return isValid;
    }

    showStep(1); // Start on the first step
}

// --- Payment Integration Logic (Savings & Investment) ---
function initPaymentForms() {
    const forms = document.querySelectorAll('.payment-form');

    forms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = form.querySelector('.btn-submit');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing...';

            // Get data from the form
            const formData = new FormData(form);
            const amount = parseFloat(formData.get('amount')) * 100; // Convert to cents
            const email = formData.get('email') || 'placeholder@retawgnivil.com';
            const purpose = formData.get('purpose'); // 'deposit' or 'investment'

            if (amount <= 0 || isNaN(amount)) {
                alert('Please enter a valid amount.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Deposit Now / Invest Now';
                return;
            }

            try {
                // Call Netlify Function to create Stripe Checkout Session
                const response = await fetch('/.netlify/functions/create-checkout-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: amount,
                        email: email,
                        purpose: purpose,
                        // Pass plan details, user ID, etc. here
                    }),
                });

                const session = await response.json();

                if (session.id) {
                    // Redirect to Stripe Checkout (Client-side Stripe JS required in HTML)
                    const stripe = Stripe('YOUR_STRIPE_PUBLISHABLE_KEY'); // Replace with actual key
                    stripe.redirectToCheckout({ sessionId: session.id });
                } else {
                    throw new Error(session.error || 'Failed to create checkout session.');
                }
            } catch (error) {
                console.error('Payment error:', error);
                alert(`Payment initiation failed: ${error.message}`);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Deposit Now / Invest Now';
            }
        });
    });
}

// --- Payment Confirmation Logic ---
function verifyPayment() {
    const confirmationElement = document.getElementById('confirmation-status');
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (!sessionId) {
        confirmationElement.innerHTML = '<p class="text-accent">❌ Payment Error: No session ID found.</p>';
        return;
    }

    confirmationElement.innerHTML = '<p class="text-gold">⏳ Verifying payment status...</p>';

    fetch('/.netlify/functions/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId }),
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            confirmationElement.innerHTML = `
                <h2 class="text-secondary">✅ Payment Confirmed!</h2>
                <p>Thank you for your ${data.purpose || 'transaction'} with RetawgNivil.</p>
                <p>Transaction ID: **${data.transactionId || 'N/A'}**</p>
                <p>Amount: **$${(data.amount / 100).toFixed(2) || 'N/A'}**</p>
            `;
        } else {
            confirmationElement.innerHTML = `
                <h2 class="text-accent">⚠️ Payment Not Confirmed</h2>
                <p>We could not verify your payment session. Status: ${data.message || 'Unknown error'}.</p>
                <p>Please check your email for a receipt or contact support with session ID: **${sessionId}**.</p>
            `;
        }
    })
    .catch(error => {
        console.error('Verification error:', error);
        confirmationElement.innerHTML = `<h2 class="text-accent">🚨 Verification Failed</h2><p>A network error occurred. Please contact support.</p>`;
    });
}


// --- Education Page Logic (Newsletter) ---
function initNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = form.querySelector('#newsletter-email').value;
        const submitBtn = form.querySelector('.btn-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Subscribing...';

        try {
            const response = await fetch('/.netlify/functions/subscribe-newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email }),
            });

            const result = await response.json();

            if (response.ok) {
                form.innerHTML = `
                    <p class="text-secondary" style="font-weight: bold;">
                        ✅ Thanks for subscribing! Check your email for a welcome guide to financial literacy.
                    </p>
                `;
            } else {
                alert(`Subscription failed: ${result.message || 'An unknown error occurred.'}`);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Subscribe';
            }
        } catch (error) {
            console.error('Newsletter error:', error);
            alert('A network error occurred.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Subscribe';
        }
    });
}