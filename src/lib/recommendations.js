const TEAM_SPORTS = [
  "basketball",
  "soccer",
  "volleyball",
  "rugby",
  "cricket",
  "hockey",
  "lacrosse",
  "handball",
  "water polo",
  "ultimate frisbee",
  "baseball",
  "softball",
  "futsal",
  "netball",
  "football",
  "kabaddi",
];

const WATER_SPORTS = [
  "swimming",
  "water polo",
  "rowing",
  "canoeing",
  "kayaking",
  "diving",
  "sailing",
  "surfing",
  "windsurfing",
  "kitesurfing",
  "paddleboarding",
  "dragon boat",
];

const PRECISION_SPORTS = [
  "archery",
  "tennis",
  "table tennis",
  "badminton",
  "fencing",
  "billiards",
  "snooker",
  "darts",
];

const POWER_SPORTS = [
  "boxing",
  "kickboxing",
  "muay thai",
  "wrestling",
  "mma",
  "powerlifting",
  "weightlifting",
  "strongman",
  "crossfit",
  "rugby",
];

const SPEED_SPORTS = [
  "track",
  "sprint",
  "cycling",
  "speed skating",
  "bmx",
  "futsal",
  "skateboarding",
];

const LOW_IMPACT_SPORTS = [
  "swimming",
  "yoga",
  "pilates",
  "rowing",
  "sailing",
  "table tennis",
  "archery",
];

const SOCIAL_SPORTS = [
  "capoeira",
  "volleyball",
  "soccer",
  "basketball",
  "ultimate frisbee",
  "dance",
  "dragon boat",
  "beach volleyball",
];

function includesAny(name, terms) {
  return terms.some((term) => name.includes(term));
}

function getPrimarySportName(answers) {
  const { energy, social, setting, compete, vibe, impact, goal } = answers;

  if (setting === "water" && social === "solo") return "Swimming";
  if (setting === "water" && social === "team") return "Water Polo";
  if (impact === "low" && goal === "fitness") return "Yoga";
  if (vibe === "precision" && social === "solo") return "Archery";
  if (vibe === "precision" && compete === "moderate") return "Tennis";
  if (energy === "high" && social === "team" && compete === "intense")
    return "Basketball";
  if (energy === "high" && social === "team") return "Soccer";
  if (energy === "high" && vibe === "power") return "Boxing";
  if (energy === "high" && vibe === "speed") return "Track";
  if (goal === "social") return "Capoeira";
  return "Cycling";
}

function scoreFromCommunityVotes(answers, profile) {
  const recommendedAnswers = profile?.recommendedAnswers ?? {};
  let score = 0;
  let matchedCriteria = 0;

  for (const [questionId, answer] of Object.entries(answers)) {
    if (
      recommendedAnswers[questionId] &&
      recommendedAnswers[questionId] === answer
    ) {
      score += 4;
      matchedCriteria += 1;
    }
  }

  return { score, matchedCriteria };
}

export function getRecommendedSports(
  answers,
  sports,
  limit = 24,
  communityProfiles = [],
) {
  const primary = getPrimarySportName(answers).toLowerCase();

  const activeCriteria = [
    { points: 10, enabled: true },
    { points: 4, enabled: answers.social === "team" },
    { points: 2, enabled: answers.social === "solo" },
    { points: 5, enabled: answers.setting === "water" },
    { points: 4, enabled: answers.vibe === "precision" },
    { points: 4, enabled: answers.vibe === "power" },
    { points: 4, enabled: answers.vibe === "speed" },
    { points: 4, enabled: answers.impact === "low" },
    { points: 3, enabled: answers.goal === "social" },
    {
      points: 2,
      enabled: answers.goal === "competition" && answers.compete === "intense",
    },
    { points: 3, enabled: answers.experience === "beginner" },
    { points: 3, enabled: answers.experience === "intermediate" },
    { points: 3, enabled: answers.experience === "advanced" },
    { points: 2, enabled: answers.energy === "high" },
    { points: 2, enabled: answers.energy === "low" },
  ];

  const enabledCriteria = activeCriteria.filter(
    (criterion) => criterion.enabled,
  );
  const totalPossibleScore = enabledCriteria.reduce(
    (sum, criterion) => sum + criterion.points,
    0,
  );
  const minScore = Math.max(5, Math.ceil(totalPossibleScore * 0.35));
  const minCriteriaMatches = Math.max(
    2,
    Math.ceil(enabledCriteria.length * 0.35),
  );

  const builtInScored = sports.map((sport, index) => {
    const name = sport.name.toLowerCase();
    let score = 0;
    let matchedCriteria = 0;

    if (name.includes(primary)) {
      score += 10;
      matchedCriteria += 1;
    }
    if (answers.social === "team" && includesAny(name, TEAM_SPORTS)) {
      score += 4;
      matchedCriteria += 1;
    }
    if (answers.social === "solo" && !includesAny(name, TEAM_SPORTS)) {
      score += 2;
      matchedCriteria += 1;
    }
    if (answers.setting === "water" && includesAny(name, WATER_SPORTS)) {
      score += 5;
      matchedCriteria += 1;
    }
    if (answers.vibe === "precision" && includesAny(name, PRECISION_SPORTS)) {
      score += 4;
      matchedCriteria += 1;
    }
    if (answers.vibe === "power" && includesAny(name, POWER_SPORTS)) {
      score += 4;
      matchedCriteria += 1;
    }
    if (answers.vibe === "speed" && includesAny(name, SPEED_SPORTS)) {
      score += 4;
      matchedCriteria += 1;
    }
    if (answers.impact === "low" && includesAny(name, LOW_IMPACT_SPORTS)) {
      score += 4;
      matchedCriteria += 1;
    }
    if (answers.goal === "social" && includesAny(name, SOCIAL_SPORTS)) {
      score += 3;
      matchedCriteria += 1;
    }
    if (
      answers.goal === "competition" &&
      answers.compete === "intense" &&
      sport.difficulty !== "Beginner"
    ) {
      score += 2;
      matchedCriteria += 1;
    }
    if (answers.experience === "beginner" && sport.difficulty === "Beginner") {
      score += 3;
      matchedCriteria += 1;
    }
    if (
      answers.experience === "intermediate" &&
      sport.difficulty === "Intermediate"
    ) {
      score += 3;
      matchedCriteria += 1;
    }
    if (answers.experience === "advanced" && sport.difficulty === "Advanced") {
      score += 3;
      matchedCriteria += 1;
    }
    if (answers.energy === "high" && sport.difficulty !== "Beginner") {
      score += 2;
      matchedCriteria += 1;
    }
    if (answers.energy === "low" && sport.difficulty === "Beginner") {
      score += 2;
      matchedCriteria += 1;
    }

    return { sport, score, matchedCriteria, index };
  });

  const communityScored = communityProfiles.map((profile, index) => {
    const { score, matchedCriteria } = scoreFromCommunityVotes(
      answers,
      profile,
    );
    return {
      sport: profile.sport,
      score,
      matchedCriteria,
      index: sports.length + index,
    };
  });

  const scored = [...builtInScored, ...communityScored];

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.index - b.index;
  });

  const strongMatches = scored.filter(
    (item) =>
      item.score >= minScore && item.matchedCriteria >= minCriteriaMatches,
  );
  const results = (
    strongMatches.length > 0
      ? strongMatches
      : scored.filter((item) => item.score > 0)
  ).slice(0, limit);

  return results.map((item) => item.sport);
}
