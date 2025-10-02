'use client'
import AuthGate from '@/components/AuthGate'
import { db } from '@/lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'

type Status = 'Exploring' | 'Shortlisting' | 'Applying' | 'Submitted'

export default function Dashboard() {
  const [counts, setCounts] = useState<{ total: number } & Record<Status, number>>({
    total: 0, Exploring: 0, Shortlisting: 0, Applying: 0, Submitted: 0
  })

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'students'), snap => {
      const c = { total: 0, Exploring: 0, Shortlisting: 0, Applying: 0, Submitted: 0 as number }
      c.total = snap.docs.length
      snap.docs.forEach(d => { const s = (d.data() as any).status as Status; if (s) (c as any)[s]++ })
      setCounts(c as any)
    })
    return () => unsub()
  }, [])

  return (
    <AuthGate>
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">CRM Dashboard</h1>
        <p className="text-gray-600">You’re signed in. This is your internal dashboard.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card label="Total students" value={counts.total} />
          <Card label="Exploring" value={counts.Exploring} />
          <Card label="Applying" value={counts.Applying} />
          <Card label="Submitted" value={counts.Submitted} />
        </div>
      </main>
    </AuthGate>
  )
}
function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded p-4">
      <div className="text-xs uppercase">{label}</div>
      <div className="text-2xl">{value}</div>
    </div>
  )
}
