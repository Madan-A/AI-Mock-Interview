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
      return {
        id: doc.id,
        type: "interview",
        role: data.role,
        completedAt: data.createdAt?._seconds
          ? data.createdAt._seconds * 1000
          : Date.now(),
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
      (assessment: any, index: number) => ({
        id: `assessment-${index}`,
        type: "assessment",
        section: assessment.section,
        score: assessment.score,
        total: assessment.total,
        completedAt: assessment.completedAt,
      })
    );

    console.log("Assessment activities:", assessmentActivities);
    console.log("Interview activities:", interviewActivities);

    // Combine and sort all activities
    const recentActivity = [...assessmentActivities, ...interviewActivities]
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, 10);

    return {
      interviewsCount,
      assessmentsCount,
      averageScore,
      recentActivity,
      totalTests: interviewsCount + assessmentsCount,
      interviews: interviewActivities,
      assessments: assessmentActivities,
    };
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
