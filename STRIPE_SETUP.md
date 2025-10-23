# Stripe Integration Setup Guide

## 📋 Prerequisites

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard

## 🔑 Step 1: Get Your Stripe API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. You'll see two keys:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`) - Click "Reveal test key"

## ⚙️ Step 2: Configure Environment Variables

Add the following to your `.env` file in the backend directory:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Note:** For now, you only need the `STRIPE_SECRET_KEY`. The webhook secret is optional for local testing.

## 📦 Step 3: Install Dependencies

In your backend directory, run:

```bash
npm install
```

This will install the Stripe package and all other dependencies.

## 🚀 Step 4: Start Your Servers

### Backend:
```bash
cd C:\Users\tanya\OneDrive\Documents\Projects\e_comm_app
node app.js
```

### Frontend:
```bash
cd C:\Users\tanya\OneDrive\Documents\Projects\ecommerce-frontend
npm run dev
```

## ✅ Step 5: Test the Checkout Flow

1. **Add items to cart**: Browse products and add items to your cart
2. **Go to cart**: Click on the Cart link in the navbar
3. **Review items**: Check quantities and totals
4. **Click "Proceed to Checkout"**: This will create a Stripe session and redirect you

### Stripe Test Mode

When testing, use these test card numbers:

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Payment Declined:**
- Card: `4000 0000 0000 0002`
- Expiry: Any future date
- CVC: Any 3 digits

**More test cards:** https://stripe.com/docs/testing

## 📍 API Endpoints

### Create Checkout Session
```
POST /api/checkout/create-session
```
- **Auth Required**: Yes
- **Request**: Reads cart from session
- **Response**: 
  ```json
  {
    "success": true,
    "sessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/..."
  }
  ```

### Verify Session (After Payment)
```
GET /api/checkout/verify-session/:sessionId
```
- **Auth Required**: Yes
- **Response**:
  ```json
  {
    "success": true,
    "paid": true,
    "session": {
      "id": "cs_test_...",
      "amount_total": 8638,
      "currency": "usd",
      "customer_email": "user@example.com",
      "payment_status": "paid"
    }
  }
  ```

## 🔔 Webhooks (Optional - For Production)

### What are Webhooks?
Webhooks allow Stripe to notify your server when events happen (like successful payments).

### Setting Up Webhooks (For Production):

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/checkout/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the "Signing secret" (starts with `whsec_...`)
6. Add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`

### Testing Webhooks Locally:

Use the Stripe CLI: https://stripe.com/docs/stripe-cli

```bash
# Install Stripe CLI
# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/checkout/webhook
```

## 🎯 How It Works

### Checkout Flow:

1. **User clicks "Proceed to Checkout"** in Cart
   ```
   Frontend → POST /api/checkout/create-session
   ```

2. **Backend creates Stripe session**
   - Reads cart from session
   - Fetches item details from database
   - Creates Stripe checkout session with line items
   - Returns session URL

3. **User is redirected to Stripe Checkout**
   - Stripe handles payment form
   - User enters card details
   - Stripe processes payment

4. **On Success:**
   ```
   Stripe → Redirects to /checkout/success?session_id=cs_test_...
   ```

5. **Frontend verifies payment**
   ```
   Frontend → GET /api/checkout/verify-session/cs_test_...
   Backend → Stripe API (verify session)
   Backend → Returns payment status
   ```

6. **Show success page** with order details

### Security Features:

✅ Authentication required for all checkout endpoints
✅ Server-side session validation
✅ Stripe handles PCI compliance
✅ No card details touch your server
✅ Webhook signature verification (when configured)

## 🐛 Troubleshooting

### Issue: "Failed to create checkout session"
- **Check**: Is `STRIPE_SECRET_KEY` set in `.env`?
- **Check**: Did you run `npm install`?
- **Check**: Is your Stripe key valid and not expired?

### Issue: "Cart is empty" error
- **Solution**: Add items to cart before checkout
- **Check**: Are you logged in?

### Issue: "Payment verification failed"
- **Check**: Is the session ID in the URL?
- **Check**: Is the backend server running?

### Issue: Webhook not working
- **Local Testing**: Use Stripe CLI to forward webhooks
- **Production**: Ensure webhook URL is publicly accessible
- **Check**: Webhook secret is correct in `.env`

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

## 🔐 Production Checklist

Before going live:

- [ ] Replace test API keys with live keys
- [ ] Set up production webhooks
- [ ] Add webhook signature verification
- [ ] Implement order creation in database after payment
- [ ] Add email notifications
- [ ] Test with real cards (in test mode first!)
- [ ] Set up error monitoring
- [ ] Add logging for all transactions
- [ ] Configure proper CORS for production domain
- [ ] Set `NODE_ENV=production`

## 💡 Next Steps

After Stripe is working, you might want to:

1. **Create Orders Table**: Save completed orders to database
2. **Email Notifications**: Send order confirmation emails
3. **Order History**: Let users view past orders
4. **Inventory Management**: Decrease inventory after purchase
5. **Shipping Integration**: Calculate real shipping costs
6. **Multiple Payment Methods**: Add PayPal, Apple Pay, etc.

