import React from "react";
import { cn } from "../../lib/utils";

export const BackgroundGradient = ({
  children,
  className,
  containerClassName,
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) => {
  return (
    <div className={cn("relative", containerClassName)}>
      <div
        className={cn(
          "relative z-10 px-6 py-4 bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-700/50",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};