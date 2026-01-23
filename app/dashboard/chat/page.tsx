import { MessageSquare } from "lucide-react";
import { getUserTeams } from "./queries";
import { ChatSidebar } from "@/components/chat/ChatSidebar";

export default async function ChatPage() {
    const teams = await getUserTeams()

    return (
        <div className="h-full">
            {/* Mobile View: Show Team List */}
            <div className="md:hidden h-full">
                <ChatSidebar teams={teams} />
            </div>

            {/* Desktop View: Show Placeholder */}
            <div className="hidden md:flex flex-col items-center justify-center h-full text-muted-foreground">
                <div className="bg-accent/50 p-6 rounded-full mb-4">
                    <MessageSquare className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Select a Chat</h3>
                <p className="max-w-sm text-center text-sm">
                    Choose a team or project from the sidebar to start collaborating with your team.
                </p>
            </div>
        </div>
    )
}
