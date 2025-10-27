"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageContent } from "./message-content"
import { Sparkles, MessageCircle, Zap, BookOpen, HistoryIcon } from "lucide-react"
import { storeConversation } from '@/lib/lighthouse-storage'
import { SavedConversationsDialog } from '@/components/saved-conversations-dialog'

interface Message {
  role: "user" | "assistant"
  content: string
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Store conversation only when we receive an AI response
  const storeConversationIfComplete = async (messages: Message[]) => {
    // Only store if we have at least one complete exchange (user message + AI response)
    if (messages.length >= 2) {
      try {
        await storeConversation(
          messages,
          process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY || ""
        );
      } catch (error) {
        console.error('Error storing conversation:', error);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Add user message
    const userMessage: Message = { role: "user", content: input }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()
      const assistantMessage: Message = {
        role: "assistant",
        content: data.choices?.[0]?.message?.content || "No response received",
      }

      const newMessages = [...updatedMessages, assistantMessage];
      setMessages(newMessages);
      // Store conversation after we get the AI response
      await storeConversationIfComplete(newMessages);
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      }
      const newMessages = [...updatedMessages, errorMessage];
      setMessages(newMessages);
      // Store even error conversations
      await storeConversationIfComplete(newMessages);
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <SavedConversationsDialog 
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
      />
      {/* Header */}
      <div className="border-b border-border p-6 bg-linear-to-r from-background to-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">peermind</h1>
              <p className="text-sm text-muted-foreground">Your AI companion powered by Mixtral 8x22B</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setIsHistoryOpen(true)}
          >
            <HistoryIcon className="h-4 w-4" />
            <span>View History</span>
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="mb-8">
                <div className="p-4 rounded-lg bg-primary/5 mb-4 inline-block">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to peermind</h2>
                <p className="text-muted-foreground mb-8">Start a conversation and explore what I can help you with</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <Card className="p-4 border border-border hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="p-2 rounded bg-primary/10 w-fit mb-3">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Quick Answers</h3>
                  <p className="text-xs text-muted-foreground">Get instant responses to your questions</p>
                </Card>

                <Card className="p-4 border border-border hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="p-2 rounded bg-primary/10 w-fit mb-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Code Help</h3>
                  <p className="text-xs text-muted-foreground">Get assistance with coding problems</p>
                </Card>

                <Card className="p-4 border border-border hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="p-2 rounded bg-primary/10 w-fit mb-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Creative Ideas</h3>
                  <p className="text-xs text-muted-foreground">Brainstorm and explore new concepts</p>
                </Card>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <Card
                  className={`max-w-xs lg:max-w-md px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground border border-border"
                  }`}
                >
                  <MessageContent content={message.content} />
                </Card>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="bg-card text-card-foreground border border-border px-4 py-2">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200"></div>
                </div>
              </Card>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border p-6 bg-background">
        <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask peermind anything..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="px-6">
            {isLoading ? "Thinking..." : "Send"}
          </Button>
        </form>
      </div>
    </div>
  )
}
