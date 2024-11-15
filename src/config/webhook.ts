import {NextResponse, type NextRequest } from "next/server";
import {EventType, getEventType} from "../definitions/definitions";
import type {StripeConfig} from "./config.ts";
import Stripe from "stripe";

export async function handleWebhook(request: NextRequest, config: StripeConfig): Promise<NextResponse> {
    const reqText = await request.text()
    const sig = request.headers.get("Stripe-Signature");

    try {
        const event = await config.stripe.webhooks.constructEventAsync(
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
            config.paymentSucceeded(event.data.object as Stripe.PaymentIntent)
        }
        if (eventType === EventType.SubscriptionCreated) {
            config.subscriptionCreated(event.data.object as Stripe.Subscription)
        }
        if (eventType === EventType.SubscriptionUpdated) {
            config.subscriptionUpdated(event.data.object as Stripe.Subscription)
        }
        if (eventType === EventType.SubscriptionDeleted) {
            config.subscriptionDeleted(event.data.object as Stripe.Subscription)
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