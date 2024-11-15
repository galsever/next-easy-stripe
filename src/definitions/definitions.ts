export interface Product {
    name: string,
    priceId: string,
    mode: "payment" | "setup" | "subscription"
}

export const EventType = {
    PaymentSucceeded: "payment_intent.succeeded",

    SubscriptionCreated: "customer.subscription.created",
    SubscriptionUpdated: "customer.subscription.updated",
    SubscriptionDeleted: "customer.subscription.deleted",
} as const;

export type EventType = typeof EventType[keyof typeof EventType];

export function getEventType(eventName: string): EventType | undefined {
    return Object.values(EventType).includes(eventName as EventType)
        ? (eventName as EventType)
        : undefined;
}
