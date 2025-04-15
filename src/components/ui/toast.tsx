import * as React from "react";
import { cn } from "../../utils/utils";

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
}

export const Toast: React.FC<ToastProps> = ({
  header,
  description,
  action,
  variant = "default",
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "border p-4 rounded-md shadow-md flex flex-col gap-1",
        variant === "destructive" ? "border-red-500 bg-red-50 text-red-900" : "bg-white",
        className
      )}
      {...props}
    >
      {header && <div className="font-bold">{header}</div>}
      {description && <div className="text-sm">{description}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
