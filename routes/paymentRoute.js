const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { ensureAuthenticated } = require("../middlewares/authMiddleware");
const client = require("../config/db");

router.post("/create-payment-intent", ensureAuthenticated, async (req, res) => {
  try {
    const { amount, items } = req.body;
    
    // Validate input
    if (!amount || typeof amount !== "number" || amount < 1) {
      return res.status(400).json({ error: "Valid amount required" });
    }
    
    // Convert to BDT cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "bdt",
      metadata: {
        userId: req.user.uid,
        items: JSON.stringify(items)
      }
    });

    // Create payment record
    await client.db("collectionDB").collection("payments").insertOne({
      userId: req.user.uid,
      amount: amount,
      currency: "BDT",
      status: "created",
      paymentIntentId: paymentIntent.id,
      items: items,
      createdAt: new Date()
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id
    });

  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({ 
      error: "Payment processing failed",
      details: error.message 
    });
  }
});

router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const db = client.db("collectionDB");
    const payments = await db
      .collection("payments")
      .find({ userId: req.user.uid })
      .sort({ createdAt: -1 })
      .toArray();

    // Convert MongoDB objects to plain JS objects
    const formattedPayments = payments.map(payment => ({
      ...payment,
      _id: payment._id.toString(),
      createdAt: payment.createdAt.toISOString(),
      items: payment.items.map(item => ({
        ...item,
        price: parseFloat(item.price.toString())
      }))
    }));

    res.status(200).json(formattedPayments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Failed to fetch payment history" });
  }
});

module.exports = router;