import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import {
  collection, query, where, orderBy, limit, getDocs,
  addDoc, doc, updateDoc
} from 'firebase/firestore'

const DAYS = 7
const CUTOFF_MS = DAYS * 24 * 60 * 60 * 1000

// OPTIONAL: simple auth for production cron calls
// Set CRON_SECRET in your Vercel project or `.env.local` for local testing
function assertAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // no secret set → allow (dev)
  const h = req.headers.get('authorization') || ''
  return h === `Bearer ${secret}`
}

// Run with GET (easy for browser/cron)
export async function GET(req: NextRequest) {
  if (!assertAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const now = Date.now()
  const cutoff = now - CUTOFF_MS

  // Find up to 50 overdue students by lastActive
  const q = query(
    collection(db, 'students'),
    where('lastActive', '<=', cutoff),
    orderBy('lastActive', 'asc'),
    limit(50)
  )

  const snap = await getDocs(q)
  let checked = 0
  let sent = 0

  await Promise.all(
    snap.docs.map(async d => {
      checked++
      const s = d.data() as any
      if (s.autoFollowupDisabled) return
      // don't send if we already sent one in last 7 days
      if (s.lastFollowupSentAt && s.lastFollowupSentAt > cutoff) return

      const firstName = (s.name || 'there').toString().split(' ')[0]
      const body =
        `Hi ${firstName}, we noticed you haven’t been active recently on ` +
        `your college application journey. Need help with shortlisting or essays? ` +
        `Reply to this email and we’ll jump in. — Undergraduation Team`

      // Mock email = add a Communication log entry
      await addDoc(collection(db, 'students', d.id, 'communications'), {
        channel: 'email',
        subject: 'Checking in on your applications',
        body,
        ts: now,
        author: 'system',
        type: 'auto-followup'
      })

      // Mark that we sent one
      await updateDoc(doc(db, 'students', d.id), {
        lastFollowupSentAt: now,
        updatedAt: now
      })

      sent++
    })
  )

  return NextResponse.json({ ok: true, checked, sent, cutoff })
}

// If you also want POST support (not necessary), you can:
// export { GET as POST }

