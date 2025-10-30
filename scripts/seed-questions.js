/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// Load env from .env if available
require("dotenv/config");

const QuestionSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["quants", "logical", "verbal", "os", "dbms", "cn", "dsa"],
      required: true,
    },
    question: { type: String, required: true },
    options: {
      type: [String],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 4,
        message: "Exactly 4 options are required",
      },
      required: true,
    },
    correctAnswer: { type: String, required: true },
  },
  { timestamps: true }
);

const Question =
  mongoose.models.Question || mongoose.model("Question", QuestionSchema);

// Only seed from JSON files; no auto-generation.
function tryLoadJsonCategory(category) {
  const filePath = path.join(
    process.cwd(),
    "data",
    "assessment",
    `${category}.json`
  );
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return null;
    return data.filter(
      (q) =>
        q &&
        q.category === category &&
        typeof q.question === "string" &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correctAnswer === "string"
    );
  } catch (e) {
    console.warn(`Failed to parse ${filePath}:`, e.message);
    return null;
  }
}

function buildCategorySet(category) {
  const loaded = tryLoadJsonCategory(category);
  return loaded || [];
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error(
      "MONGODB_URI not set. Please set it in your environment or .env file."
    );
    process.exit(1);
  }

  await mongoose.connect(uri, { bufferCommands: false });
  console.log("Connected to MongoDB");

  // Always reseed based on JSON files content
  const quants = buildCategorySet("quants");
  const logical = buildCategorySet("logical");
  const verbal = buildCategorySet("verbal");
  const os = buildCategorySet("os");
  const dbms = buildCategorySet("dbms");
  const cn = buildCategorySet("cn");
  const dsa = buildCategorySet("dsa");
  const data = [
    ...quants,
    ...logical,
    ...verbal,
    ...os,
    ...dbms,
    ...cn,
    ...dsa,
  ];

  if (data.length === 0) {
    console.error(
      "No valid questions found. Ensure data/assessment/*.json exist and are valid."
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  await Question.deleteMany({});
  const inserted = await Question.insertMany(data);
  console.log(
    `Seeded ${inserted.length} questions (quants: ${quants.length}, logical: ${logical.length}, verbal: ${verbal.length}, os: ${os.length}, dbms: ${dbms.length}, cn: ${cn.length}, dsa: ${dsa.length}).`
  );

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
