'use client'
import AuthGate from '@/components/AuthGate'
import { db } from '@/lib/firebase'
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore'
import { useEffect, useState } from 'react'

type Task = { id: string; title: string; done: boolean; createdAt: number }

export default function TasksPage() {
  const [items, setItems] = useState<Task[]>([])
  const [title, setTitle] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap =>
      setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
    )
    return () => unsub()
  }, [])

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    await addDoc(collection(db, 'tasks'), { title, done: false, createdAt: Date.now() })
    setTitle('')
  }
  async function toggle(id: string, done: boolean) {
    await updateDoc(doc(db, 'tasks', id), { done })
  }
  async function remove(id: string) {
    await deleteDoc(doc(db, 'tasks', id))
  }

  return (
    <AuthGate>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <form onSubmit={addTask} className="flex gap-2">
          <input className="border p-2 flex-1" placeholder="Add a task…" value={title}
                 onChange={e => setTitle(e.target.value)} />
          <button className="border px-3">Add</button>
        </form>
        <ul className="space-y-2">
          {items.map(t => (
            <li key={t.id} className="border p-2 flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={t.done} onChange={e => toggle(t.id, e.target.checked)} />
                <span className={t.done ? 'line-through text-gray-500' : ''}>{t.title}</span>
              </label>
              <button className="text-sm underline" onClick={() => remove(t.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </AuthGate>
  )
}
