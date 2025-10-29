import { Schema, model, models } from "mongoose";

export type QuestionCategory = "quants" | "logical" | "verbal";

export interface QuestionDoc {
  category: QuestionCategory;
  question: string;
  options: string[];
  correctAnswer: string;
}

const QuestionSchema = new Schema<QuestionDoc>(
  {
    category: {
      type: String,
      enum: ["quants", "logical", "verbal"],
      required: true,
    },
    question: { type: String, required: true },
    options: {
      type: [String],
      validate: {
        validator: (arr: string[]) => Array.isArray(arr) && arr.length === 4,
        message: "Exactly 4 options are required",
      },
      required: true,
    },
    correctAnswer: { type: String, required: true },
  },
  { timestamps: true }
);

const Question =
  models.Question || model<QuestionDoc>("Question", QuestionSchema);

export default Question;
