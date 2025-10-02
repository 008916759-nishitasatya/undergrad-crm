export type Status = 'Exploring' | 'Shortlisting' | 'Applying' | 'Submitted'

export interface Student {
  id: string
  name: string
  email: string
  phone?: string
  grade?: string
  country?: string
  status: Status
  lastActive?: number   // ms epoch
  tags?: string[]       // e.g. ['highIntent','needsEssayHelp']
  createdAt: number
  updatedAt: number
  lastFollowupSentAt?: number;   // ms epoch of last auto-email
  autoFollowupDisabled?: boolean; // opt-out
}

export interface Interaction {
  id: string
  type: 'login' | 'ai' | 'upload'
  detail?: string
  ts: number
}

export interface Communication {
  id: string
  channel: 'email' | 'sms' | 'call'
  subject?: string
  body?: string
  ts: number
  author: string
}

export interface Note {
  id: string
  body: string
  ts: number
  author: string
}
