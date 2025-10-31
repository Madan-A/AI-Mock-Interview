"use client";

import { memo } from "react";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

const Loader = memo(
  ({ size = "md", text, fullScreen = false }: LoaderProps) => {
    const sizeClasses = {
      sm: "w-6 h-6 border-2",
      md: "w-10 h-10 border-3",
      lg: "w-16 h-16 border-4",
    };

    const containerClasses = fullScreen
      ? "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      : "flex items-center justify-center py-12";

    return (
      <div className={containerClasses}>
        <div className="flex flex-col items-center gap-4">
          <div
            className={`${sizeClasses[size]} border-primary-100 border-t-transparent rounded-full animate-spin`}
          />
          {text && (
            <p className="text-sm text-muted-foreground animate-pulse">
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Loader.displayName = "Loader";

export default Loader;
