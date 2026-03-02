import { auth } from '@/auth'
import { db } from '@/lib/db'
import { transactions, categories, projects } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { FinancesManager } from '@/components/finances/finances-manager'
import { redirect } from 'next/navigation'

export default async function FinancesPage() {
    const session = await auth()
    if (!session?.user?.id) redirect('/login')

    const [transactionsData, categoriesData, projectsData] = await Promise.all([
        db.select().from(transactions).where(eq(transactions.userId, session.user.id)),
        db.select().from(categories).where(eq(categories.userId, session.user.id)),
        db.select().from(projects),
    ])

    return (
        <FinancesManager
            initialTransactions={transactionsData as any}
            categories={categoriesData as any}
            projects={projectsData as any}
        />
    )
}
