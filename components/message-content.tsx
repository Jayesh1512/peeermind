"use client"

import { CodeBlock } from "./code-block"

interface MessageContentProps {
  content: string
}

export function MessageContent({ content }: MessageContentProps) {
  // Parse content for code blocks
  const parts = content.split(/(```[\s\S]*?```)/g)

  return (
    <div className="space-y-2">
      {parts.map((part, index) => {
        if (part.startsWith("```")) {
          // Extract language and code
          const match = part.match(/```(\w+)?\n([\s\S]*?)```/)
          if (match) {
            const language = match[1] || "javascript"
            const code = match[2].trim()
            return <CodeBlock key={index} code={code} language={language} />
          }
        }
        return (
          part && (
            <p key={index} className="text-sm whitespace-pre-wrap">
              {part}
            </p>
          )
        )
      })}
    </div>
  )
}
