/**
 * exam-seed.mjs
 *
 * Seeds one or more complete exam definitions into Supabase.
 *
 * Usage:
 *   node exam-seed.mjs                        # seeds the built-in GATE (CS & IT) data
 *   node exam-seed.mjs --json ./my-exam.json  # seeds from a JSON file
 *   node exam-seed.mjs --json ./exams.json    # JSON can be a single exam object OR an array
 *
 * JSON shape (single exam or array of exams):
 * {
 *   "name": "Exam Name",
 *   "description": "Optional description",
 *   "priority": "high" | "medium" | "low",    // default: "medium"
 *   "exam_date": "2025-02-01",                 // optional ISO date string
 *   "subjects": [
 *     {
 *       "name": "Subject Name",
 *       "weightage": 20,                       // optional number
 *       "chapters": [
 *         {
 *           "name": "Chapter Name",
 *           "topics": ["Topic A", "Topic B"]   // array of topic name strings
 *         }
 *       ]
 *     }
 *   ]
 * }
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─── Supabase client ──────────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌  Missing Supabase credentials.");
  console.error("    Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ─── Built-in GATE exam data ──────────────────────────────────────────────────

const gateExamData = {
  name: "GATE (CS & IT)",
  description: "Graduate Aptitude Test in Engineering for Computer Science",
  priority: "high",
  subjects: [
    {
      name: "General Aptitude",
      weightage: 15,
      chapters: [
        {
          name: "General Aptitude",
          topics: ["Verbal Aptitude", "Quantitative Aptitude", "Analytical Aptitude", "Spatial Aptitude"]
        }
      ]
    },
    {
      name: "Engineering Mathematics",
      weightage: 13,
      chapters: [
        {
          name: "Engineering Mathematics",
          topics: ["Discrete Math", "Linear Algebra", "Calculus", "Probability", "Statistics"]
        }
      ]
    },
    {
      name: "Digital Logic & COA",
      weightage: 12,
      chapters: [
        {
          name: "Digital Logic & Architecture",
          topics: ["Boolean algebra", "Circuits", "CPU design", "Pipelining", "Memory hierarchy", "I/O"]
        }
      ]
    },
    {
      name: "Programming & Algorithms",
      weightage: 12,
      chapters: [
        {
          name: "Programming & Data Structures",
          topics: ["C programming", "Recursion", "Data structures (arrays, stacks, trees)"]
        },
        {
          name: "Algorithms",
          topics: ["Algorithm design (greedy, dynamic programming)"]
        }
      ]
    },
    {
      name: "TOC & Compiler Design",
      weightage: 12,
      chapters: [
        {
          name: "Theory of Computation & Compilers",
          topics: ["Automata", "Formal languages", "Parsing", "Code optimization"]
        }
      ]
    },
    {
      name: "OS & Databases",
      weightage: 12,
      chapters: [
        {
          name: "Operating Systems",
          topics: ["Processes", "Threads", "Deadlocks", "Memory management", "File systems"]
        },
        {
          name: "Databases",
          topics: ["ER/Relational models", "SQL", "Normal forms"]
        }
      ]
    },
    {
      name: "Computer Networks",
      weightage: 12,
      chapters: [
        {
          name: "Computer Networks",
          topics: ["OSI/TCP-IP", "Routing", "Switching", "TCP/UDP", "Application layer protocols"]
        }
      ]
    }
  ]
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validate that an exam object has at least a name and subjects array.
 * Returns an array of validation errors (empty = valid).
 */
function validateExam(exam, index = null) {
  const label = index !== null ? `Exam[${index}]` : "Exam";
  const errors = [];

  if (!exam.name || typeof exam.name !== 'string') {
    errors.push(`${label}: "name" is required and must be a string.`);
  }
  if (!Array.isArray(exam.subjects) || exam.subjects.length === 0) {
    errors.push(`${label}: "subjects" must be a non-empty array.`);
  } else {
    exam.subjects.forEach((subject, si) => {
      if (!subject.name) errors.push(`${label}.subjects[${si}]: "name" is required.`);
      if (!Array.isArray(subject.chapters) || subject.chapters.length === 0) {
        errors.push(`${label}.subjects[${si}]: "chapters" must be a non-empty array.`);
      } else {
        subject.chapters.forEach((chapter, ci) => {
          if (!chapter.name) errors.push(`${label}.subjects[${si}].chapters[${ci}]: "name" is required.`);
          if (!Array.isArray(chapter.topics) || chapter.topics.length === 0) {
            errors.push(`${label}.subjects[${si}].chapters[${ci}]: "topics" must be a non-empty array.`);
          }
        });
      }
    });
  }

  return errors;
}

/**
 * Seed a single exam object for the given user_id.
 * Deletes any existing exam with the same name first.
 */
async function seedExam(examData, user_id) {
  console.log(`\n📚  Seeding exam: "${examData.name}"`);

  // ── Delete existing exam with same name ──
  const { data: existingExams, error: fetchError } = await supabase
    .from('exams')
    .select('id, name')
    .eq('user_id', user_id)
    .eq('name', examData.name);

  if (!fetchError && existingExams && existingExams.length > 0) {
    console.log(`    ⚠️  Found ${existingExams.length} existing exam(s) with same name — deleting...`);
    for (const ex of existingExams) {
      await supabase.from('exams').delete().eq('id', ex.id);
      console.log(`    🗑  Deleted exam ID: ${ex.id}`);
    }
  }

  // ── Insert Exam ──
  const examInsert = {
    user_id,
    name: examData.name,
    description: examData.description || null,
    priority: examData.priority || 'medium',
  };
  if (examData.exam_date) examInsert.exam_date = examData.exam_date;

  const { data: exam, error: examError } = await supabase
    .from('exams')
    .insert(examInsert)
    .select()
    .single();

  if (examError) {
    console.error(`    ❌  Error inserting exam "${examData.name}":`, examError.message);
    return false;
  }
  console.log(`    ✅  Inserted Exam: ${exam.name} (id: ${exam.id})`);

  // ── Subjects → Chapters → Topics ──
  for (const subjectData of examData.subjects) {
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .insert({
        user_id,
        exam_id: exam.id,
        name: subjectData.name,
        weightage: subjectData.weightage ?? null,
      })
      .select()
      .single();

    if (subjectError) {
      console.error(`      ❌  Error inserting subject "${subjectData.name}":`, subjectError.message);
      continue;
    }
    console.log(`      📖  Subject: ${subject.name}${subject.weightage ? ` (${subject.weightage}%)` : ''}`);

    for (const chapterData of subjectData.chapters) {
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .insert({
          user_id,
          subject_id: subject.id,
          name: chapterData.name,
        })
        .select()
        .single();

      if (chapterError) {
        console.error(`        ❌  Error inserting chapter "${chapterData.name}":`, chapterError.message);
        continue;
      }
      console.log(`        📑  Chapter: ${chapter.name}`);

      for (const topicName of chapterData.topics) {
        const { error: topicError } = await supabase
          .from('topics')
          .insert({
            user_id,
            chapter_id: chapter.id,
            name: topicName,
          });

        if (topicError) {
          console.error(`          ❌  Topic "${topicName}":`, topicError.message);
        } else {
          console.log(`          ✔  Topic: ${topicName}`);
        }
      }
    }
  }

  return true;
}

// ─── Parse CLI args ───────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const jsonFlagIndex = args.indexOf('--json');
  if (jsonFlagIndex !== -1) {
    const jsonPath = args[jsonFlagIndex + 1];
    if (!jsonPath) {
      console.error("❌  --json flag requires a file path, e.g.: node exam-seed.mjs --json ./my-exam.json");
      process.exit(1);
    }
    return { mode: 'json', jsonPath };
  }
  return { mode: 'builtin' };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();

  // Fetch the first user
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError || !users || users.length === 0) {
    console.error("❌  Error fetching users:", usersError?.message ?? "No users found.");
    process.exit(1);
  }
  const user_id = users[0].id;
  console.log(`👤  Seeding for user: ${user_id}`);

  let examsToSeed = [];

  if (args.mode === 'json') {
    const absPath = resolve(args.jsonPath);
    console.log(`📂  Loading JSON from: ${absPath}`);

    let raw;
    try {
      raw = readFileSync(absPath, 'utf-8');
    } catch (err) {
      console.error(`❌  Could not read file: ${err.message}`);
      process.exit(1);
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error(`❌  Invalid JSON: ${err.message}`);
      process.exit(1);
    }

    // Accept either a single exam object or an array.
    examsToSeed = Array.isArray(parsed) ? parsed : [parsed];

    // Validate all exams before inserting anything.
    let hasErrors = false;
    examsToSeed.forEach((exam, i) => {
      const errors = validateExam(exam, Array.isArray(parsed) ? i : null);
      if (errors.length > 0) {
        errors.forEach(e => console.error(`❌  ${e}`));
        hasErrors = true;
      }
    });
    if (hasErrors) {
      console.error("\nAborting — fix the errors above and re-run.");
      process.exit(1);
    }

    console.log(`✔  Loaded ${examsToSeed.length} exam(s) from JSON.`);
  } else {
    examsToSeed = [gateExamData];
    console.log("ℹ️   No --json flag provided — seeding built-in GATE (CS & IT) data.");
  }

  // Seed each exam sequentially.
  let successCount = 0;
  for (const examData of examsToSeed) {
    const ok = await seedExam(examData, user_id);
    if (ok) successCount++;
  }

  console.log(`\n🎉  Done! Seeded ${successCount}/${examsToSeed.length} exam(s) successfully.`);
}

main();
