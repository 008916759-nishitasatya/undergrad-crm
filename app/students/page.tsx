'use client'
import AuthGate from '@/components/AuthGate'
import StudentTable from '@/components/StudentTable'
import { useMemo, useState } from 'react'
import type { Student } from '@/lib/types'

export default function StudentsPage() {
  const [q, setQ] = useState('')
  const [quick, setQuick] = useState<string>('')
  const [running, setRunning] = useState(false)

  const filter = useMemo(() => {
    return (s: Student) => {
      const text = (s.name + ' ' + s.email).toLowerCase()
      if (!text.includes(q.toLowerCase())) return false
      if (quick === 'not7d') {
        const last = s.lastActive || 0
        return Date.now() - last > 7 * 24 * 3600 * 1000
      }
      if (quick === 'highIntent') return s.tags?.includes('highIntent') || false
      if (quick === 'needsEssay') return s.tags?.includes('needsEssayHelp') || false
      return true
    }
  }, [q, quick])

  async function runAutoFollowups() {
    try {
      setRunning(true)
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
      // dynamic imports so this page stays light
      const { getDocs, collection, addDoc, updateDoc, doc } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase')

      const snap = await getDocs(collection(db, 'students'))

      let sent = 0
      for (const d of snap.docs) {
        const s: any = d.data()
        if (s.autoFollowupDisabled) continue
        if ((s.lastFollowupSentAt || 0) > cutoff) continue
        if ((s.lastActive || 0) > cutoff) continue

        const now = Date.now()
        await addDoc(collection(db, 'students', d.id, 'communications'), {
          channel: 'email',
          subject: 'Checking in on your applications',
          body: `Hi ${(s.name || 'there').split(' ')[0]}, need help with shortlisting or essays? — Undergraduation Team`,
          ts: now,
          author: 'system',
          type: 'auto-followup',
        })
        await updateDoc(doc(db, 'students', d.id), {
          lastFollowupSentAt: now,
          updatedAt: now,
        })
        sent++
      }
      alert(`Auto-followups sent: ${sent}`)
    } catch (e: any) {
      alert(`Failed to run auto-followups: ${e?.message || e}`)
    } finally {
      setRunning(false)
    }
  }

  return (
    <AuthGate>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Students</h1>

        <div className="flex gap-2">
          <input
            className="border p-2 flex-1"
            placeholder="Search name or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="border p-2"
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
          >
            <option value="">All</option>
            <option value="not7d">Not contacted in 7 days</option>
            <option value="highIntent">High intent</option>
            <option value="needsEssay">Needs essay help</option>
          </select>

          <button
            className="border px-3 py-2"
            onClick={runAutoFollowups}
            disabled={running}
          >
            {running ? 'Running…' : 'Run auto-followups now'}
          </button>
        </div>

        <StudentTable filter={filter} />
      </div>
    </AuthGate>
  )
}
