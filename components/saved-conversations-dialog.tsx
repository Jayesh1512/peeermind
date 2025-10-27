'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ExternalLinkIcon, ClockIcon } from "lucide-react"
import { getLighthouseConversations } from '@/lib/lighthouse-storage';

interface SavedConversationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SavedConversationsDialog({ open, onOpenChange }: SavedConversationsDialogProps) {
  const [conversations, setConversations] = useState<Array<{
    hash: string;
    timestamp: number;
    preview: string;
  }>>([]);

  useEffect(() => {
    if (open) {
      setConversations(getLighthouseConversations());
    }
  }, [open]);

  const viewConversation = (hash: string) => {
    window.open(`https://gateway.lighthouse.storage/ipfs/${hash}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Saved Conversations</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[450px] pr-4">
          <div className="space-y-4">
            {conversations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No saved conversations yet
              </p>
            ) : (
              conversations.map((conv, i) => (
                <div
                  key={conv.hash}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ClockIcon className="size-4" />
                      <span>
                        {new Date(conv.timestamp).toLocaleDateString()} at{' '}
                        {new Date(conv.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewConversation(conv.hash)}
                    >
                      View <ExternalLinkIcon className="ml-2 size-4" />
                    </Button>
                  </div>
                  <p className="text-sm">{conv.preview}</p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}