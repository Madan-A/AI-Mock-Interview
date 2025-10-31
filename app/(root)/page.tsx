import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";
import CursorGlow from "@/components/CursorGlow";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";
import {
  getInterviewsByUserId,
  getLatestInterviews,
} from "@/lib/actions/general.action";

// Enable static generation with revalidation
export const revalidate = 60; // Revalidate every 60 seconds
export const dynamic = "force-dynamic"; // Always fetch fresh data for auth

async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
    return null;
  }

  const [userInterviewsRaw, allInterviewRaw] = await Promise.all([
    getInterviewsByUserId(user.id),
    getLatestInterviews({ userId: user.id }),
  ]);

  const userInterviews = userInterviewsRaw ?? [];
  const allInterview = allInterviewRaw ?? [];

  const hasPastInterviews = userInterviews.length > 0;
  const hasUpcomingInterviews = allInterview.length > 0;

  return (
    <>
      <CursorGlow />
      <section className="card-cta relative cursor-glow-container">
        <div className="flex flex-col gap-6 max-w-lg z-10 relative">
          <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
          <p className="text-lg">
            Practice real interview questions & get instant feedback
          </p>

          <Button asChild className="btn-primary max-sm:w-full">
            <Link href="/interview" prefetch={true}>
              Start an Interview
            </Link>
          </Button>

          <Button asChild className="btn-primary max-sm:w-full">
            <Link href="/assessment" prefetch={true}>
              Start Assessment
            </Link>
          </Button>
        </div>

        <Image
          src="/robot.png"
          alt="robo-dude"
          width={400}
          height={400}
          className="max-sm:hidden z-10 relative"
        />
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Your Interviews</h2>

        <div className="interviews-section">
          {hasPastInterviews ? (
            userInterviews?.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p>You haven&apos;t taken any interviews yet</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Take Interviews</h2>

        <div className="interviews-section">
          {hasUpcomingInterviews ? (
            allInterview?.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p>There are no interviews available</p>
          )}
        </div>
      </section>
    </>
  );
}

export default Home;
