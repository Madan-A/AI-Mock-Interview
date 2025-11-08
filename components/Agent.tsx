"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
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
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Setup media with current video/audio settings
  const setupMedia = async (videoEnabled: boolean, audioEnabled: boolean) => {
    try {
      // Stop existing tracks first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Get new stream with updated constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled,
        audio: audioEnabled,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing media:", err);
    }
  };

  useEffect(() => {
    // Simulate initialization and setup user media
    const timer = setTimeout(() => setIsInitializing(false), 500);

    // Initialize with both video and audio on
    setupMedia(true, true);

    return () => {
      clearTimeout(timer);
      // Cleanup media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
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

  const toggleVideo = async () => {
    const newVideoState = !isVideoOn;
    setIsVideoOn(newVideoState);
    await setupMedia(newVideoState, isAudioOn);
  };

  const toggleAudio = async () => {
    const newAudioState = !isAudioOn;
    setIsAudioOn(newAudioState);
    await setupMedia(isVideoOn, newAudioState);
  };

  // Show loader while initializing
  if (isInitializing) {
    return <Loader size="lg" text="Initializing interview..." />;
  }

  return (
    <div className="flex flex-col items-center w-full gap-6 sm:gap-8">
      <div className="interview-layout">
        {/* AI Interviewer Card - Full Face Person */}
        <div className="interviewer-card">
          <div className="video-frame interviewer-frame">
            <div className="interviewer-avatar">
              {/* Professional robot interviewer image */}
              <div className="avatar-container">
                <Image
                  src="/robot.png"
                  alt="AI Interviewer Robot"
                  width={400}
                  height={400}
                  className="avatar-img"
                  priority
                />
                {/* Speaking animation overlay */}
                {isSpeaking && (
                  <>
                    <div className="speak-ring ring-1" />
                    <div className="speak-ring ring-2" />
                    <div className="speak-ring ring-3" />
                  </>
                )}
              </div>
            </div>

            {/* Interviewer info bar */}
            <div className="video-info-bar top">
              <div className="info-content">
                <div
                  className={cn(
                    "status-dot",
                    callStatus === "ACTIVE" && "status-active",
                    isSpeaking && "status-speaking"
                  )}
                />
                <span className="info-label">AI Interviewer</span>
              </div>
              {isSpeaking && (
                <div className="speaking-badge">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Video Card with Controls */}
        <div className="user-card">
          <div className="video-frame user-frame">
            {isVideoOn ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="user-video"
              />
            ) : (
              <div className="video-off">
                <div className="avatar-placeholder">
                  <svg
                    className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 text-primary-100/60"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="off-text">Camera Off</p>
                </div>
              </div>
            )}

            {/* User info bar */}
            <div className="video-info-bar bottom">
              <div className="info-content">
                <svg
                  className="user-icon-svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="info-label">{userName}</span>
              </div>
            </div>
          </div>

          {/* Video/Audio Controls Below Video */}
          <div className="media-controls-below">
            <button
              onClick={toggleVideo}
              className={cn("media-btn", !isVideoOn && "media-btn-off")}
              title={isVideoOn ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoOn ? (
                <svg
                  className="btn-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              ) : (
                <svg
                  className="btn-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>

            <button
              onClick={toggleAudio}
              className={cn("media-btn", !isAudioOn && "media-btn-off")}
              title={isAudioOn ? "Mute microphone" : "Unmute microphone"}
            >
              {isAudioOn ? (
                <svg
                  className="btn-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              ) : (
                <svg
                  className="btn-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border w-full max-w-7xl">
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

      <div className="w-full max-w-7xl flex justify-center px-4 sm:px-6 ">
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
    </div>
  );
};

export default Agent;
