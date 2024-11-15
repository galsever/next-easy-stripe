import {NextResponse, type NextRequest } from "next/server";
import {EventType, getEventType} from "../definitions/definitions";
import type {StripeConfig} from "./config.ts";
import Stripe from "stripe";

export async function handleWebhook(request: NextRequest, config: StripeConfig): Promise<NextResponse> {
    const reqText = await request.text()
    const sig = request.headers.get("Stripe-Signature");
    const stripe = new Stripe(config.secretKey)

    try {
        const event = await stripe.webhooks.constructEventAsync(
            reqText,
            sig!,
            config.secretKey
        );

        const eventType = getEventType(event.type)
        if (!eventType) {
            return NextResponse.json({
                status: 500,
                error: "Webhook Error: Invalid Signature",
            });
        }

        if (eventType === EventType.PaymentSucceeded) {
            await config.paymentSucceeded(event.data.object as Stripe.PaymentIntent)
        }
        if (eventType === EventType.SubscriptionCreated) {
            await config.subscriptionCreated(event.data.object as Stripe.Subscription)
        }
        if (eventType === EventType.SubscriptionUpdated) {
            await config.subscriptionUpdated(event.data.object as Stripe.Subscription)
        }
        if (eventType === EventType.SubscriptionDeleted) {
            await config.subscriptionDeleted(event.data.object as Stripe.Subscription)
        }

        return NextResponse.json({
            status: 200,
            message: `Successfully handled event!`,
        })
    } catch (error) {
        console.error("Error constructing Stripe event:", error);
        return NextResponse.json({
            status: 500,
            error: "Webhook Error: Invalid Signature",
        });
    }
}