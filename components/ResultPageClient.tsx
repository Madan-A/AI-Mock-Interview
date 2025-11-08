"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type ResultPageClientProps = {
  attempted: number;
  correct: number;
  score: number;
  total: number;
};

export default function ResultPageClient({
  attempted,
  correct,
  score,
  total,
}: ResultPageClientProps) {
  const router = useRouter();
  const [isLoadingReview, setIsLoadingReview] = useState(false);

  const handleReviewClick = () => {
    setIsLoadingReview(true);
    router.push("/assessment/review");
  };

  return (
    <div className="container mx-auto max-w-2xl py-10">
      <h1 className="text-2xl font-semibold mb-6">Assessment Result</h1>
      <div className="grid grid-cols-2 gap-4 p-6 rounded-md border">
        <div>
          <div className="text-sm text-muted-foreground">Total Questions</div>
          <div className="text-xl font-medium">{total}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Attempted</div>
          <div className="text-xl font-medium">{attempted}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Correct</div>
          <div className="text-xl font-medium">{correct}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Final Score</div>
          <div className="text-2xl font-semibold">
            {score} / {total}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <Button
          className="btn-primary"
          onClick={handleReviewClick}
          disabled={isLoadingReview}
        >
          {isLoadingReview ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading Review...
            </span>
          ) : (
            "Review Answers"
          )}
        </Button>
      </div>
    </div>
  );
}
