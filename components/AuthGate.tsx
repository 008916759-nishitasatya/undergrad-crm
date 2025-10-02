'use client'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useEffect, useState } from 'react'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setReady(true) }), [])
  if (!ready) return <div className="p-8">Loading…</div>
  if (!user) return <div className="p-8">Not signed in. Go to <a className="underline" href="/login">/login</a></div>

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between p-4 border-b">
        <nav className="flex gap-4 text-sm">
          <a className="underline" href="/dashboard">Dashboard</a>
          <a className="underline" href="/students">Students</a>
          <a className="underline" href="/tasks">Tasks</a>
        </nav>
        <button className="border px-3 py-1" onClick={() => signOut(auth)}>Sign out</button>
      </header>
      {children}
    </div>
  )
}
