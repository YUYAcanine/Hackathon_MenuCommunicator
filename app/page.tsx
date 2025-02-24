"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const [result, setresult] = useState("")

  const handleSubmit = async () => {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: prompt }),
    });
    const data = await response.json();
    console.log('Response:', data);
    
    if (response.ok) {
      setresult(data.response)
    } else {
      console.error("Error:", data.error);
      setresult("An unexpected error occurred.");
    }
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen space-y-4">
      <div className="flex w-full max-w-sm items-center space-x-2">
      <Input 
        placeholder="Enter the words" 
        value={prompt} 
        onChange={(e) => setPrompt(e.target.value)} 
      />
      <Button type="button" onClick={handleSubmit}>Search</Button>
      </div>
      <ScrollArea className="h-[200px] w-full max-w-sm rounded-md border p-4">
        <div>{result}</div>
      </ScrollArea>
    </div>
  )
}
