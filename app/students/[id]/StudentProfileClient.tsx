'use client'
import { db } from '@/lib/firebase'
import {
  doc,
  onSnapshot,
  collection,
  addDoc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import type { Student, Communication, Note, Interaction } from '@/lib/types'
import Link from 'next/link'

export default function StudentProfileClient({ id }: { id: string }) {
  const [s, setS] = useState<Student | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [comms, setComms] = useState<Communication[]>([])
  const [ints, setInts] = useState<Interaction[]>([])

  useEffect(() => {
    const unsubStudent = onSnapshot(doc(db, 'students', id), (d) =>
      setS(d.exists() ? ({ id: d.id, ...(d.data() as any) }) : null)
    )
    const unsubNotes = onSnapshot(
      query(collection(db, 'students', id, 'notes'), orderBy('ts', 'desc')),
      (snap) => setNotes(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    )
    const unsubComms = onSnapshot(
      query(collection(db, 'students', id, 'communications'), orderBy('ts', 'desc')),
      (snap) => setComms(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    )
    const unsubInts = onSnapshot(
      query(collection(db, 'students', id, 'interactions'), orderBy('ts', 'desc')),
      (snap) => setInts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    )
    return () => { unsubStudent(); unsubNotes(); unsubComms(); unsubInts() }
  }, [id])

  async function addNote(body: string) {
    if (!body.trim()) return
    await addDoc(collection(db, 'students', id, 'notes'), { body, ts: Date.now(), author: 'staff' })
    await updateDoc(doc(db, 'students', id), { lastActive: Date.now(), updatedAt: Date.now() })
  }

  async function logComm(channel: 'email' | 'sms' | 'call', body: string) {
    if (!body.trim()) return
    await addDoc(collection(db, 'students', id, 'communications'), { channel, body, ts: Date.now(), author: 'staff' })
    await updateDoc(doc(db, 'students', id), { lastActive: Date.now(), updatedAt: Date.now() })
  }

  async function setStatus(status: Student['status']) {
    await updateDoc(doc(db, 'students', id), { status, updatedAt: Date.now() })
  }

  async function setAutoFollowupDisabled(disabled: boolean) {
    await updateDoc(doc(db, 'students', id), { autoFollowupDisabled: disabled })
  }

  // NEW: trigger follow-up (mock) from client (uses your signed-in auth)
  async function triggerFollowup() {
    const now = Date.now()
    const body = `Hi ${(s?.name || 'there').split(' ')[0]}, we noticed you haven’t been active recently. Need help with shortlisting or essays? — Undergraduation Team`
    await addDoc(collection(db, 'students', id, 'communications'), {
      channel: 'email',
      subject: 'Checking in on your applications',
      body,
      ts: now,
      author: 'system',
      type: 'manual-mock'
    })
    await updateDoc(doc(db, 'students', id), { lastFollowupSentAt: now, updatedAt: now })
    alert('Mock follow-up logged.')
  }

  if (!s) return <div className="p-6">Loading…</div>

  const pct = { Exploring: 25, Shortlisting: 50, Applying: 75, Submitted: 100 }[s.status]
  const lastAuto = s.lastFollowupSentAt ? new Date(s.lastFollowupSentAt).toLocaleString() : '—'

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{s.name}</h1>
          <p className="text-sm text-gray-600">{s.email} · {s.country || '—'} · Grade {s.grade || '—'}</p>
        </div>
        <div className="flex items-center gap-4">
          <select className="border p-2" value={s.status} onChange={(e) => setStatus(e.target.value as Student['status'])}>
            {['Exploring','Shortlisting','Applying','Submitted'].map(st => <option key={st}>{st}</option>)}
          </select>
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={!!s.autoFollowupDisabled} onChange={(e) => setAutoFollowupDisabled(e.target.checked)} />
            Disable auto follow-ups
          </label>
        </div>
      </div>

      <div>
        <div className="h-3 bg-gray-200 rounded"><div className="h-3 bg-black rounded" style={{ width: `${pct}%` }} /></div>
        <div className="flex items-center justify-between text-xs mt-1">
          <span>Current stage: {s.status}</span>
          <span className="text-gray-500">Last auto follow-up: {lastAuto}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="border px-3 py-2" onClick={triggerFollowup}>Trigger follow-up (mock)</button>
        <Link className="border px-3 py-2" href="/tasks">Create task</Link>
      </div>

      <CommComposer onSubmit={logComm} />
      <NoteEditor onAdd={addNote} />

      <div className="grid md:grid-cols-3 gap-6">
        <section className="md:col-span-2">
          <h2 className="font-semibold mb-2">Interaction Timeline</h2>
          <ul className="space-y-2">
            {ints.map(i => <li key={i.id} className="border p-2">[{i.type}] {i.detail || ''} · {new Date(i.ts).toLocaleString()}</li>)}
          </ul>
        </section>
        <aside>
          <h2 className="font-semibold mb-2">Communication Log</h2>
          <ul className="space-y-2">
            {comms.map(c => (
              <li key={c.id} className="border p-2">
                [{c.channel}] {('subject' in c && (c as any).subject) ? <><em>{(c as any).subject}</em> · </> : null}
                {c.body} · {new Date(c.ts).toLocaleString()}
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <section>
        <h2 className="font-semibold mb-2">Internal Notes</h2>
        <ul className="space-y-2">
          {notes.map(n => <li key={n.id} className="border p-2">{n.body} · {new Date(n.ts).toLocaleString()}</li>)}
        </ul>
      </section>
    </div>
  )
}

function CommComposer({ onSubmit }: { onSubmit: (ch: 'email'|'sms'|'call', body: string) => Promise<void> }) {
  const [body, setBody] = useState(''); const [ch, setCh] = useState<'email'|'sms'|'call'>('call')
  return (
    <div className="border p-3 space-y-2">
      <div className="flex gap-2">
        <select className="border p-2" value={ch} onChange={e => setCh(e.target.value as any)}>
          <option>call</option><option>email</option><option>sms</option>
        </select>
        <input className="flex-1 border p-2" placeholder="Log communication…" value={body} onChange={e => setBody(e.target.value)} />
        <button className="border px-3" onClick={() => { onSubmit(ch, body); setBody('') }}>Add</button>
      </div>
    </div>
  )
}
function NoteEditor({ onAdd }: { onAdd: (body: string) => Promise<void> }) {
  const [val, setVal] = useState('')
  return (
    <div className="border p-3 space-y-2">
      <textarea className="w-full border p-2" rows={3} placeholder="Add internal note…" value={val} onChange={e => setVal(e.target.value)} />
      <button className="border px-3" onClick={() => { onAdd(val); setVal('') }}>Save note</button>
    </div>
  )
}
