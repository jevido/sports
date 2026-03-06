import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { env } from "$env/dynamic/private";
import { json } from "@sveltejs/kit";

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

let dbPromise;

async function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const dbPath = env.SQLITE_PATH || join(process.cwd(), "data", "sports.sqlite");
      mkdirSync(dirname(dbPath), { recursive: true });

      let db;
      try {
        const { Database } = await import("bun:sqlite");
        db = new Database(dbPath, { create: true });
      } catch {
        const { DatabaseSync } = await import("node:sqlite");
        const nodeDb = new DatabaseSync(dbPath);
        db = {
          exec: (sql) => nodeDb.exec(sql),
          query: (sql) => {
            const statement = nodeDb.prepare(sql);
            return {
              all: (...params) => statement.all(...params),
              get: (...params) => statement.get(...params),
              run: (...params) => statement.run(...params)
            };
          }
        };
      }

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

      return db;
    })();
  }

  return dbPromise;
}

const isAdmin = (request) => {
  if (!env.ADMIN_TOKEN) return false;
  return request.headers.get("x-admin-token") === env.ADMIN_TOKEN;
};

const badRequest = (error) => json({ error }, { status: 400 });
const unauthorized = () => json({ error: "Unauthorized" }, { status: 401 });
const notFound = () => json({ error: "Not Found" }, { status: 404 });

const parseBody = async (request) => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

const validateAnswers = (answers) => {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return "Answers must be an object.";
  }

  for (const [questionId, allowedAnswers] of Object.entries(QUIZ_SCHEMA)) {
    if (!allowedAnswers.includes(answers[questionId])) {
      return `Invalid answer for ${questionId}.`;
    }
  }

  return null;
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

const listSportProfiles = (db) =>
  db
    .query(
      `SELECT sport_name, description, difficulty, answers_mode_json, updated_at
       FROM sport_profiles
       ORDER BY updated_at DESC`
    )
    .all()
    .map((row) => ({
      sportName: row.sport_name,
      description: row.description,
      difficulty: row.difficulty,
      recommendedAnswers: JSON.parse(row.answers_mode_json),
      updatedAt: row.updated_at
    }));

const listSportClubs = (db) =>
  db
    .query(
      `SELECT id, sport_name, club_name, location, distance, time, created_at
       FROM sport_clubs
       ORDER BY created_at DESC`
    )
    .all()
    .map((row) => ({
      id: row.id,
      sportName: row.sport_name,
      clubName: row.club_name,
      location: row.location,
      distance: row.distance,
      time: row.time,
      createdAt: row.created_at
    }));

const mergeIntoProfile = (db, submission) => {
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

const handleGet = async ({ request, url, segments }) => {
  const db = await getDb();

  if (segments[0] === "community-sports" && segments.length === 1) {
    return json({ sports: listSportProfiles(db) });
  }

  if (segments[0] === "sport-clubs" && segments.length === 1) {
    const sportName = String(url.searchParams.get("sportName") || "").trim();
    const clubs = sportName
      ? listSportClubs(db).filter((club) => club.sportName.toLowerCase() === sportName.toLowerCase())
      : listSportClubs(db);
    return json({ clubs });
  }

  if (segments[0] === "admin" && !isAdmin(request)) return unauthorized();

  if (segments[0] === "admin" && segments[1] === "submissions" && segments.length === 2) {
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
  }

  if (segments[0] === "admin" && segments[1] === "club-submissions" && segments.length === 2) {
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
  }

  if (segments[0] === "admin" && segments[1] === "sport-profiles" && segments.length === 2) {
    return json({ profiles: listSportProfiles(db) });
  }

  if (segments[0] === "admin" && segments[1] === "sport-clubs" && segments.length === 2) {
    return json({ clubs: listSportClubs(db) });
  }

  return notFound();
};

const handlePost = async ({ request, segments }) => {
  const db = await getDb();

  if (segments[0] === "submissions" && segments.length === 1) {
    const body = await parseBody(request);
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

    return json({ ok: true, id: result.lastInsertRowid }, { status: 201 });
  }

  if (segments[0] === "club-submissions" && segments.length === 1) {
    const body = await parseBody(request);
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
      .query(
        `INSERT INTO club_submissions (sport_name, club_name, location, distance, time, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`
      )
      .run(sportName, clubName, location, distance, time);

    return json({ ok: true, id: result.lastInsertRowid }, { status: 201 });
  }

  if (segments[0] === "admin" && !isAdmin(request)) return unauthorized();

  if (segments[0] === "admin" && segments[1] === "submissions" && segments[3] === "review") {
    const submissionId = Number(segments[2]);
    if (!Number.isInteger(submissionId)) return badRequest("Invalid submission id.");

    const body = await parseBody(request);
    if (!body) return badRequest("Invalid JSON body.");

    const action = String(body.action || "").trim();
    if (!["approve", "reject"].includes(action)) {
      return badRequest("Action must be approve or reject.");
    }

    const row = db
      .query("SELECT id, sport_name, description, difficulty, answers_json, status FROM sport_submissions WHERE id = ?")
      .get(submissionId);

    if (!row) return json({ error: "Submission not found." }, { status: 404 });
    if (row.status !== "pending") return badRequest("Submission already reviewed.");

    if (action === "approve") {
      mergeIntoProfile(db, {
        sportName: row.sport_name,
        description: row.description,
        difficulty: row.difficulty,
        answers: JSON.parse(row.answers_json)
      });
    }

    db.query("UPDATE sport_submissions SET status = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?").run(
      action === "approve" ? "approved" : "rejected",
      submissionId
    );

    return json({ ok: true });
  }

  if (segments[0] === "admin" && segments[1] === "club-submissions" && segments[3] === "review") {
    const submissionId = Number(segments[2]);
    if (!Number.isInteger(submissionId)) return badRequest("Invalid club submission id.");

    const body = await parseBody(request);
    if (!body) return badRequest("Invalid JSON body.");

    const action = String(body.action || "").trim();
    if (!["approve", "reject"].includes(action)) {
      return badRequest("Action must be approve or reject.");
    }

    const row = db
      .query(`SELECT id, sport_name, club_name, location, distance, time, status FROM club_submissions WHERE id = ?`)
      .get(submissionId);

    if (!row) return json({ error: "Submission not found." }, { status: 404 });
    if (row.status !== "pending") return badRequest("Submission already reviewed.");

    if (action === "approve") {
      db.query("INSERT INTO sport_clubs (sport_name, club_name, location, distance, time) VALUES (?, ?, ?, ?, ?)").run(
        row.sport_name,
        row.club_name,
        row.location,
        row.distance,
        row.time
      );
    }

    db.query("UPDATE club_submissions SET status = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?").run(
      action === "approve" ? "approved" : "rejected",
      submissionId
    );

    return json({ ok: true });
  }

  return notFound();
};

const handlePut = async ({ request, segments }) => {
  const db = await getDb();

  if (segments[0] !== "admin" || !isAdmin(request)) return unauthorized();

  if (segments[1] === "sport-profiles" && segments[2]) {
    const currentSportName = decodeURIComponent(segments[2]).trim();
    if (!currentSportName) return badRequest("Invalid sport name in URL.");

    const existing = db
      .query("SELECT sport_name, description, difficulty, answers_mode_json FROM sport_profiles WHERE sport_name = ?")
      .get(currentSportName);
    if (!existing) return json({ error: "Sport profile not found." }, { status: 404 });

    const body = await parseBody(request);
    if (!body) return badRequest("Invalid JSON body.");

    const nextSportName = String(body.sportName || currentSportName).trim();
    const nextDescription = String(body.description ?? existing.description ?? "").trim();
    const nextDifficulty = String(body.difficulty || existing.difficulty).trim();
    const nextRecommendedAnswers = body.recommendedAnswers ?? JSON.parse(existing.answers_mode_json);

    if (nextSportName.length < 2 || nextSportName.length > 80) {
      return badRequest("Sport name must be between 2 and 80 characters.");
    }
    if (!["Beginner", "Intermediate", "Advanced"].includes(nextDifficulty)) {
      return badRequest("Difficulty must be Beginner, Intermediate, or Advanced.");
    }
    const answersError = validateAnswers(nextRecommendedAnswers);
    if (answersError) return badRequest(answersError);

    if (currentSportName.toLowerCase() !== nextSportName.toLowerCase()) {
      const conflict = db
        .query("SELECT sport_name FROM sport_profiles WHERE lower(sport_name) = lower(?)")
        .get(nextSportName);
      if (conflict) return badRequest("Another sport profile already uses this sport name.");
    }

    db.query(
      `UPDATE sport_profiles
       SET sport_name = ?, description = ?, difficulty = ?, answers_mode_json = ?, updated_at = CURRENT_TIMESTAMP
       WHERE sport_name = ?`
    ).run(nextSportName, nextDescription, nextDifficulty, JSON.stringify(nextRecommendedAnswers), currentSportName);

    if (currentSportName.toLowerCase() !== nextSportName.toLowerCase()) {
      db.query("UPDATE sport_clubs SET sport_name = ? WHERE lower(sport_name) = lower(?)").run(
        nextSportName,
        currentSportName
      );
    }

    return json({ ok: true, profiles: listSportProfiles(db) });
  }

  if (segments[1] === "sport-clubs" && segments[2]) {
    const clubId = Number(segments[2]);
    if (!Number.isInteger(clubId)) return badRequest("Invalid club id.");

    const existing = db.query("SELECT id FROM sport_clubs WHERE id = ?").get(clubId);
    if (!existing) return json({ error: "Club not found." }, { status: 404 });

    const body = await parseBody(request);
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

    db.query(
      `UPDATE sport_clubs
       SET sport_name = ?, club_name = ?, location = ?, distance = ?, time = ?
       WHERE id = ?`
    ).run(sportName, clubName, location, distance, time, clubId);

    return json({ ok: true, clubs: listSportClubs(db) });
  }

  return notFound();
};

const handleDelete = async ({ request, segments }) => {
  const db = await getDb();

  if (segments[0] !== "admin" || !isAdmin(request)) return unauthorized();

  if (segments[1] === "sport-profiles" && segments[2]) {
    const sportName = decodeURIComponent(segments[2]).trim();
    if (!sportName) return badRequest("Invalid sport name in URL.");

    db.query("DELETE FROM sport_profiles WHERE sport_name = ?").run(sportName);
    db.query("DELETE FROM sport_clubs WHERE lower(sport_name) = lower(?)").run(sportName);

    return json({ ok: true, profiles: listSportProfiles(db), clubs: listSportClubs(db) });
  }

  if (segments[1] === "sport-clubs" && segments[2]) {
    const clubId = Number(segments[2]);
    if (!Number.isInteger(clubId)) return badRequest("Invalid club id.");

    db.query("DELETE FROM sport_clubs WHERE id = ?").run(clubId);
    return json({ ok: true, clubs: listSportClubs(db) });
  }

  return notFound();
};

const route = async ({ request, url, params }, method) => {
  const segments = String(params.path || "")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (method === "GET") return handleGet({ request, url, segments });
  if (method === "POST") return handlePost({ request, segments });
  if (method === "PUT") return handlePut({ request, segments });
  if (method === "DELETE") return handleDelete({ request, segments });

  return notFound();
};

export const prerender = false;

export const OPTIONS = async () =>
  new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": env.CORS_ORIGIN || "*",
      "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
      "access-control-allow-headers": "Content-Type,x-admin-token"
    }
  });

export const GET = async (event) => route(event, "GET");
export const POST = async (event) => route(event, "POST");
export const PUT = async (event) => route(event, "PUT");
export const DELETE = async (event) => route(event, "DELETE");
