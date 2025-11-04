import { db } from "@/firebase/admin";

export async function getUserStats(userId: string) {
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    // Get interviews count and data
    const interviewsSnapshot = await db
      .collection("interviews")
      .where("userId", "==", userId)
      .get();
    const interviewsCount = interviewsSnapshot.size;

    // Get interview activities
    const interviewActivities = interviewsSnapshot.docs.map((doc) => {
      const data = doc.data();
      console.log("Interview doc data:", {
        id: doc.id,
        role: data.role,
        createdAt: data.createdAt,
        createdAtType: typeof data.createdAt,
        hasSeconds: !!data.createdAt?._seconds,
      });

      // Handle Firestore Timestamp
      let completedAtTimestamp;
      if (data.createdAt?._seconds) {
        completedAtTimestamp = data.createdAt._seconds * 1000;
      } else if (data.createdAt?.seconds) {
        completedAtTimestamp = data.createdAt.seconds * 1000;
      } else if (data.createdAt?.toMillis) {
        completedAtTimestamp = data.createdAt.toMillis();
      } else if (typeof data.createdAt === "number") {
        completedAtTimestamp = data.createdAt;
      } else if (data.createdAt instanceof Date) {
        completedAtTimestamp = data.createdAt.getTime();
      } else {
        completedAtTimestamp = Date.now();
      }

      console.log(
        "Processed completedAt:",
        completedAtTimestamp,
        new Date(completedAtTimestamp).toISOString()
      );

      return {
        id: doc.id,
        type: "interview",
        role: data.role,
        completedAt: completedAtTimestamp,
      };
    });

    // Get assessments from user document
    const assessments = userData?.assessments || [];
    const assessmentsCount = assessments.length;

    // Calculate average assessment score
    const totalScore = assessments.reduce(
      (sum: number, assessment: any) => sum + (assessment.score || 0),
      0
    );
    const averageScore =
      assessmentsCount > 0 ? Math.round(totalScore / assessmentsCount) : 0;

    // Get assessment activities
    const assessmentActivities = assessments.map(
      (assessment: any, index: number) => {
        console.log("Assessment data:", {
          index,
          section: assessment.section,
          completedAt: assessment.completedAt,
          completedAtType: typeof assessment.completedAt,
          score: assessment.score,
          total: assessment.total,
        });

        return {
          id: `assessment-${index}`,
          type: "assessment",
          section: assessment.section,
          score: assessment.score,
          total: assessment.total,
          completedAt: assessment.completedAt || Date.now(),
        };
      }
    );

    console.log("=== FINAL ASSESSMENT ACTIVITIES ===");
    console.log("Assessment activities:", assessmentActivities);
    console.log("Interview activities:", interviewActivities);

    // Combine and sort all activities
    const recentActivity = [...assessmentActivities, ...interviewActivities]
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, 10);

    const result = {
      interviewsCount,
      assessmentsCount,
      averageScore,
      recentActivity,
      totalTests: interviewsCount + assessmentsCount,
      interviews: interviewActivities,
      assessments: assessmentActivities,
    };

    console.log("=== FINAL RESULT ===");
    console.log("Interviews count:", interviewsCount);
    console.log("Assessments count:", assessmentsCount);
    console.log("Sample interview:", interviewActivities[0]);
    console.log("Sample assessment:", assessmentActivities[0]);

    return result;
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return {
      interviewsCount: 0,
      assessmentsCount: 0,
      averageScore: 0,
      recentActivity: [],
      totalTests: 0,
      interviews: [],
      assessments: [],
    };
  }
}

export async function updateUserProfile(
  userId: string,
  updates: { name?: string; bio?: string; phone?: string }
) {
  try {
    await db.collection("users").doc(userId).update(updates);
    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function saveAssessmentResult(
  userId: string,
  assessment: {
    score: number;
    total: number;
    attempted: number;
    section: string;
    completedAt: number;
  }
) {
  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    const currentAssessments = userDoc.data()?.assessments || [];

    await userRef.update({
      assessments: [...currentAssessments, assessment],
    });

    return { success: true };
  } catch (error) {
    console.error("Error saving assessment result:", error);
    return { success: false };
  }
}
