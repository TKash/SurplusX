import { requireProfile } from '@/lib/auth/guards'
import LotForm from '@/components/app/LotForm'
import { PageHeader } from '@/components/app/ui'

export default async function NewLotPage() {
  await requireProfile()

  return (
    <main className="flex-1">
      <PageHeader
        title="Post a lot"
        description="Buyers see the photos, spec and price. When someone claims it, the lot is held for them for 48 hours while you talk and confirm."
      />
      <div className="px-4 py-6 sm:px-7 sm:py-8">
        <div className="max-w-2xl">
          <LotForm />
        </div>
      </div>
    </main>
  )
}
