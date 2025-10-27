"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"

interface CodeBlockProps {
  code: string
  language?: string
}

export function CodeBlock({ code, language = "javascript" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-3 rounded border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between bg-muted px-4 py-2">
        <span className="text-xs font-mono text-muted-foreground">{language}</span>
        <Button size="sm" variant="ghost" onClick={handleCopy} className="h-6 w-6 p-0">
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4">
        <code className="text-sm font-mono text-foreground">{code}</code>
      </pre>
    </div>
  )
}
