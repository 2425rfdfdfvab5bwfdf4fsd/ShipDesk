import { useEffect } from "react";
import { useParams } from "wouter";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { MessageThread } from "@/components/messages/MessageThread";
import { useClientMessages, useSendClientMessage, useMarkClientMessagesRead } from "@/hooks/useClientPortal";

export function ClientMessagesPage() {
  const { id } = useParams<{ id: string }>();
  const { data: messagesData } = useClientMessages(id);
  const sendMessage = useSendClientMessage();
  const markRead = useMarkClientMessagesRead();

  useEffect(() => {
    markRead.mutate(id);
  }, [id]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <Link
        href={`/projects/${id}`}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="text-xl font-bold mb-4">Messages</h1>
      <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
        <MessageThread
          messages={messagesData?.messages || []}
          currentSenderType="CLIENT"
          onSend={(body) => sendMessage.mutate({ projectId: id, body })}
          isSending={sendMessage.isPending}
        />
      </div>
    </div>
  );
}
