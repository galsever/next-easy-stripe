import type {Product} from "../definitions/definitions.ts";
import Stripe from "stripe";
import type {NextRequest, NextResponse} from "next/server";
import {handleWebhook} from "./webhook";
import {safeParse} from "next-utils-sever";

export class StripeConfig {
    public products: Map<string, Product>;
    public paymentSucceeded: (data: Stripe.PaymentIntent) => void;
    public subscriptionCreated: (data: Stripe.Subscription) => void;
    public subscriptionUpdated: (data: Stripe.Subscription) => void;
    public subscriptionDeleted: (data: Stripe.Subscription) => void;
    public stripe: Stripe
    public secretKey: string

    constructor(
        products: Product[] = [],
        paymentSucceeded: (data: Stripe.PaymentIntent) => void = () => {},
        subscriptionCreated: (data: Stripe.Subscription) => void = () => {},
        subscriptionUpdated: (data: Stripe.Subscription) => void = () => {},
        subscriptionDeleted: (data: Stripe.Subscription) => void = () => {},
        secretKey: string
    ) {
        this.products = new Map(products.map(product => [product.name, product]));
        this.paymentSucceeded = paymentSucceeded;
        this.subscriptionCreated = subscriptionCreated;
        this.subscriptionUpdated = subscriptionUpdated;
        this.subscriptionDeleted = subscriptionDeleted;
        this.stripe = new Stripe(secretKey);
        this.secretKey = secretKey;
    }
    async handleSession(formData: FormData): Promise<string | undefined> {
        const productId = formData.get("formData")
        const formQuantity = formData.get("quantity")
        if (!productId || typeof productId !== "string") return
        if (!formQuantity || typeof formQuantity !== "string") return

        const quantity = safeParse(formQuantity)
        if (!quantity) return

        const product = this.products.get(productId)
        if (!product) return

        try {
            const session = await this.stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                line_items: [{ price: product.priceId, quantity: product.mode === "subscription" ? 0 : quantity }],
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

    handleStripeReq(request: NextRequest): Promise<NextResponse> {
        return handleWebhook(request, this)
    }
}