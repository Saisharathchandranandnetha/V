import { ChatLayout } from '@/components/chat/ChatLayout'
import { redirect } from 'next/navigation'
import { getUserTeams } from './queries'

export default async function Layout({
    children,
}: {
    children: React.ReactNode
}) {
    const formattedTeams = await getUserTeams()

    return (
        <ChatLayout teams={formattedTeams}>
            {children}
        </ChatLayout>
    )
}
