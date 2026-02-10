// Get Stripe publishable key from meta tag
document.addEventListener('DOMContentLoaded', () => {
  const publishableKey = document.querySelector('meta[name="stripe-key"]')?.content;

  if (!publishableKey) {
    console.error('Stripe publishable key not found');
    showStatus('Configuration error: Stripe key missing', 'error');
    return;
  }

  // Initialize Stripe
  const stripe = Stripe(publishableKey);
  const elements = stripe.elements();
  const cardElement = elements.create('card');
  cardElement.mount('#card-element');

  // DOM Elements
  const amountInput = document.getElementById('amount');
  const displayAmount = document.getElementById('display-amount');
  const newBalance = document.getElementById('new-balance');
  const btnAmount = document.getElementById('btn-amount');
  const currentBalance = parseFloat(document.querySelector('.balance-amount').textContent.replace('₹', ''));
  const payButton = document.getElementById('pay-button');
  const amountSuggestions = document.querySelectorAll('.amount-btn');
  const loadingSpinner = document.getElementById('loading-spinner');

  // Update display amounts in real-time
  amountInput.addEventListener('input', (e) => {
    const amount = e.target.value;
    const numAmount = parseInt(amount) || 0;
    
    displayAmount.textContent = '₹' + numAmount.toLocaleString();
    btnAmount.textContent = numAmount.toLocaleString();
    newBalance.textContent = (currentBalance + numAmount).toLocaleString();
    
    // Clear error when user starts typing
    clearError('amount-error');
  });

  // Amount suggestion buttons
  amountSuggestions.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const amount = btn.dataset.amount;
      amountInput.value = amount;
      amountInput.dispatchEvent(new Event('input'));
      
      // Visual feedback
      amountSuggestions.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Handle card errors
  cardElement.on('change', (event) => {
    if (event.error) {
      showError('card-error', event.error.message);
    } else {
      clearError('card-error');
    }
  });

  // Handle payment button click
  payButton.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const amount = amountInput.value;
    
    // Validate amount
    if (!amount || parseInt(amount) <= 0) {
      showError('amount-error', 'Please enter a valid amount');
      amountInput.focus();
      return;
    }

    // Disable button and show loading
    payButton.disabled = true;
    showLoading(true);

    try {
      // Create payment intent
      const response = await fetch('/wallet/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: parseInt(amount) }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      // Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        showStatus(result.error.message, 'error');
        payButton.disabled = false;
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        // Confirm with server
        const updateResponse = await fetch('/wallet/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: result.paymentIntent.id,
            amount: parseInt(amount),
          }),
        });

        if (updateResponse.ok) {
          showStatus('Payment successful! Your wallet has been updated.', 'success');
          setTimeout(() => {
            window.location.href = '/wallet';
          }, 2000);
        } else {
          throw new Error('Failed to update wallet');
        }
      }
    } catch (error) {
      showStatus(error.message, 'error');
      payButton.disabled = false;
    } finally {
      showLoading(false);
    }
  });

  // Helper functions
  function showError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    errorDiv.classList.add('visible');
    const span = errorDiv.querySelector('span') || (() => {
      const s = document.createElement('span');
      errorDiv.appendChild(s);
      return s;
    })();
    span.textContent = message;
  }

  function clearError(elementId) {
    const errorDiv = document.getElementById(elementId);
    errorDiv.classList.remove('visible');
  }

  function showStatus(message, type) {
    const statusDiv = document.getElementById('payment-status');
    const statusContent = statusDiv.querySelector('.status-content');
    
    statusContent.className = 'status-content ' + type;
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    statusContent.innerHTML = `
      <i class="fas ${icon}"></i>
      <span>${message}</span>
    `;
    
    statusDiv.classList.add('visible');
  }

  function showLoading(show) {
    const spinner = document.getElementById('loading-spinner');
    if (show) {
      spinner.classList.add('visible');
    } else {
      spinner.classList.remove('visible');
    }
  }
});
