"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Loader from "@/components/Loader";
import CodingAssessmentClient from "@/components/CodingAssessmentClient";

type Question = {
  id: string;
  index: number;
  category: "quants" | "logical" | "verbal" | "os" | "dbms" | "cn" | "dsa";
  question: string;
  options: string[];
  correctAnswer: string;
};

const TEST_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const TOTAL_QUESTIONS = 30; // Total questions for both aptitude and technical
const PER_PAGE = 5; // Fetch 5 questions at a time

function generateSessionId() {
  return `assess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function AssessmentClient({
  section = "aptitude",
}: {
  section?: "aptitude" | "technical" | "coding";
}) {
  // If it's a coding assessment, render the coding component
  if (section === "coding") {
    return <CodingAssessmentClient />;
  }

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [remainingMs, setRemainingMs] = useState<number>(TEST_DURATION_MS);
  const [submitted, setSubmitted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const submittedRef = useRef(false);
  const sessionIdRef = useRef<string>(generateSessionId());
  const [currentPage, setCurrentPage] = useState(1);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const hasFetchedPage = useRef<Set<number>>(new Set());
  const isPreparingNextPage = useRef<boolean>(false);

  const enterFullscreen = useCallback(async () => {
    try {
      // Try to enter fullscreen but don't rely on it
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {
          console.log("Fullscreen not supported or denied");
        });
        setIsFullscreen(true);
      }
    } catch (error) {
      console.log("Fullscreen error:", error);
    }

    // Start assessment regardless of fullscreen success
    setHasStarted(true);
    startTimeRef.current = Date.now();
    setRemainingMs(TEST_DURATION_MS);
    toast.success(
      "Assessment started! Don't switch tabs (3 strikes = auto-submit)"
    );
  }, []);

  // Fetch questions page by page
  const fetchQuestionsPage = useCallback(
    async (page: number) => {
      if (hasFetchedPage.current.has(page)) return;
      hasFetchedPage.current.add(page);
      try {
        const res = await fetch(
          `/api/assessment/generate-questions?section=${section}&page=${page}&perPage=${PER_PAGE}&sessionId=${sessionIdRef.current}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          questions: Question[];
          total: number;
        };

        setQuestions((prev) => {
          // Merge new questions with existing
          const merged = [...prev, ...data.questions];

          // Save ALL questions to localStorage immediately
          const cacheKey = `assessment-questions-${sessionIdRef.current}`;
          try {
            localStorage.setItem(cacheKey, JSON.stringify(merged));
          } catch (e) {
            console.error("Failed to save to localStorage:", e);
          }

          return merged;
        });
      } catch (err) {
        console.error("Error fetching questions page:", err);
      }
    },
    [section]
  );

  // Initial load: fetch first page (no cache check for fresh questions)
  useEffect(() => {
    // Fetch first page - always fresh from Gemini
    (async () => {
      toast.info("Generating fresh questions using AI...", { duration: 3000 });
      await fetchQuestionsPage(1);
      setIsLoading(false);

      // Immediately start fetching page 2 in background
      if (!hasFetchedPage.current.has(2)) {
        setIsFetchingNext(true);
        isPreparingNextPage.current = true;
        fetchQuestionsPage(2).finally(() => {
          setIsFetchingNext(false);
          isPreparingNextPage.current = false;
        });
      }
    })();
  }, [section, fetchQuestionsPage]);

  // Background prefetch: when user is on Q1, Q6, Q11, Q16, Q21, Q26 (first of each batch), fetch next page
  useEffect(() => {
    if (isLoading || !hasStarted) return;
    // Check if current question is the first of its page batch (0-indexed: 0, 5, 10, 15, 20, 25)
    if (
      currentIndex % PER_PAGE === 0 &&
      currentIndex > 0 &&
      questions.length < TOTAL_QUESTIONS
    ) {
      const nextPage = Math.floor(currentIndex / PER_PAGE) + 2;
      if (!hasFetchedPage.current.has(nextPage) && !isFetchingNext) {
        setIsFetchingNext(true);
        isPreparingNextPage.current = true;
        fetchQuestionsPage(nextPage).finally(() => {
          setIsFetchingNext(false);
          isPreparingNextPage.current = false;
        });
      }
    }
  }, [
    currentIndex,
    isLoading,
    hasStarted,
    questions.length,
    fetchQuestionsPage,
    isFetchingNext,
  ]);

  // Auto-enter fullscreen when questions load
  useEffect(() => {
    // Wait for questions to load before entering fullscreen
    if (!isLoading && questions.length > 0 && !hasStarted) {
      // Add a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        enterFullscreen();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, questions.length, hasStarted, enterFullscreen]);

  // Handle tab switch detection - auto-submit after 3 switches
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasStarted && !submittedRef.current) {
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;

          if (newCount >= 3) {
            toast.error(
              "3 tab switches detected! Auto-submitting assessment..."
            );
            setShouldAutoSubmit(true);
          } else {
            toast.warning(
              `Tab switch detected! ${newCount}/3 strikes. (${
                3 - newCount
              } remaining)`
            );
          }

          return newCount;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Exit fullscreen on unmount if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [hasStarted]);

  // Auto-submit when shouldAutoSubmit is triggered
  useEffect(() => {
    if (shouldAutoSubmit && !submittedRef.current) {
      const timer = setTimeout(() => {
        // We'll call submit via ref
        submitRef.current?.();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoSubmit]);

  const submitRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (submitted || !hasStarted) return;
    const id = setInterval(() => {
      if (startTimeRef.current == null) return;
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, TEST_DURATION_MS - elapsed);
      setRemainingMs(remaining);
      if (remaining === 0) {
        clearInterval(id);
        submitRef.current?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [submitted, hasStarted]);

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
    setCurrentIndex((i) => Math.min(i + 1, TOTAL_QUESTIONS - 1));
  }, []);

  const prev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitted(true);
    setIsSubmitting(true);

    // Exit fullscreen
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Error exiting fullscreen:", error);
    }

    // If we don't have all 30 questions yet, fetch them all before submitting
    let allQuestions = [...questions];
    if (allQuestions.length < TOTAL_QUESTIONS) {
      console.log("Fetching remaining questions for review...");
      const totalPages = Math.ceil(TOTAL_QUESTIONS / PER_PAGE);
      const currentPages = Math.ceil(allQuestions.length / PER_PAGE);

      // Fetch all remaining pages
      for (let page = currentPages + 1; page <= totalPages; page++) {
        if (!hasFetchedPage.current.has(page)) {
          try {
            const response = await fetch(
              `/api/assessment/generate-questions?section=${section}&page=${page}&perPage=${PER_PAGE}&sessionId=${sessionIdRef.current}`
            );
            if (response.ok) {
              const data = await response.json();
              if (data.questions && Array.isArray(data.questions)) {
                allQuestions = [...allQuestions, ...data.questions];
                hasFetchedPage.current.add(page);
              }
            }
          } catch (error) {
            console.error(`Error fetching page ${page}:`, error);
          }
        }
      }
      console.log("Total questions fetched for review:", allQuestions.length);
    }

    const attempted = Object.keys(selected).length;
    let correct = 0;
    for (const q of allQuestions) {
      if (selected[q.id] && selected[q.id] === q.correctAnswer) correct++;
    }

    console.log(
      "Submitting assessment with questions count:",
      allQuestions.length
    );
    console.log("Total questions should be:", TOTAL_QUESTIONS);

    // Save assessment result to user profile
    try {
      await fetch("/api/assessment/save-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: correct,
          total: TOTAL_QUESTIONS,
          attempted,
          section,
        }),
      });
    } catch (error) {
      console.error("Error saving assessment result:", error);
    }

    // Persist ALL 30 questions for review page (not just answered ones)
    try {
      const payload = {
        questions: allQuestions,
        selected,
        completedAt: Date.now(),
        sessionId: sessionIdRef.current,
      };
      sessionStorage.setItem("assessmentReview", JSON.stringify(payload));
      console.log(
        "Saved to sessionStorage, questions count:",
        allQuestions.length
      );

      // Also save to localStorage as backup
      const cacheKey = `assessment-questions-${sessionIdRef.current}`;
      localStorage.setItem(cacheKey, JSON.stringify(allQuestions));
    } catch {}

    const params = new URLSearchParams({
      attempted: String(attempted),
      correct: String(correct),
      score: String(correct),
      total: String(TOTAL_QUESTIONS),
    });

    // Add small delay to show loader before redirect
    await new Promise((resolve) => setTimeout(resolve, 500));
    window.location.href = `/assessment/result?${params.toString()}`;
  }, [selected, questions, section, fetchQuestionsPage]);

  // Assign handleSubmit to ref so it can be called from effects
  useEffect(() => {
    submitRef.current = handleSubmit;
  }, [handleSubmit]);

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

  // Show submitting loader
  if (isSubmitting) {
    return (
      <Loader
        size="lg"
        text="Preparing your review... Fetching all questions..."
        fullScreen={true}
      />
    );
  }

  // Show start button before starting assessment
  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16">
        <h2 className="text-2xl font-bold">Ready to Start Assessment?</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You have {Math.floor(TEST_DURATION_MS / 60000)} minutes to complete{" "}
          {TOTAL_QUESTIONS} questions.
          <br />
          <strong className="text-destructive">Warning:</strong> Switching tabs
          3 times will automatically submit your test.
        </p>
        <Button onClick={enterFullscreen} className="btn-primary" size="lg">
          Start Assessment
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-6">
      <div className="flex items-center justify-between p-4 rounded-md border">
        <h2 className="text-xl font-semibold">Assessment</h2>
        <div className="flex items-center gap-4">
          <div
            className={`text-sm font-medium ${
              tabSwitchCount > 0 ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            Tab Switches: {tabSwitchCount}/3
          </div>
          <div className="text-lg font-mono">Time: {formattedTime}</div>
        </div>
      </div>

      {q ? (
        <div className="p-4 rounded-md border">
          <div className="mb-3 text-sm text-muted-foreground">
            Question {currentIndex + 1} of {TOTAL_QUESTIONS} ({q.category})
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
          onClick={(e) => {
            if (isFetchingNext && currentIndex >= questions.length - 1) {
              e.preventDefault();
              return;
            }
            next();
          }}
          disabled={
            currentIndex >= TOTAL_QUESTIONS - 1 ||
            (currentIndex >= questions.length - 1 && !isFetchingNext)
          }
          className={
            isFetchingNext && currentIndex >= questions.length - 1
              ? "cursor-wait"
              : ""
          }
        >
          {isFetchingNext && currentIndex >= questions.length - 1 ? (
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
              Loading next questions...
            </span>
          ) : (
            "Next"
          )}
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
