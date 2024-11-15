import {loadStripe} from "@stripe/stripe-js";

export function useStripe(action: (productId: string, quantity: string) => Promise<string | undefined>) {
    async function buy(productId: string, quantity: number) {
        const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

        const sessionId = await action(productId, quantity.toString())
        if (!sessionId) return

        const stripe = await stripePromise;
        return stripe?.redirectToCheckout({
            sessionId: sessionId,
        });
    }
    return { buy }
}