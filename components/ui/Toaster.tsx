

import { useToast } from "../../hooks/use-toast";
import React from 'react';
import { X } from 'lucide-react';

const Toast = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'destructive' }
>(({ className, variant, ...props }, ref) => {
  const variants = {
    default: "border bg-background text-foreground",
    destructive: "destructive group border-destructive bg-destructive text-destructive-foreground",
  };
  return (
    <div
      ref={ref}
      className={`${variants[variant || 'default']} pointer-events-auto w-full overflow-hidden rounded-md shadow-lg ring-1 ring-black ring-opacity-5 ${className}`}
      {...props}
    />
  );
});
Toast.displayName = "Toast";

const ToastTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={`text-sm font-semibold ${className}`} {...props} />
));
ToastTitle.displayName = "ToastTitle";

const ToastDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={`text-sm opacity-90 ${className}`} {...props} />
));
ToastDescription.displayName = "ToastDescription";

type ToastCloseProps = React.HTMLAttributes<HTMLButtonElement>;

const ToastClose = React.forwardRef<HTMLButtonElement, ToastCloseProps>(
  ({ className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={`absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600 ${className}`}
        {...props}
      >
        <X className="h-4 w-4" />
      </button>
    );
  }
);
ToastClose.displayName = "ToastClose";


export function Toaster() {
  const { toasts } = useToast()

  return (
    <div
      className="fixed bottom-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:right-0 sm:top-auto sm:left-auto sm:w-auto sm:flex-col md:max-w-[420px]"
    >
      {toasts.map(function ({ id, title, description, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1 p-4">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            <ToastClose />
          </Toast>
        )
      })}
    </div>
  )
}