import {loadStripe} from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function useStripe(action: (formData: FormData) => Promise<string | undefined>) {
    async function buy(productId: string, quantity: number) {
        const formData = new FormData()
        formData.append("productId", productId)
        formData.append("quantity", quantity.toString())
        const sessionId = await action(formData)

        if (!sessionId) return
        const stripe = await stripePromise;
        return stripe?.redirectToCheckout({
            sessionId: sessionId,
        });
    }
    return { buy }
}