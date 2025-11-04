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
      sm: {
        container: "w-12 h-12",
        dots: "w-2 h-2",
        orbit: "w-8 h-8",
      },
      md: {
        container: "w-20 h-20",
        dots: "w-3 h-3",
        orbit: "w-14 h-14",
      },
      lg: {
        container: "w-32 h-32",
        dots: "w-4 h-4",
        orbit: "w-24 h-24",
      },
    };

    const containerClasses = fullScreen
      ? "fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md"
      : "flex items-center justify-center py-12";

    return (
      <div className={containerClasses}>
        <div className="flex flex-col items-center gap-6">
          {/* Animated Loader */}
          <div className={`relative ${sizeClasses[size].container}`}>
            {/* Outer rotating ring */}
            <div
              className={`absolute inset-0 rounded-full border-2 border-transparent border-t-primary-100 border-r-primary-100 loader-ring-outer`}
            />

            {/* Middle rotating ring */}
            <div
              className={`absolute inset-2 rounded-full border-2 border-transparent border-b-primary-200 border-l-primary-200 loader-ring-middle`}
            />

            {/* Inner pulsing circle */}
            <div
              className={`absolute inset-4 rounded-full bg-linear-to-r from-primary-100 to-primary-200 animate-pulse opacity-30`}
            />

            {/* Orbiting dots */}
            <div
              className={`absolute inset-0 flex items-center justify-center loader-orbit`}
            >
              <div className={`absolute ${sizeClasses[size].orbit}`}>
                <div
                  className={`absolute top-0 left-1/2 -translate-x-1/2 ${sizeClasses[size].dots} bg-primary-100 rounded-full shadow-lg shadow-primary-100/50`}
                />
                <div
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 ${sizeClasses[size].dots} bg-primary-200 rounded-full shadow-lg shadow-primary-200/50`}
                />
                <div
                  className={`absolute left-0 top-1/2 -translate-y-1/2 ${sizeClasses[size].dots} bg-primary-100 rounded-full shadow-lg shadow-primary-100/50`}
                />
                <div
                  className={`absolute right-0 top-1/2 -translate-y-1/2 ${sizeClasses[size].dots} bg-primary-200 rounded-full shadow-lg shadow-primary-200/50`}
                />
              </div>
            </div>

            {/* Center glow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`${sizeClasses[size].dots} bg-white rounded-full animate-ping`}
              />
            </div>
          </div>

          {/* Loading text with animation */}
          {text && (
            <div className="relative">
              <p className="text-sm md:text-base font-medium text-muted-foreground text-center px-4">
                {text}
              </p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <span className="w-1.5 h-1.5 bg-primary-100 rounded-full loader-dot-1" />
                <span className="w-1.5 h-1.5 bg-primary-200 rounded-full loader-dot-2" />
                <span className="w-1.5 h-1.5 bg-primary-100 rounded-full loader-dot-3" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

Loader.displayName = "Loader";

export default Loader;
