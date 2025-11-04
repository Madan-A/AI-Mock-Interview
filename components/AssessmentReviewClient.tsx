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

type CodingQuestion = {
  title: string;
  description: string;
  difficulty: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints: string[];
  testCases: Array<{ input: string; expectedOutput: string }>;
};

type CodingFeedback = {
  questions: Array<{
    questionNumber: number;
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  }>;
  totalScore: number;
  maxScore: number;
  percentage: number;
  overallFeedback: string;
};

const AssessmentReviewClient = memo(function AssessmentReviewClient() {
  const [assessmentType, setAssessmentType] = useState<"mcq" | "coding" | null>(
    null
  );
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanations, setLoadingExplanations] = useState<
    Record<string, boolean>
  >({});

  // Coding assessment state
  const [codingQuestions, setCodingQuestions] = useState<CodingQuestion[]>([]);
  const [codingLanguage, setCodingLanguage] = useState<string>("");
  const [codingScore, setCodingScore] = useState<number>(0);
  const [codingTotalScore, setCodingTotalScore] = useState<number>(0);
  const [codingFeedback, setCodingFeedback] = useState<CodingFeedback | null>(
    null
  );
  const [submittedCodes, setSubmittedCodes] = useState<Record<number, string>>(
    {}
  );

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("assessmentReview");
      if (!raw) return;
      const parsed = JSON.parse(raw);

      // Check if it's coding assessment or MCQ
      if (parsed.type === "coding") {
        setAssessmentType("coding");
        setCodingQuestions(parsed.questions || []);
        setCodingLanguage(parsed.language || "");
        setCodingScore(parsed.score || 0);
        setCodingTotalScore(parsed.totalScore || 0);
        setCodingFeedback(parsed.feedback || null);
        setSubmittedCodes(parsed.submittedCodes || {});
      } else {
        setAssessmentType("mcq");
        setQuestions(parsed.questions || []);
        setSelected(parsed.selected || {});
      }
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

  if (!assessmentType) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No review data found. Please take an assessment first.
      </div>
    );
  }

  // Render Coding Assessment Review
  if (assessmentType === "coding") {
    return (
      <div className="flex flex-col gap-6 text-foreground">
        {/* Score Card */}
        <div className="bg-linear-to-r from-primary-100/20 to-primary-200/20 border-2 border-primary-100/50 rounded-xl p-8 text-center">
          <h2 className="text-3xl font-bold mb-3">Assessment Results</h2>
          <div className="flex items-center justify-center gap-8 mb-4">
            <div>
              <p className="text-6xl font-bold text-primary-100">
                {codingScore}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                out of {codingTotalScore}
              </p>
            </div>
            <div className="text-left">
              <div className="text-4xl font-bold text-green-400">
                {codingFeedback?.percentage || 0}%
              </div>
              <p className="text-sm text-muted-foreground">Accuracy</p>
            </div>
          </div>
          <p className="text-base text-light-100 max-w-2xl mx-auto">
            {codingFeedback?.overallFeedback ||
              "Great effort on completing the assessment!"}
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="px-4 py-2 bg-primary-100/20 text-primary-100 rounded-full font-medium text-sm">
              {codingQuestions.length} Questions Completed
            </span>
            <span className="px-4 py-2 bg-dark-200 text-light-100 rounded-full font-medium text-sm">
              Language: {codingLanguage}
            </span>
          </div>
        </div>

        {/* Detailed Feedback per Question */}
        {codingFeedback?.questions?.map((feedback, idx) => {
          const question = codingQuestions[idx];
          const submittedCode = submittedCodes[idx];

          return (
            <div
              key={idx}
              className="rounded-lg border-2 border-dark-300 bg-dark-200/50 overflow-hidden"
            >
              {/* Question Header */}
              <div className="bg-dark-300/70 p-4 border-b border-dark-300">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold">
                    Question {feedback.questionNumber}: {question.title}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        question.difficulty === "Easy"
                          ? "bg-green-500/20 text-green-400"
                          : question.difficulty === "Medium"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {question.difficulty}
                    </span>
                    <span className="px-4 py-1 rounded-full text-lg font-bold bg-primary-100/20 text-primary-100">
                      {feedback.score}/100
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Submitted Code */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-primary-100">
                    Your Code:
                  </h4>
                  <div className="bg-dark-300 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-xs text-light-100 font-mono">
                      {submittedCode || "// No code submitted"}
                    </pre>
                  </div>
                </div>

                {/* Feedback */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-2 text-blue-400">
                    Feedback:
                  </h4>
                  <p className="text-sm text-light-100">{feedback.feedback}</p>
                </div>

                {/* Strengths */}
                {feedback.strengths && feedback.strengths.length > 0 && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <h4 className="text-sm font-semibold mb-2 text-green-400">
                      ✓ Strengths:
                    </h4>
                    <ul className="list-disc list-inside text-sm text-light-100 space-y-1">
                      {feedback.strengths.map((strength, sIdx) => (
                        <li key={sIdx}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {feedback.improvements && feedback.improvements.length > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <h4 className="text-sm font-semibold mb-2 text-yellow-400">
                      ⚡ Areas for Improvement:
                    </h4>
                    <ul className="list-disc list-inside text-sm text-light-100 space-y-1">
                      {feedback.improvements.map((improvement, iIdx) => (
                        <li key={iIdx}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4">
          <Button
            onClick={() => (window.location.href = "/assessment")}
            variant="outline"
          >
            Take Another Assessment
          </Button>
          <Button
            onClick={() => (window.location.href = "/dashboard")}
            className="btn-primary"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Render MCQ Assessment Review
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
