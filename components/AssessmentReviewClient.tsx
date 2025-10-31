"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Question = {
  id: string;
  index: number;
  category: "quants" | "logical" | "verbal";
  question: string;
  options: string[];
  correctAnswer: string;
};

const AssessmentReviewClient = memo(function AssessmentReviewClient() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanations, setLoadingExplanations] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("assessmentReview");
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        questions: Question[];
        selected: Record<string, string>;
      };
      setQuestions(parsed.questions || []);
      setSelected(parsed.selected || {});
    } catch {}
  }, []);

  const handleExplain = async (q: Question) => {
    if (explanations[q.id]) {
      // Toggle off if already shown
      setExplanations((prev) => {
        const newExplanations = { ...prev };
        delete newExplanations[q.id];
        return newExplanations;
      });
      return;
    }

    setLoadingExplanations((prev) => ({ ...prev, [q.id]: true }));

    try {
      const response = await fetch("/api/assessment/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.question,
          correctAnswer: q.correctAnswer,
          userAnswer: selected[q.id],
          options: q.options,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate explanation");
      }

      const data = await response.json();
      setExplanations((prev) => ({ ...prev, [q.id]: data.explanation }));
    } catch (error) {
      console.error("Error fetching explanation:", error);
      toast.error("Failed to generate explanation. Please try again.");
    } finally {
      setLoadingExplanations((prev) => ({ ...prev, [q.id]: false }));
    }
  };

  if (!questions.length) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No review data found. Please take an assessment first.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-foreground">
      {questions.map((q, idx) => {
        const userChoice = selected[q.id];
        const isCorrect = userChoice === q.correctAnswer;
        return (
          <div key={q.id} className="rounded-md border p-4">
            <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Question {idx + 1} ({q.category})
              </span>
              <span
                className={
                  "px-2 py-0.5 rounded-full font-medium " +
                  (userChoice
                    ? isCorrect
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-700")
                }
              >
                {userChoice
                  ? isCorrect
                    ? "Correct"
                    : "Incorrect"
                  : "Not Attempted"}
              </span>
            </div>
            <p className="mb-3 text-base text-foreground">{q.question}</p>
            <div className="flex flex-col gap-2">
              {q.options.map((opt, optIdx) => {
                const isUser = userChoice === opt;
                const isAns = q.correctAnswer === opt;
                return (
                  <div
                    key={`${q.id}-${optIdx}`}
                    className={
                      "rounded-md border px-3 py-2 " +
                      (isAns
                        ? "border-green-500 bg-green-50 text-green-900"
                        : isUser
                        ? "border-red-500 bg-red-50 text-red-900"
                        : "border-muted bg-muted/40 text-foreground")
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{opt}</span>
                      <div
                        className={
                          "text-xs " +
                          (isAns
                            ? "text-green-800"
                            : isUser
                            ? "text-red-800"
                            : "text-muted-foreground")
                        }
                      >
                        {isAns ? "Correct answer" : isUser ? "Your choice" : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explain Button */}
            <div className="mt-4">
              <Button
                onClick={() => handleExplain(q)}
                variant="outline"
                size="sm"
                disabled={loadingExplanations[q.id]}
                className="w-full sm:w-auto"
              >
                {loadingExplanations[q.id]
                  ? "Generating..."
                  : explanations[q.id]
                  ? "Hide Explanation"
                  : "Explain How"}
              </Button>
            </div>

            {/* Explanation Display */}
            {explanations[q.id] && (
              <div className="mt-3 rounded-md bg-blue-50 border border-blue-200 p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  Explanation:
                </h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  {explanations[q.id]}
                </p>
              </div>
            )}
          </div>
        );
      })}

      <div className="flex justify-end">
        <Button onClick={() => window.history.back()} variant="secondary">
          Back
        </Button>
      </div>
    </div>
  );
});

export default AssessmentReviewClient;
