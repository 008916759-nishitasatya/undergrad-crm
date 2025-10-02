'use client'
import { db } from '@/lib/firebase'
import { addDoc, collection } from 'firebase/firestore'

export default function Seed() {
  async function run() {
    const demo = [
      { name: 'Asha Patel', email: 'asha@ex.com', country: 'IN', status: 'Exploring' },
      { name: 'Diego Ramos', email: 'diego@ex.com', country: 'BR', status: 'Applying' },
      { name: 'Mina Lee',  email: 'mina@ex.com',  country: 'KR', status: 'Shortlisting' },
    ]
    for (const s of demo) {
      const ref = await addDoc(collection(db, 'students'), {
        ...s,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: [],
        lastActive: Date.now()
      })
      await addDoc(collection(db, 'students', ref.id, 'interactions'),
        { type: 'login', ts: Date.now(), detail: 'Signed in' })
    }
    alert('Seeded! Go to /students')
  }
  return (
    <div className="p-6">
      <button className="border px-3 py-2" onClick={run}>Seed demo data</button>
    </div>
  )
}
