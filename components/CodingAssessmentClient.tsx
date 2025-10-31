"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import Loader from "@/components/Loader";

// Dynamic import Monaco Editor (client-side only)
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface TestCase {
  input: string;
  output: string;
  passed?: boolean;
}

interface CodingQuestion {
  id: number;
  title: string;
  difficulty: "Easy" | "Medium";
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  testCases: TestCase[];
}

const LANGUAGE_TEMPLATES: Record<string, string> = {
  javascript: `function solution(input) {
  // Your code here
  
  return result;
}`,
  python: `def solution(input):
    # Your code here
    
    return result`,
  java: `public class Solution {
    public static Object solution(Object input) {
        // Your code here
        
        return result;
    }
}`,
  cpp: `#include <iostream>
using namespace std;

auto solution(auto input) {
    // Your code here
    
    return result;
}`,
};

export default function CodingAssessmentClient() {
  const router = useRouter();
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestCase[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCodes, setSubmittedCodes] = useState<Record<number, string>>(
    {}
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const currentQuestion = questions[currentQuestionIndex];

  // Fetch questions from Gemini on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/assessment/coding-questions");
        const data = await response.json();

        setQuestions(data.questions);

        // Show toast if using fallback questions
        if (data.fallback) {
          toast.info(data.message || "Using sample questions", {
            duration: 5000,
          });
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
        toast.error("Failed to load questions. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  useEffect(() => {
    // Set initial code template
    setCode(LANGUAGE_TEMPLATES[language]);
  }, [language]);

  useEffect(() => {
    // Auto-enter fullscreen mode when questions load
    if (!isLoading && questions.length > 0 && !isFullscreen) {
      const timer = setTimeout(() => {
        setIsFullscreen(true);
        // Add fullscreen class to body to hide navbar/footer
        document.body.classList.add("coding-fullscreen-active");
        // Prevent scrolling
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, questions.length, isFullscreen]);

  useEffect(() => {
    // Cleanup: restore body styles on unmount
    return () => {
      document.body.classList.remove("coding-fullscreen-active");
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  const runCode = async () => {
    setIsRunning(true);
    setShowResults(false);

    try {
      const response = await fetch("/api/assessment/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          testCases: currentQuestion.testCases,
        }),
      });

      const data = await response.json();
      setTestResults(data.results);
      setShowResults(true);
    } catch (error) {
      console.error("Error running code:", error);
      alert("Error running code. Please try again.");
    } finally {
      setIsRunning(false);
    }
  };

  const switchQuestion = (index: number) => {
    if (index === currentQuestionIndex) return;

    // Save current code before switching
    setSubmittedCodes((prev) => ({
      ...prev,
      [currentQuestionIndex]: code,
    }));

    // Load saved code for the new question or use template
    const savedCode = submittedCodes[index];
    setCurrentQuestionIndex(index);
    setCode(savedCode || LANGUAGE_TEMPLATES[language]);
    setTestResults([]);
    setShowResults(false);
    toast.info(`Switched to Question ${index + 1}`);
  };

  const handleSubmit = async () => {
    // Save current code
    const allCodes = {
      ...submittedCodes,
      [currentQuestionIndex]: code,
    };

    setIsSubmitting(true);

    try {
      // Calculate score using Gemini
      const response = await fetch("/api/assessment/evaluate-coding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: questions,
          submittedCodes: allCodes,
          language: language,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to evaluate code");
      }

      const { score, feedback, totalScore } = await response.json();

      // Save assessment result to database for activity tracking
      try {
        const saveResponse = await fetch("/api/assessment/save-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score: score,
            total: totalScore,
            attempted: questions.length,
            section: "coding",
          }),
        });

        if (!saveResponse.ok) {
          console.error("Failed to save assessment result to database");
        }
      } catch (saveError) {
        console.error("Error saving assessment result:", saveError);
        // Continue even if saving fails
      }

      // Restore body styles and classes
      document.body.classList.remove("coding-fullscreen-active");
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";

      // Save coding assessment results to sessionStorage
      const codingResults = {
        type: "coding",
        questions: questions,
        submittedCodes: allCodes,
        language: language,
        score: score,
        totalScore: totalScore,
        feedback: feedback,
        timestamp: new Date().toISOString(),
      };

      sessionStorage.setItem("assessmentReview", JSON.stringify(codingResults));

      // Show success and redirect
      toast.success(`Assessment completed! Score: ${score}/${totalScore}`);
      router.push("/assessment/review");
    } catch (error) {
      console.error("Error evaluating code:", error);
      toast.error("Failed to evaluate assessment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" text="Loading coding questions..." />
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">No questions available. Please try again.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`coding-assessment-container ${
        isFullscreen
          ? "fixed inset-0 z-10001 w-screen h-screen m-0 p-0"
          : "w-full h-screen"
      } bg-dark-100 flex flex-col overflow-hidden`}
    >
      {/* Header - Clean & Modern */}
      <div className="coding-header">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary-100 animate-pulse"></div>
            <h2 className="text-base md:text-lg font-bold bg-gradient-to-r from-primary-100 to-primary-200 bg-clip-text text-transparent">
              Question {currentQuestionIndex + 1} / {questions.length}
            </h2>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
              currentQuestion.difficulty === "Easy"
                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}
          >
            {currentQuestion.difficulty}
          </span>

          {/* Question Navigation Pills */}
          <div className="flex gap-2 ml-auto">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => switchQuestion(index)}
                className={`w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
                  currentQuestionIndex === index
                    ? "bg-gradient-to-r from-primary-100 to-primary-200 text-dark-100 scale-110 shadow-lg shadow-primary-100/30"
                    : "bg-dark-300 text-light-100 hover:bg-dark-200 hover:scale-105"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          className="btn-primary text-sm px-6 py-2.5 rounded-xl shadow-lg hover:shadow-primary-100/30 transition-all duration-300"
          disabled={isRunning || isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Evaluating...
            </span>
          ) : (
            "Finish Assessment"
          )}
        </Button>
      </div>

      {/* Main Split Layout */}
      <div className="coding-split-layout">
        {/* Left Side - Problem Description */}
        <div className="problem-panel">
          <div className="problem-content">
            <h1 className="text-xl md:text-2xl font-bold mb-4 bg-gradient-to-r from-white to-light-100 bg-clip-text text-transparent">
              {currentQuestion.title}
            </h1>

            <div className="mb-6">
              <p className="text-sm md:text-base text-light-100 leading-relaxed">
                {currentQuestion.description}
              </p>
            </div>

            {/* Examples */}
            <div className="mb-6">
              <h3 className="text-base md:text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-primary-100 to-primary-200 rounded-full"></span>
                Examples
              </h3>
              <div className="space-y-3">
                {currentQuestion.examples.map((example, idx) => (
                  <div key={idx} className="example-box">
                    <div className="mb-2">
                      <span className="font-semibold text-primary-100 text-xs">
                        INPUT
                      </span>
                      <code className="code-inline block mt-1.5">
                        {example.input}
                      </code>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold text-primary-100 text-xs">
                        OUTPUT
                      </span>
                      <code className="code-inline block mt-1.5">
                        {example.output}
                      </code>
                    </div>
                    {example.explanation && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <span className="font-semibold text-xs text-light-100">
                          Explanation:{" "}
                        </span>
                        <span className="text-light-100/80 text-xs">
                          {example.explanation}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Constraints */}
            <div className="mb-6">
              <h3 className="text-base md:text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-primary-100 to-primary-200 rounded-full"></span>
                Constraints
              </h3>
              <ul className="constraints-list text-xs md:text-sm">
                {currentQuestion.constraints.map((constraint, idx) => (
                  <li key={idx}>{constraint}</li>
                ))}
              </ul>
            </div>

            {/* Test Results */}
            {showResults && (
              <div className="mt-6">
                <h3 className="text-base md:text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-gradient-to-b from-primary-100 to-primary-200 rounded-full"></span>
                  Test Results
                </h3>
                <div className="space-y-2.5">
                  {testResults.map((test, idx) => (
                    <div key={idx} className={`test-result text-sm`}>
                      <span className="font-semibold">Test {idx + 1}: </span>
                      <span className="ml-2">
                        {test.passed ? "✓ Passed" : "✗ Failed"}
                      </span>
                    </div>
                  ))}
                  <div className="mt-4 p-4 bg-gradient-to-r from-primary-100/10 to-primary-200/10 rounded-xl border border-primary-100/20">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">
                        Tests Passed
                      </span>
                      <span className="text-xl font-bold text-primary-100">
                        {testResults.filter((t) => t.passed).length} /{" "}
                        {testResults.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Monaco Code Editor */}
        <div className="editor-panel">
          <div className="editor-header">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-xs font-semibold text-light-100">
                Code Editor
              </span>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="language-select text-sm"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </div>

          <div className="editor-wrapper">
            <Editor
              height="100%"
              width="100%"
              language={language}
              value={code}
              onChange={(value) => setCode(value || "")}
              theme="vs-dark"
              loading={
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-primary-100/30 border-t-primary-100 rounded-full animate-spin"></div>
                    <span className="text-sm text-light-100">
                      Loading editor...
                    </span>
                  </div>
                </div>
              }
              options={{
                readOnly: false,
                domReadOnly: false,
                fontSize:
                  window.innerWidth < 640
                    ? 12
                    : window.innerWidth < 1024
                    ? 13
                    : 14,
                minimap: { enabled: window.innerWidth >= 1024 },
                scrollBeyondLastLine: false,
                wordWrap: "on",
                automaticLayout: true,
                padding: {
                  top: window.innerWidth < 640 ? 8 : 16,
                  bottom: window.innerWidth < 640 ? 8 : 16,
                },
                lineNumbers: "on",
                folding: true,
                renderLineHighlight: "all",
                contextmenu: true,
                quickSuggestions: true,
                suggestOnTriggerCharacters: true,
                tabSize: 2,
                acceptSuggestionOnEnter: "on",
                selectOnLineNumbers: true,
                roundedSelection: false,
                cursorStyle: "line",
                cursorBlinking: "blink",
                scrollbar: {
                  vertical: "auto",
                  horizontal: "auto",
                  verticalScrollbarSize: window.innerWidth < 640 ? 8 : 10,
                  horizontalScrollbarSize: window.innerWidth < 640 ? 8 : 10,
                },
              }}
            />
          </div>

          <div className="editor-footer">
            <Button
              onClick={runCode}
              disabled={isRunning}
              className="btn-secondary text-sm px-6 py-2.5 rounded-xl transition-all duration-300"
            >
              {isRunning ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Running...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Run Code
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
