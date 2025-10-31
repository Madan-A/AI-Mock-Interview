"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";
import Loader from "@/components/Loader";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Simulate initialization
    const timer = setTimeout(() => setIsInitializing(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => {
      console.log("speech start");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("speech end");
      setIsSpeaking(false);
    };

    const onError = (error: unknown) => {
      // Try to extract a concise, helpful message from VAPI errors which
      // sometimes arrive as objects and sometimes as already-stringified JSON.
      const extractMessage = (e: any): string | null => {
        if (!e) return null;
        if (typeof e === "string") return e;
        // common nested locations observed in VAPI errors
        return (
          e?.error?.error?.message ??
          e?.error?.message ??
          e?.message ??
          e?.data?.error?.message ??
          null
        );
      };

      let pretty: string | null = null;

      if (typeof error === "string") {
        // maybe a JSON string
        try {
          const parsed = JSON.parse(error);
          pretty = extractMessage(parsed) ?? JSON.stringify(parsed, null, 2);
        } catch {
          pretty = error;
        }
      } else if (typeof error === "object" && error !== null) {
        pretty =
          extractMessage(error as any) ??
          (() => {
            try {
              return JSON.stringify(error, null, 2);
            } catch {
              return String(error);
            }
          })();
      } else {
        pretty = String(error);
      }

      console.error("VAPI Error:", pretty);

      // If this looks like a billing/credits error, surface it to the user
      try {
        const msg = (pretty || "").toString();
        if (
          /wallet balance|purchase more credits|upgrade your plan|insufficient funds/i.test(
            msg
          )
        ) {
          // revert call state so user can retry after resolution
          setCallStatus(CallStatus.INACTIVE);
          alert(
            "VAPI error: " +
              msg +
              "\nPlease top up your account or contact support."
          );
        }
      } catch {
        // ignore
      }

      // Also keep the raw payload available for debugging
      try {
        console.debug("VAPI Error (raw):", error);
      } catch {
        // ignore
      }
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      console.log("handleGenerateFeedback");

      const { success, feedbackId: id } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: messages,
        feedbackId,
      });

      if (success && id) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        console.log("Error saving feedback");
        router.push("/");
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        router.push("/");
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    if (type === "generate") {
      const workflowId = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID;

      if (!workflowId) {
        console.error(
          "Missing NEXT_PUBLIC_VAPI_WORKFLOW_ID env var. Aborting VAPI start."
        );
        // revert state to allow retry
        setCallStatus(CallStatus.INACTIVE);
        alert(
          "VAPI workflow id is not configured. Please set NEXT_PUBLIC_VAPI_WORKFLOW_ID and reload."
        );
        return;
      }

      try {
        await vapi.start(workflowId, {
          variableValues: {
            username: userName,
            userid: userId,
          },
        });
      } catch (err) {
        console.error("Failed to start VAPI workflow:", err);
        setCallStatus(CallStatus.INACTIVE);
        // show user-friendly message
        alert("Failed to start AI interviewer. See console for details.");
        return;
      }
    } else {
      let formattedQuestions = "";
      if (questions) {
        formattedQuestions = questions
          .map((question) => `- ${question}`)
          .join("\n");
      }

      try {
        await vapi.start(interviewer, {
          variableValues: {
            questions: formattedQuestions,
          },
        });
      } catch (err) {
        console.error("Failed to start VAPI interviewer flow:", err);
        setCallStatus(CallStatus.INACTIVE);
        alert("Failed to start AI interviewer. See console for details.");
        return;
      }
    }
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  // Show loader while initializing
  if (isInitializing) {
    return <Loader size="lg" text="Initializing interview..." />;
  }

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== "ACTIVE" ? (
          <button className="relative btn-call" onClick={() => handleCall()}>
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />

            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "Call"
                : ". . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={() => handleDisconnect()}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
