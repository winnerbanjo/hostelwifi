export async function initializePaystack(input: { email: string; amount: number; reference: string; callbackUrl: string }) {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    if (process.env.NODE_ENV === "production") throw new Error("PAYSTACK_SECRET_KEY is required in production.");
    return {
      authorization_url: `/payment/success?reference=${input.reference}&demo=1`,
      access_code: "demo",
      reference: input.reference
    };
  }

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amount * 100,
      reference: input.reference,
      callback_url: input.callbackUrl
    })
  });
  const json = await res.json();
  if (!res.ok || !json.status) throw new Error(json.message || "Unable to initialize Paystack");
  return json.data;
}

export async function verifyPaystack(reference: string) {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    if (process.env.NODE_ENV === "production") throw new Error("PAYSTACK_SECRET_KEY is required in production.");
    return { status: true, data: { status: "success", reference, amount: 0, gateway_response: "Demo verification" } };
  }
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Unable to verify Paystack payment");
  return json;
}
