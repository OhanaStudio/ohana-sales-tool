"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react"

interface SendToMakeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportId: string
  reportUrl: string
  reportScore: number
  reportDate: string
}

type Status = "idle" | "uploading" | "sending" | "success" | "error"

export function SendToMakeDialog({
  open,
  onOpenChange,
  reportId,
  reportUrl,
  reportScore,
  reportDate,
}: SendToMakeDialogProps) {
  const [companyName, setCompanyName] = useState("")
  const [contactName, setContactName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (!companyName.trim() || !contactName.trim() || !email.trim()) {
      setErrorMsg("Company name, contact name and email are required.")
      return
    }

    try {
      // Step 1: Generate the PDF from the print preview page
      setStatus("uploading")

      // Open the print preview in a hidden iframe to generate PDF via the browser
      // Instead, we'll call the upload-pdf endpoint which takes the report ID
      // and generates a PDF URL using Vercel Blob
      const uploadRes = await fetch("/api/upload-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      })

      if (!uploadRes.ok) {
        const data = await uploadRes.json()
        throw new Error(data.error || "Failed to upload PDF")
      }

      const { url: pdfUrl } = await uploadRes.json()

      // Step 2: Send data to Make.com webhook
      setStatus("sending")

      const sendRes = await fetch("/api/send-to-make", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          contactName: contactName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          reportUrl,
          reportScore,
          reportDate,
          reportId,
          pdfUrl,
        }),
      })

      if (!sendRes.ok) {
        const data = await sendRes.json()
        throw new Error(data.error || "Failed to send to Make.com")
      }

      setStatus("success")
    } catch (err) {
      setStatus("error")
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  const handleClose = () => {
    if (status !== "uploading" && status !== "sending") {
      setStatus("idle")
      setErrorMsg("")
      onOpenChange(false)
    }
  }

  const isSubmitting = status === "uploading" || status === "sending"

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Send to Drive & Notion</DialogTitle>
          <DialogDescription>
            Add client details. The PDF will be uploaded to Google Drive and a record created in Notion via Make.com.
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            <p className="text-sm font-medium text-foreground">Sent successfully</p>
            <p className="text-xs text-muted-foreground text-center">
              The PDF has been uploaded and client details sent to Make.com.
            </p>
            <Button variant="outline" onClick={handleClose} className="mt-2">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="companyName">Company name *</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Ltd"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="contactName">Contact name *</Label>
              <Input
                id="contactName"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Jane Smith"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@acme.com"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+44 7700 900000"
                disabled={isSubmitting}
              />
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{errorMsg}</p>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {status === "uploading" ? "Uploading PDF..." : "Sending..."}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
