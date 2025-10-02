// lib/customerio.ts
const TX_BASE = 'https://api.customer.io/v1';

const txKey = process.env.CUSTOMERIO_TX_API_KEY!;
const txMessageId = process.env.CUSTOMERIO_TRANSACTIONAL_MESSAGE_ID!;
const fromEmail = process.env.CUSTOMERIO_FROM_EMAIL!;

export async function sendFollowupEmail(opts: {
  to: string;
  name?: string;
  studentId: string;
  subjectOverride?: string;
  idempotencyKey?: string;           // use a comm doc id to avoid dupes
  data?: Record<string, any>;
}) {
  const res = await fetch(`${TX_BASE}/send/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${txKey}`,
      ...(opts.idempotencyKey ? { 'Idempotency-Key': opts.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      to: opts.to,
      from: fromEmail,
      transactional_message_id: txMessageId,
      subject: opts.subjectOverride,              // optional
      message_data: {
        name: opts.name,
        studentId: opts.studentId,
        ...opts.data,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Customer.io send failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<{ delivery_id?: string }>;
}
