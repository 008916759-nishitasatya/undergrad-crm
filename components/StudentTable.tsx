'use client'
import Link from 'next/link'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useEffect, useState } from 'react'
import type { Student } from '@/lib/types'

export default function StudentTable({ filter }: { filter?: (s: Student) => boolean }) {
  const [rows, setRows] = useState<Student[]>([])

  useEffect(() => {
    const q = query(collection(db, 'students'), orderBy('updatedAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Student[]
      setRows(filter ? data.filter(filter) : data)
    })
    return () => unsub()
  }, [filter])

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left">
          <th className="p-2">Name</th>
          <th className="p-2">Email</th>
          <th className="p-2">Country</th>
          <th className="p-2">Status</th>
          <th className="p-2">Last Active</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((s) => (
          <tr key={s.id} className="border-b hover:bg-gray-50">
            <td className="p-2">
              <Link href={`/students/${s.id}`} className="underline">
                {s.name}
              </Link>
            </td>
            <td className="p-2">{s.email}</td>
            <td className="p-2">{s.country || '—'}</td>
            <td className="p-2">{s.status}</td>
            <td className="p-2">
              {s.lastActive ? new Date(s.lastActive).toLocaleDateString() : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
