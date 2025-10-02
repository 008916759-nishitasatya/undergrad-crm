// app/api/followup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getDoc, doc, addDoc, collection, updateDoc } from 'firebase/firestore';
import { sendFollowupEmail } from '@/lib/customerio';

export const runtime = 'nodejs'; // ensures Node features available

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 });

  // Load student
  const snap = await getDoc(doc(db, 'students', studentId));
  if (!snap.exists()) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const s = snap.data() as any;

  // Respect opt-out flag
  if (s.autoFollowupDisabled) {
    return NextResponse.json({ ok: true, skipped: 'autoFollowupDisabled' });
  }

  const now = Date.now();
  const firstName = (s.name || 'there').toString().split(' ')[0];

  // Prepare a comm doc id for idempotency
  const commCol = collection(db, 'students', studentId, 'communications');
  const commRef = doc(commCol); // pre-create ref to get id

  // Send via Customer.io
  const delivery = await sendFollowupEmail({
    to: s.email,
    name: s.name,
    studentId,
    idempotencyKey: commRef.id,
    data: { status: s.status, country: s.country },
  });

  // Log in Firestore for the UI
  await setDoc(commRef, {
    channel: 'email',
    provider: 'customerio',
    providerDeliveryId: delivery.delivery_id || null,
    subject: 'Checking in on your applications',
    body: '(sent via Customer.io template)',
    ts: now,
    author: 'system',
    type: 'manual',
    status: 'queued',
  });

  await updateDoc(doc(db, 'students', studentId), {
    lastFollowupSentAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ ok: true, delivery });
}

// Optional: allow GET for quick testing in the browser
export { POST as GET };
