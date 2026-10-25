import { requireProfile } from '@/lib/auth/guards'
import LotForm from '@/components/app/LotForm'
import { PageHeader } from '@/components/app/ui'

export default async function NewLotPage() {
  const { profile } = await requireProfile()

  return (
    <main className="flex-1">
      <PageHeader
        title="Post a lot"
        description="Buyers see the photos, details and your contact, and come straight to you. Fill in what you know — you can always add more later."
      />
      <div className="px-4 py-6 sm:px-7 sm:py-8">
        <div className="max-w-2xl">
          <LotForm defaultContact={profile.whatsapp_number ?? ''} />
        </div>
      </div>
    </main>
  )
}
