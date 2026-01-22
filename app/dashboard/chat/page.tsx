import { MessageSquare } from "lucide-react";

export default function ChatPage() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="bg-accent/50 p-6 rounded-full mb-4">
                <MessageSquare className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">Select a Chat</h3>
            <p className="max-w-sm text-center text-sm">
                Choose a team or project from the sidebar to start collaborating with your team.
            </p>
        </div>
    )
}
