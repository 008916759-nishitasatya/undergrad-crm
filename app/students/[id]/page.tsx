import StudentProfileClient from './StudentProfileClient'

export default function Page({ params }: { params: { id: string } }) {
  return <StudentProfileClient id={params.id} />
}
