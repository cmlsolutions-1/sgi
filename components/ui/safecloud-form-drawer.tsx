"use client"

import { Children, cloneElement, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from "react"

import { cn } from "@/lib/utils"
import { DialogContent, DialogFooter, DialogHeader, DialogTrigger } from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type SafeCloudFormDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger?: ReactNode
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
  formProps?: Omit<ComponentProps<"form">, "children">
  contentClassName?: string
  bodyClassName?: string
  footerClassName?: string
}

type SafeCloudFormDrawerFrameProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger?: ReactNode
  children: ReactNode
}

type SafeCloudFormDrawerAdapterProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

const drawerContentClassName = cn(
  "h-dvh w-full max-w-none gap-0 overflow-hidden border-l border-slate-200 bg-white p-0 shadow-2xl",
  "duration-300 data-[state=open]:duration-300 motion-reduce:animate-none motion-reduce:transition-none",
  "sm:w-[min(540px,100vw)] sm:max-w-[540px]",
)

function SafeCloudDrawerContent({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <SheetContent
      side="right"
      closeLabel="Cerrar panel"
      closeButtonClassName="top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))]"
      className={cn(className, drawerContentClassName)}
    >
      {children}
    </SheetContent>
  )
}

/**
 * Compositional entry point for existing forms that already own their header,
 * scroll region and footer. It shares the exact same Drawer surface.
 */
export function SafeCloudFormDrawerFrame({
  open,
  onOpenChange,
  trigger,
  children,
}: SafeCloudFormDrawerFrameProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger ? <SheetTrigger asChild>{trigger}</SheetTrigger> : null}
      <SafeCloudDrawerContent>{children}</SafeCloudDrawerContent>
    </Sheet>
  )
}

/**
 * Compatibility bridge for existing DialogTrigger + DialogContent composition.
 * It unwraps those presentational nodes and mounts their untouched children in
 * the shared SafeCloud Drawer surface.
 */
export function SafeCloudFormDrawerAdapter({
  open,
  onOpenChange,
  children,
}: SafeCloudFormDrawerAdapterProps) {
  let trigger: ReactNode
  let content: ReactNode

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    const element = child as ReactElement<{ children?: ReactNode }>
    if (element.type === DialogTrigger) trigger = element.props.children
    if (element.type === DialogContent) content = element.props.children
  })

  const normalizeSection = (node: ReactElement<{ className?: string }>, section: "header" | "footer") => cloneElement(node, {
    className: cn(
      section === "header"
        ? "shrink-0 border-b border-slate-200 bg-slate-50/75 px-6 py-4 pr-14"
        : "shrink-0 border-t border-slate-200 bg-white px-6 py-4",
      node.props.className,
    ),
  })

  const arrangeContent = (nodes: ReactNode) => {
    const parts = Children.toArray(nodes)
    const header = parts.find((part) => isValidElement(part) && part.type === DialogHeader)
    const footer = parts.find((part) => isValidElement(part) && part.type === DialogFooter)
    const body = parts.filter((part) => part !== header && part !== footer)

    return (
      <>
        {isValidElement(header) ? normalizeSection(header as ReactElement<{ className?: string }>, "header") : null}
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-5">{body}</div>
        {isValidElement(footer) ? normalizeSection(footer as ReactElement<{ className?: string }>, "footer") : null}
      </>
    )
  }

  let arrangedContent = content
  const contentParts = Children.toArray(content)
  if (contentParts.length === 1 && isValidElement(contentParts[0]) && contentParts[0].type === "form") {
    const form = contentParts[0] as ReactElement<ComponentProps<"form">>
    arrangedContent = cloneElement(
      form,
      { className: cn("flex min-h-0 flex-1 flex-col overflow-hidden", form.props.className) },
      arrangeContent(form.props.children),
    )
  } else {
    arrangedContent = arrangeContent(content)
  }

  return (
    <SafeCloudFormDrawerFrame open={open} onOpenChange={onOpenChange} trigger={trigger}>
      {arrangedContent}
    </SafeCloudFormDrawerFrame>
  )
}

/**
 * Presentation shell for create/edit forms. Business logic and form state stay
 * in the owning module; this component only standardizes layout and behavior.
 */
export function SafeCloudFormDrawer({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  icon,
  children,
  footer,
  formProps,
  contentClassName,
  bodyClassName,
  footerClassName,
}: SafeCloudFormDrawerProps) {
  const { className: formClassName, ...formAttributes } = formProps ?? {}

  const drawerBody = (
    <>
      <div
        className={cn(
          "min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-slate-50/45 py-5 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] sm:px-6",
          bodyClassName,
        )}
      >
        {children}
      </div>

      {footer ? (
        <div
          className={cn(
            "shrink-0 border-t border-slate-200 bg-white pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4",
            footerClassName,
          )}
        >
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {footer}
          </div>
        </div>
      ) : null}
    </>
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger ? <SheetTrigger asChild>{trigger}</SheetTrigger> : null}
      <SafeCloudDrawerContent className={contentClassName}>
        <SheetHeader className="shrink-0 border-b border-slate-200 bg-slate-50/75 pt-[max(1rem,env(safe-area-inset-top))] pr-[max(3.5rem,calc(env(safe-area-inset-right)+3rem))] pb-4 pl-[max(1rem,env(safe-area-inset-left))] text-left sm:px-6 sm:pr-14">
          <div className="flex min-w-0 items-start gap-3">
            {icon ? <div className="shrink-0">{icon}</div> : null}
            <div className="min-w-0">
              <SheetTitle className="text-base leading-6 text-slate-950 sm:text-lg">
                {title}
              </SheetTitle>
              {description ? (
                <SheetDescription className="mt-1 leading-5 text-slate-600">
                  {description}
                </SheetDescription>
              ) : null}
            </div>
          </div>
        </SheetHeader>

        {formProps ? (
          <form
            {...formAttributes}
            className={cn("flex min-h-0 flex-1 flex-col", formClassName)}
          >
            {drawerBody}
          </form>
        ) : (
          drawerBody
        )}
      </SafeCloudDrawerContent>
    </Sheet>
  )
}
