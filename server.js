import { mkdirSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { Database } from "bun:sqlite";

const root = join(import.meta.dir, "build");
const dbPath = Bun.env.SQLITE_PATH ?? join(import.meta.dir, "data", "sports.sqlite");
mkdirSync(dirname(dbPath), { recursive: true });

const db = new Database(dbPath, { create: true });
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS sport_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport_name TEXT NOT NULL,
    description TEXT,
    difficulty TEXT NOT NULL,
    answers_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TEXT,
    review_note TEXT
  );

  CREATE TABLE IF NOT EXISTS sport_profiles (
    sport_name TEXT PRIMARY KEY,
    description TEXT,
    difficulty TEXT NOT NULL,
    votes_json TEXT NOT NULL,
    answers_mode_json TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS club_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport_name TEXT NOT NULL,
    club_name TEXT NOT NULL,
    location TEXT NOT NULL,
    distance TEXT,
    time TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TEXT,
    review_note TEXT
  );

  CREATE TABLE IF NOT EXISTS sport_clubs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport_name TEXT NOT NULL,
    club_name TEXT NOT NULL,
    location TEXT NOT NULL,
    distance TEXT,
    time TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const QUIZ_SCHEMA = {
  energy: ["low", "medium", "high"],
  social: ["solo", "small", "team"],
  setting: ["indoor", "outdoor", "water"],
  compete: ["casual", "moderate", "intense"],
  schedule: ["short", "medium", "long"],
  vibe: ["precision", "power", "speed"],
  experience: ["beginner", "intermediate", "advanced"],
  impact: ["low", "medium", "high"],
  budget: ["low", "medium", "high"],
  goal: ["fitness", "social", "competition"]
};

const isSafePath = (requestedPath) => {
  const normalized = normalize(requestedPath).replace(/^\/+/, "");
  return !normalized.startsWith("..") && !normalized.includes("..\\");
};

const resolveFile = (pathname) => {
  const requested = pathname === "/" ? "/index.html" : pathname;
  if (!isSafePath(requested)) return null;
  return join(root, requested);
};

const CORS_HEADERS = {
  "access-control-allow-origin": Bun.env.CORS_ORIGIN ?? "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "Content-Type,x-admin-token",
  "access-control-max-age": "86400"
};

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...CORS_HEADERS
    }
  });

const badRequest = (message) => json({ error: message }, 400);
const unauthorized = () => json({ error: "Unauthorized" }, 401);

const parseBody = async (req) => {
  try {
    return await req.json();
  } catch {
    return null;
  }
};

const validateAnswers = (answers) => {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return "Answers must be an object.";
  }

  for (const [questionId, allowedAnswers] of Object.entries(QUIZ_SCHEMA)) {
    const value = answers[questionId];
    if (!allowedAnswers.includes(value)) {
      return `Invalid answer for ${questionId}.`;
    }
  }

  return null;
};

const isAdmin = (req) => {
  const expected = Bun.env.ADMIN_TOKEN;
  if (!expected) return false;
  return req.headers.get("x-admin-token") === expected;
};

const incrementVotes = (votes, answers) => {
  const nextVotes = structuredClone(votes);

  for (const [questionId, answer] of Object.entries(answers)) {
    if (!nextVotes[questionId]) {
      nextVotes[questionId] = {};
    }
    nextVotes[questionId][answer] = (nextVotes[questionId][answer] ?? 0) + 1;
  }

  return nextVotes;
};

const computeModeAnswers = (votes) => {
  const modeAnswers = {};

  for (const [questionId, allowedAnswers] of Object.entries(QUIZ_SCHEMA)) {
    const questionVotes = votes[questionId] ?? {};
    let topAnswer = null;
    let topCount = -1;

    for (const answer of allowedAnswers) {
      const count = questionVotes[answer] ?? 0;
      if (count > topCount) {
        topCount = count;
        topAnswer = answer;
      }
    }

    if (topAnswer !== null) {
      modeAnswers[questionId] = topAnswer;
    }
  }

  return modeAnswers;
};

const mergeIntoProfile = (submission) => {
  const existing = db
    .query("SELECT description, difficulty, votes_json FROM sport_profiles WHERE sport_name = ?")
    .get(submission.sportName);

  const existingVotes = existing ? JSON.parse(existing.votes_json) : {};
  const votes = incrementVotes(existingVotes, submission.answers);
  const modeAnswers = computeModeAnswers(votes);

  db.query(`
    INSERT INTO sport_profiles (sport_name, description, difficulty, votes_json, answers_mode_json, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(sport_name)
    DO UPDATE SET
      description = excluded.description,
      difficulty = excluded.difficulty,
      votes_json = excluded.votes_json,
      answers_mode_json = excluded.answers_mode_json,
      updated_at = CURRENT_TIMESTAMP
  `).run(
    submission.sportName,
    submission.description || existing?.description || "",
    submission.difficulty || existing?.difficulty || "Intermediate",
    JSON.stringify(votes),
    JSON.stringify(modeAnswers)
  );
};

const handleSubmitSport = async (req) => {
  const body = await parseBody(req);
  if (!body) return badRequest("Invalid JSON body.");

  const sportName = String(body.sportName || "").trim();
  const description = String(body.description || "").trim();
  const difficulty = String(body.difficulty || "Intermediate").trim();
  const answers = body.answers;

  if (sportName.length < 2 || sportName.length > 80) {
    return badRequest("Sport name must be between 2 and 80 characters.");
  }

  if (!["Beginner", "Intermediate", "Advanced"].includes(difficulty)) {
    return badRequest("Difficulty must be Beginner, Intermediate, or Advanced.");
  }

  const answerError = validateAnswers(answers);
  if (answerError) return badRequest(answerError);

  const result = db
    .query(
      "INSERT INTO sport_submissions (sport_name, description, difficulty, answers_json, status) VALUES (?, ?, ?, ?, 'pending')"
    )
    .run(sportName, description, difficulty, JSON.stringify(answers));

  return json({ ok: true, id: result.lastInsertRowid }, 201);
};

const handleCommunitySports = () => {
  const rows = db
    .query(
      "SELECT sport_name, description, difficulty, answers_mode_json, updated_at FROM sport_profiles ORDER BY updated_at DESC"
    )
    .all();

  return json({
    sports: rows.map((row) => ({
      sportName: row.sport_name,
      description: row.description,
      difficulty: row.difficulty,
      recommendedAnswers: JSON.parse(row.answers_mode_json),
      updatedAt: row.updated_at
    }))
  });
};

const handleSubmitClub = async (req) => {
  const body = await parseBody(req);
  if (!body) return badRequest("Invalid JSON body.");

  const sportName = String(body.sportName || "").trim();
  const clubName = String(body.clubName || "").trim();
  const location = String(body.location || "").trim();
  const distance = String(body.distance || "").trim();
  const time = String(body.time || "").trim();

  if (sportName.length < 2 || sportName.length > 80) {
    return badRequest("Sport name must be between 2 and 80 characters.");
  }
  if (clubName.length < 2 || clubName.length > 120) {
    return badRequest("Club name must be between 2 and 120 characters.");
  }
  if (location.length < 2 || location.length > 200) {
    return badRequest("Location must be between 2 and 200 characters.");
  }

  const result = db
    .query(`
      INSERT INTO club_submissions (sport_name, club_name, location, distance, time, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `)
    .run(sportName, clubName, location, distance, time);

  return json({ ok: true, id: result.lastInsertRowid }, 201);
};

const handleSportClubs = (url) => {
  const sportName = String(url.searchParams.get("sportName") || "").trim();

  const rows = sportName
    ? db
      .query(`
          SELECT id, sport_name, club_name, location, distance, time, created_at
          FROM sport_clubs
          WHERE lower(sport_name) = lower(?)
          ORDER BY created_at DESC
        `)
      .all(sportName)
    : db
      .query(`
          SELECT id, sport_name, club_name, location, distance, time, created_at
          FROM sport_clubs
          ORDER BY created_at DESC
        `)
      .all();

  return json({
    clubs: rows.map((row) => ({
      id: row.id,
      sportName: row.sport_name,
      clubName: row.club_name,
      location: row.location,
      distance: row.distance,
      time: row.time,
      createdAt: row.created_at
    }))
  });
};

const handleAdminList = (req, url) => {
  if (!isAdmin(req)) return unauthorized();

  const status = url.searchParams.get("status") || "pending";
  if (!["pending", "approved", "rejected"].includes(status)) {
    return badRequest("Invalid status filter.");
  }

  const rows = db
    .query(
      `SELECT id, sport_name, description, difficulty, answers_json, status, created_at, reviewed_at, review_note
       FROM sport_submissions
       WHERE status = ?
       ORDER BY created_at ASC`
    )
    .all(status);

  return json({
    submissions: rows.map((row) => ({
      id: row.id,
      sportName: row.sport_name,
      description: row.description,
      difficulty: row.difficulty,
      answers: JSON.parse(row.answers_json),
      status: row.status,
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at,
      reviewNote: row.review_note
    }))
  });
};

const handleAdminClubList = (req, url) => {
  if (!isAdmin(req)) return unauthorized();

  const status = url.searchParams.get("status") || "pending";
  if (!["pending", "approved", "rejected"].includes(status)) {
    return badRequest("Invalid status filter.");
  }

  const rows = db
    .query(
      `SELECT id, sport_name, club_name, location, distance, time, status, created_at, reviewed_at, review_note
       FROM club_submissions
       WHERE status = ?
       ORDER BY created_at ASC`
    )
    .all(status);

  return json({
    submissions: rows.map((row) => ({
      id: row.id,
      sportName: row.sport_name,
      clubName: row.club_name,
      location: row.location,
      distance: row.distance,
      time: row.time,
      status: row.status,
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at,
      reviewNote: row.review_note
    }))
  });
};

const handleAdminReview = async (req, submissionId) => {
  if (!isAdmin(req)) return unauthorized();

  const body = await parseBody(req);
  if (!body) return badRequest("Invalid JSON body.");

  const action = String(body.action || "").trim();
  if (!["approve", "reject"].includes(action)) {
    return badRequest("Action must be approve or reject.");
  }

  const row = db
    .query(
      "SELECT id, sport_name, description, difficulty, answers_json, status FROM sport_submissions WHERE id = ?"
    )
    .get(submissionId);

  if (!row) return json({ error: "Submission not found." }, 404);
  if (row.status !== "pending") return badRequest("Submission already reviewed.");

  if (action === "approve") {
    mergeIntoProfile({
      sportName: row.sport_name,
      description: row.description,
      difficulty: row.difficulty,
      answers: JSON.parse(row.answers_json)
    });
  }

  db.query(
    "UPDATE sport_submissions SET status = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).run(action === "approve" ? "approved" : "rejected", submissionId);

  return json({ ok: true });
};

const handleAdminClubReview = async (req, submissionId) => {
  if (!isAdmin(req)) return unauthorized();

  const body = await parseBody(req);
  if (!body) return badRequest("Invalid JSON body.");

  const action = String(body.action || "").trim();
  if (!["approve", "reject"].includes(action)) {
    return badRequest("Action must be approve or reject.");
  }

  const row = db
    .query(
      `SELECT id, sport_name, club_name, location, distance, time, status
       FROM club_submissions
       WHERE id = ?`
    )
    .get(submissionId);

  if (!row) return json({ error: "Submission not found." }, 404);
  if (row.status !== "pending") return badRequest("Submission already reviewed.");

  if (action === "approve") {
    db.query(`
      INSERT INTO sport_clubs (sport_name, club_name, location, distance, time)
      VALUES (?, ?, ?, ?, ?)
    `).run(row.sport_name, row.club_name, row.location, row.distance, row.time);
  }

  db.query(
    "UPDATE club_submissions SET status = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).run(action === "approve" ? "approved" : "rejected", submissionId);

  return json({ ok: true });
};

const handleApi = async (req, url) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (url.pathname === "/api/community-sports" && req.method === "GET") {
    return handleCommunitySports();
  }

  if (url.pathname === "/api/submissions" && req.method === "POST") {
    return handleSubmitSport(req);
  }

  if (url.pathname === "/api/club-submissions" && req.method === "POST") {
    return handleSubmitClub(req);
  }

  if (url.pathname === "/api/sport-clubs" && req.method === "GET") {
    return handleSportClubs(url);
  }

  if (url.pathname === "/api/admin/submissions" && req.method === "GET") {
    return handleAdminList(req, url);
  }

  if (url.pathname === "/api/admin/club-submissions" && req.method === "GET") {
    return handleAdminClubList(req, url);
  }

  const reviewMatch = url.pathname.match(/^\/api\/admin\/submissions\/(\d+)\/review$/);
  if (reviewMatch && req.method === "POST") {
    return handleAdminReview(req, Number(reviewMatch[1]));
  }

  const clubReviewMatch = url.pathname.match(/^\/api\/admin\/club-submissions\/(\d+)\/review$/);
  if (clubReviewMatch && req.method === "POST") {
    return handleAdminClubReview(req, Number(clubReviewMatch[1]));
  }

  return json({ error: "Not Found" }, 404);
};

Bun.serve({
  port: Number(Bun.env.PORT ?? 3000),
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname.startsWith("/api/")) {
      return handleApi(req, url);
    }

    const filePath = resolveFile(decodeURIComponent(url.pathname));

    if (filePath && Bun.file(filePath).size > 0) {
      return new Response(Bun.file(filePath));
    }

    if (extname(url.pathname)) {
      return new Response("Not Found", { status: 404 });
    }

    return new Response(Bun.file(join(root, "index.html")));
  }
});

console.log(`Sportinder running on http://0.0.0.0:${Number(Bun.env.PORT ?? 3000)} (db: ${dbPath})`);
