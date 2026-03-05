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
  "kabaddi"
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
  "dragon boat"
];

const PRECISION_SPORTS = [
  "archery",
  "tennis",
  "table tennis",
  "badminton",
  "fencing",
  "billiards",
  "snooker",
  "darts"
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
  "rugby"
];

const SPEED_SPORTS = [
  "track",
  "sprint",
  "cycling",
  "speed skating",
  "bmx",
  "futsal",
  "skateboarding"
];

const LOW_IMPACT_SPORTS = [
  "swimming",
  "yoga",
  "pilates",
  "rowing",
  "sailing",
  "table tennis",
  "archery"
];

const SOCIAL_SPORTS = [
  "capoeira",
  "volleyball",
  "soccer",
  "basketball",
  "ultimate frisbee",
  "dance",
  "dragon boat",
  "beach volleyball"
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
  if (energy === "high" && social === "team" && compete === "intense") return "Basketball";
  if (energy === "high" && social === "team") return "Soccer";
  if (energy === "high" && vibe === "power") return "Boxing";
  if (energy === "high" && vibe === "speed") return "Track";
  if (goal === "social") return "Capoeira";
  return "Cycling";
}

export function getRecommendedSports(answers, sports, limit = 24) {
  const primary = getPrimarySportName(answers).toLowerCase();

  const scored = sports.map((sport, index) => {
    const name = sport.name.toLowerCase();
    let score = 0;

    if (name.includes(primary)) score += 10;
    if (answers.social === "team" && includesAny(name, TEAM_SPORTS)) score += 4;
    if (answers.social === "solo" && !includesAny(name, TEAM_SPORTS)) score += 2;
    if (answers.setting === "water" && includesAny(name, WATER_SPORTS)) score += 5;
    if (answers.vibe === "precision" && includesAny(name, PRECISION_SPORTS)) score += 4;
    if (answers.vibe === "power" && includesAny(name, POWER_SPORTS)) score += 4;
    if (answers.vibe === "speed" && includesAny(name, SPEED_SPORTS)) score += 4;
    if (answers.impact === "low" && includesAny(name, LOW_IMPACT_SPORTS)) score += 4;
    if (answers.goal === "social" && includesAny(name, SOCIAL_SPORTS)) score += 3;
    if (answers.goal === "competition" && answers.compete === "intense") score += 2;
    if (answers.experience === "beginner" && sport.difficulty === "Beginner") score += 3;
    if (answers.experience === "intermediate" && sport.difficulty === "Intermediate") score += 3;
    if (answers.experience === "advanced" && sport.difficulty === "Advanced") score += 3;
    if (answers.energy === "high" && sport.difficulty !== "Beginner") score += 2;
    if (answers.energy === "low" && sport.difficulty === "Beginner") score += 2;

    return { sport, score, index };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.index - b.index;
  });

  return scored.slice(0, limit).map((item) => item.sport);
}
