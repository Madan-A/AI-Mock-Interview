import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function GET() {
  try {
    const prompt = `Generate 2 coding interview questions similar to LeetCode problems. 
    
Requirements:
- First question: Easy difficulty
- Second question: Medium difficulty
- Each question must include:
  1. Title
  2. Problem description
  3. Two example test cases with input, output, and explanation
  4. List of constraints
  5. Six test cases with input and expected output (for validation)

Return ONLY a valid JSON array with no additional text or markdown:

[
  {
    "id": 1,
    "title": "Problem Title",
    "difficulty": "Easy",
    "description": "Problem description here...",
    "examples": [
      {
        "input": "example input",
        "output": "example output",
        "explanation": "why this is the answer"
      },
      {
        "input": "example input 2",
        "output": "example output 2"
      }
    ],
    "constraints": [
      "constraint 1",
      "constraint 2"
    ],
    "testCases": [
      {"input": "test1", "output": "result1"},
      {"input": "test2", "output": "result2"},
      {"input": "test3", "output": "result3"},
      {"input": "test4", "output": "result4"},
      {"input": "test5", "output": "result5"},
      {"input": "test6", "output": "result6"}
    ]
  },
  {
    "id": 2,
    "title": "Problem Title 2",
    "difficulty": "Medium",
    "description": "...",
    "examples": [...],
    "constraints": [...],
    "testCases": [...]
  }
]

IMPORTANT: Return ONLY the JSON array, no markdown code blocks, no explanations.`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });

    let text = response.text || "";

    // Clean up the response
    text = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Parse the JSON response
    const questions = JSON.parse(text);

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error("Error fetching coding questions:", error);

    // Handle quota exceeded error or any API failure - use fallback questions
    if (error?.status === 429 || error?.error?.code === 429) {
      console.warn("⚠️  API quota exceeded. Using fallback questions.");
    } else {
      console.warn("⚠️  API error. Using fallback questions.");
    }

    // Return high-quality fallback questions
    const fallbackQuestions = [
      {
        id: 1,
        title: "Find the Missing Number",
        difficulty: "Easy",
        description:
          "You are given an array 'nums' containing 'n' distinct numbers in the range [0, n]. Find the only number in the range that is missing from the array.",
        examples: [
          {
            input: "[3,0,1]",
            output: "2",
            explanation:
              "n = 3 since there are 3 numbers, so all numbers are in the range [0,3]. 2 is the missing number in the range since it does not appear in nums.",
          },
          {
            input: "[0,1]",
            output: "2",
            explanation:
              "n = 2 since there are 2 numbers, so all numbers are in the range [0,2]. 2 is the missing number in the range since it does not appear in nums.",
          },
        ],
        constraints: [
          "n == nums.length",
          "1 <= n <= 10^4",
          "0 <= nums[i] <= n",
          "All the numbers of nums are unique.",
        ],
        testCases: [
          { input: "[3,0,1]", output: "2" },
          { input: "[0,1]", output: "2" },
          { input: "[9,6,4,2,3,5,7,0,1]", output: "8" },
          { input: "[0]", output: "1" },
          { input: "[1]", output: "0" },
          { input: "[0,2,3]", output: "1" },
        ],
      },
      {
        id: 2,
        title: "Sum of Even Numbers After Queries",
        difficulty: "Medium",
        description:
          "You are given an integer array nums and an array queries where queries[i] = [val, index]. For each query i, first, add val to nums[index], then return the sum of even numbers in nums. Return an integer array answer where answer[i] is the answer to the ith query.",
        examples: [
          {
            input: "nums = [1,2,3,4], queries = [[1,0],[-3,1],[-4,0],[2,3]]",
            output: "[8,6,2,4]",
            explanation:
              "At the beginning, the array is [1,2,3,4]. After adding 1 to nums[0], the array is [2,2,3,4], and the sum of even values is 2 + 2 + 4 = 8. After adding -3 to nums[1], the array is [2,-1,3,4], and the sum of even values is 2 + 4 = 6. After adding -4 to nums[0], the array is [-2,-1,3,4], and the sum of even values is -2 + 4 = 2. After adding 2 to nums[3], the array is [-2,-1,3,6], and the sum of even values is -2 + 6 = 4.",
          },
        ],
        constraints: [
          "1 <= nums.length <= 10^4",
          "-10^4 <= nums[i] <= 10^4",
          "1 <= queries.length <= 10^4",
          "-10^4 <= val <= 10^4",
          "0 <= index < nums.length",
        ],
        testCases: [
          {
            input: "nums = [1,2,3,4], queries = [[1,0],[-3,1],[-4,0],[2,3]]",
            output: "[8,6,2,4]",
          },
          { input: "nums = [1], queries = [[4,0]]", output: "[0]" },
          {
            input: "nums = [2,4,6], queries = [[1,0],[2,1],[3,2]]",
            output: "[14,16,18]",
          },
          {
            input: "nums = [1,3,5], queries = [[2,0],[4,1],[6,2]]",
            output: "[0,4,10]",
          },
          {
            input: "nums = [0,0,0], queries = [[1,0],[1,1],[1,2]]",
            output: "[2,4,6]",
          },
          {
            input: "nums = [10,20,30], queries = [[-5,0],[-10,1],[-15,2]]",
            output: "[50,40,30]",
          },
        ],
      },
    ];

    return NextResponse.json({
      questions: fallbackQuestions,
      fallback: true,
      message:
        error?.status === 429
          ? "API quota exceeded. Using sample questions."
          : "Using sample questions.",
    });
  }
}
