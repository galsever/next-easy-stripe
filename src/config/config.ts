import type {Product} from "../definitions/definitions.ts";
import Stripe from "stripe";
import {NextRequest, NextResponse} from "next/server";
import {handleWebhook} from "./webhook";
import {safeParse} from "next-utils-sever";

export class StripeConfig {
    public products: Map<string, Product>;
    public paymentSucceeded: (data: Stripe.PaymentIntent) => Promise<void>;
    public subscriptionCreated: (data: Stripe.Subscription) => Promise<void>;
    public subscriptionUpdated: (data: Stripe.Subscription) => Promise<void>;
    public subscriptionDeleted: (data: Stripe.Subscription) => Promise<void>;
    public secretKey: string;
    public stripe: Stripe;
    public webhookSecret: string;

    constructor(
        products: Product[] = [],
        paymentSucceeded: (data: Stripe.PaymentIntent) => Promise<void> = async () => {},
        subscriptionCreated: (data: Stripe.Subscription) => Promise<void> = async () => {},
        subscriptionUpdated: (data: Stripe.Subscription) => Promise<void> = async () => {},
        subscriptionDeleted: (data: Stripe.Subscription) => Promise<void> = async () => {},
        secretKey: string,
        webhookSecret: string
    ) {
        this.products = new Map(products.map(product => [product.name, product]));
        this.paymentSucceeded = paymentSucceeded;
        this.subscriptionCreated = subscriptionCreated;
        this.subscriptionUpdated = subscriptionUpdated;
        this.subscriptionDeleted = subscriptionDeleted;
        this.secretKey = secretKey;
        this.stripe = new Stripe(secretKey);
        this.webhookSecret = webhookSecret
    }
    async handleSession(productId: string, formQuantity: string): Promise<string | undefined> {
        if (!productId) return
        if (!formQuantity) return

        const quantity = safeParse(formQuantity)
        if (!quantity) return

        const product = this.products.get(productId)
        if (!product) return

        try {
            const session = await this.stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                line_items: [{ price: product.priceId, quantity: product.mode === "subscription" ? 1 : quantity }],
                mode: product.mode,
                success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.FRONTEND_URL}/cancel`,
                allow_promotion_codes: true,
            });


            return session.id
        } catch (error) {
            console.error("Error creating checkout session:", error);
            return
        }
    }

    handleStripeReq(req: NextRequest): Promise<NextResponse> {
        return handleWebhook(req, this)
    }
}