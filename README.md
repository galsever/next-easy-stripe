# next-easy-stripe

An abstraction of the stripe library for Next.js

To install:

````shell
bun add next-easy-stripe
````
or
````shell
pnpm add next-easy-stripe
````
or
````shell
npm install next-easy-stripe
````

How to use:

1. Create a stripe.ts file inside of app/lib
2. Paste this code there:
````typescript
'use server'

export async function handleStripeSession(formData: FormData): Promise<string | undefined> {
    return stripeClient.handleSession(formData)
}
````
3. Create a file called stripe.ts in root and paste this code.
````typescript
import {StripeConfig} from "next-easy-stripe";

export const stripeClient = new StripeConfig(
    [
        {
            name: "Pro",
            priceId: "price-id", // get this from stripe
            mode: "subscription"
        }
        // add more products here
    ],
    (data) => {
        // add code here
    },
    (data) => {
        // add code here
    },
    (data) => {
        // add code here
    },
    (data) => {
        // add code here
    },
    process.env.STRIPE_SECRET_KEY!
)
````
4. Create a route.ts file in app/api/somepath/route.ts. "somepath" can be anything you want. I use api/payments/webhook/route.ts
5. In route.ts paste this code:
````typescript
import {NextRequest} from "next/server";
import {stripeClient} from "@/app/lib/stripe/stripe";

export async function POST(req: NextRequest) {
    return stripeClient.handleStripeReq(req);
}
````
6. All server-side code is done. Here's a demo upgrade component
````typescript jsx
'use client'

import {useStripe} from "next-easy-stripe";
import {handleStripeSession} from "@/app/lib/stripe/stripe";

export function Upgrade() {
    const {buy} = useStripe(handleStripeSession)
    return (
        <button onClick={async () => {
            await buy("Pro", 1)
        }}>Upgrade to pro</button>
    )
}
````