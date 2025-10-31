"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Loader from "@/components/Loader";

type Question = {
  id: string;
  index: number;
  category: "quants" | "logical" | "verbal" | "os" | "dbms" | "cn" | "dsa";
  question: string;
  options: string[];
  correctAnswer: string;
};

const TEST_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export default function AssessmentClient({
  section = "aptitude",
}: {
  section?: "aptitude" | "technical";
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [remainingMs, setRemainingMs] = useState<number>(TEST_DURATION_MS);
  const [submitted, setSubmitted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const startTimeRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Enter fullscreen on component mount
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (
          containerRef.current &&
          document.documentElement.requestFullscreen
        ) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
          toast.success("Assessment started in fullscreen mode");
        }
      } catch (error) {
        console.error("Error entering fullscreen:", error);
        toast.error("Could not enter fullscreen mode");
      }
    };

    enterFullscreen();

    // Handle fullscreen change - auto-submit if user exits fullscreen
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !submitted) {
        toast.warning("Exiting fullscreen. Submitting assessment...");
        setIsFullscreen(false);
        // Auto-submit when exiting fullscreen
        setTimeout(() => {
          if (!submitted) {
            handleSubmit();
          }
        }, 1000);
      } else if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      // Exit fullscreen on unmount
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
  }, [submitted]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/assessment/questions?section=${section}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { questions: Question[] };
      if (!cancelled) {
        setQuestions(data.questions);
        startTimeRef.current = Date.now();
        setRemainingMs(TEST_DURATION_MS);
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [section]);

  useEffect(() => {
    if (submitted) return;
    const id = setInterval(() => {
      if (startTimeRef.current == null) return;
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, TEST_DURATION_MS - elapsed);
      setRemainingMs(remaining);
      if (remaining === 0) {
        clearInterval(id);
        handleSubmit();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [submitted]);

  const formattedTime = useMemo(() => {
    const totalSec = Math.ceil(remainingMs / 1000);
    const m = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, "0");
    const s = (totalSec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [remainingMs]);

  const onSelect = useCallback(
    (option: string) => {
      const q = questions[currentIndex];
      if (!q) return;
      setSelected((prev) => ({ ...prev, [q.id]: option }));
    },
    [questions, currentIndex]
  );

  const next = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, questions.length - 1));
  }, [questions.length]);

  const prev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);

    // Exit fullscreen
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Error exiting fullscreen:", error);
    }

    const attempted = Object.keys(selected).length;
    let correct = 0;
    for (const q of questions) {
      if (selected[q.id] && selected[q.id] === q.correctAnswer) correct++;
    }

    // Save assessment result to user profile
    try {
      await fetch("/api/assessment/save-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: correct,
          total: questions.length,
          attempted,
          section,
        }),
      });
    } catch (error) {
      console.error("Error saving assessment result:", error);
    }

    // Persist for review page
    try {
      const payload = {
        questions,
        selected,
        completedAt: Date.now(),
      };
      sessionStorage.setItem("assessmentReview", JSON.stringify(payload));
    } catch {}
    const params = new URLSearchParams({
      attempted: String(attempted),
      correct: String(correct),
      score: String(correct),
      total: String(questions.length),
    });
    window.location.href = `/assessment/result?${params.toString()}`;
  }, [submitted, selected, questions, section]);

  const q = questions[currentIndex];

  // Show loader while loading questions
  if (isLoading || questions.length === 0) {
    return (
      <Loader
        size="lg"
        text="Loading assessment questions..."
        fullScreen={isFullscreen}
      />
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-6">
      <div className="flex items-center justify-between p-4 rounded-md border">
        <h2 className="text-xl font-semibold">Assessment</h2>
        <div className="text-lg font-mono">Time Remaining: {formattedTime}</div>
      </div>

      {q ? (
        <div className="p-4 rounded-md border">
          <div className="mb-3 text-sm text-muted-foreground">
            Question {currentIndex + 1} of {questions.length} ({q.category})
          </div>
          <p className="text-base mb-4">{q.question}</p>
          <div className="flex flex-col gap-3">
            {q.options.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  value={opt}
                  checked={selected[q.id] === opt}
                  onChange={() => onSelect(opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <div className="relative h-12 w-12">
            <svg
              className="animate-spin h-12 w-12 text-primary/80"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          </div>
          <div className="text-sm text-muted-foreground">
            Fetching questions...
          </div>
          <div className="h-2 w-40 rounded-full bg-muted overflow-hidden">
            <div className="h-full w-1/3 bg-primary/70 animate-[progress_1.4s_ease-in-out_infinite]"></div>
          </div>
          <style jsx>{`
            @keyframes progress {
              0% {
                transform: translateX(-100%);
              }
              50% {
                transform: translateX(50%);
              }
              100% {
                transform: translateX(200%);
              }
            }
          `}</style>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="secondary"
          onClick={prev}
          disabled={currentIndex === 0}
        >
          Previous
        </Button>
        <div className="flex-1" />
        <Button
          variant="secondary"
          onClick={next}
          disabled={currentIndex >= questions.length - 1}
        >
          Next
        </Button>
        <Button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={questions.length === 0}
        >
          Submit Test
        </Button>
      </div>
    </div>
  );
}
