"use client"

/* eslint-disable @typescript-eslint/no-empty-object-type */
import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface DialogContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextType | null>(null)

function useDialog() {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error("Dialog components must be used within a Dialog")
  }
  return context
}

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Dialog = ({ open = false, onOpenChange, children }: DialogProps) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange: onOpenChange || (() => {}) }}>
      {children}
    </DialogContext.Provider>
  )
}

interface DialogOverlayProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogOverlay = React.forwardRef<HTMLDivElement, DialogOverlayProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  )
)
DialogOverlay.displayName = "DialogOverlay"

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open, onOpenChange } = useDialog()

    if (!open) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogOverlay onClick={() => onOpenChange(false)} />
        <div
          ref={ref}
          className={cn(
            "relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg",
            className
          )}
          {...props}
        >
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-8 w-8 p-0"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          {children}
        </div>
      </div>
    )
  }
)
DialogContent.displayName = "DialogContent"

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogHeader = ({ className, ...props }: DialogHeaderProps) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
)
DialogTitle.displayName = "DialogTitle"

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
)
DialogDescription.displayName = "DialogDescription"

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogFooter = ({ className, ...props }: DialogFooterProps) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
}