"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AssessmentSectionPickerClient() {
  const router = useRouter();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="rounded-lg border p-6 flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Aptitude</h2>
        <p className="text-sm text-muted-foreground">
          Quants, Logical Reasoning, Verbal Ability
        </p>
        <div className="flex-1" />
        <Button
          className="btn-primary"
          onClick={() => router.push("/assessment?section=aptitude")}
        >
          Start Aptitude
        </Button>
      </div>
      <div className="rounded-lg border p-6 flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Technical</h2>
        <p className="text-sm text-muted-foreground">
          OS, DBMS, Computer Networks, DSA
        </p>
        <div className="flex-1" />
        <Button
          className="btn-primary"
          onClick={() => router.push("/assessment?section=technical")}
        >
          Start Technical
        </Button>
      </div>
    </div>
  );
}
