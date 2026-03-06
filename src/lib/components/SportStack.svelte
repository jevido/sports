<script>
  import { onMount } from "svelte";
  import SportCard from "@/lib/components/SportCard.svelte";
  import { Button } from "@/lib/components/ui/button";
  import { RotateCcw } from "lucide-svelte";

  import basketballImage from "@/assets/basketball-hero.jpg";
  import soccerImage from "@/assets/soccer-card.jpg";
  import tennisImage from "@/assets/tennis-card.jpg";
  import swimmingImage from "@/assets/swimming-card.jpg";
  import sportsData from "@/lib/data/sports.json";
  import { apiFetch } from "@/lib/api";
  export let sportsInput = [];

  const imageMap = {
    basketball: basketballImage,
    soccer: soccerImage,
    tennis: tennisImage,
    swimming: swimmingImage
  };

  const sampleSports = sportsData.map((sport) => ({
    ...sport,
    image: imageMap[sport.imageKey] ?? basketballImage
  }));

  let sports = sampleSports;
  let currentIndex = 0;
  let matches = [];
  let lastSignature = "";
  let submittedClubsBySport = {};

  const normalizeSport = (value) => String(value || "").trim().toLowerCase();

  const mergeNearbyClubs = (existingClubs = [], submittedClubs = []) => {
    const unique = new Map();
    const combined = [...existingClubs, ...submittedClubs];

    for (const club of combined) {
      const key = `${String(club.clubName || "").toLowerCase()}::${String(club.location || "").toLowerCase()}`;
      if (!unique.has(key)) {
        unique.set(key, {
          clubName: club.clubName || "Unnamed Club",
          location: club.location || "Unknown location",
          distance: club.distance || "N/A",
          time: club.time || "Schedule not provided"
        });
      }
    }

    return Array.from(unique.values());
  };

  onMount(async () => {
    try {
      const response = await apiFetch("/api/sport-clubs");
      if (!response.ok) return;
      const payload = await response.json();
      const clubs = Array.isArray(payload?.clubs) ? payload.clubs : [];

      const grouped = {};
      for (const club of clubs) {
        const key = normalizeSport(club.sportName);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push({
          clubName: club.clubName,
          location: club.location,
          distance: club.distance || "N/A",
          time: club.time || "Schedule not provided"
        });
      }

      submittedClubsBySport = grouped;
    } catch {
      submittedClubsBySport = {};
    }
  });

  $: incomingSports = Array.isArray(sportsInput) && sportsInput.length > 0
    ? sportsInput
    : sportsData;
  $: sports = incomingSports.map((sport) => {
    const submittedClubs = submittedClubsBySport[normalizeSport(sport.name)] || [];
    return {
      ...sport,
      nearbyClubs: mergeNearbyClubs(sport.nearbyClubs || [], submittedClubs),
      image: imageMap[sport.imageKey] ?? basketballImage
    };
  });
  $: signature = sports.map((sport) => sport.id).join(",");
  $: if (signature !== lastSignature) {
    lastSignature = signature;
    currentIndex = 0;
    matches = [];
  }

  $: currentSport = sports[currentIndex];
  $: hasMoreSports = currentIndex < sports.length;
  $: matchedSports = matches
    .map((id) => sports.find((sport) => sport.id === id))
    .filter(Boolean);
  $: averageOccupancy = matchedSports.length > 0
    ? Math.round(
      matchedSports.reduce((sum, sport) => sum + (sport.participants / sport.maxParticipants) * 100, 0)
      / matchedSports.length
    )
    : 0;
  $: closestDistance = matchedSports.length > 0
    ? matchedSports
      .map((sport) => Number.parseFloat(sport.distance))
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b)[0]
    : null;

  const handleSwipe = (event) => {
    if (event.detail.direction === "right") {
      matches = [...matches, event.detail.sportId];
    }

    setTimeout(() => {
      currentIndex += 1;
    }, 300);
  };

  const resetStack = () => {
    currentIndex = 0;
    matches = [];
  };

  const getIntensityTag = (sport) => {
    if (sport.difficulty === "Advanced") return "High";
    if (sport.difficulty === "Intermediate") return "Medium";
    return "Low";
  };

  const getTravelTag = (distance) => {
    const miles = Number.parseFloat(distance);
    if (!Number.isFinite(miles)) return "Unknown";
    if (miles <= 1.0) return "Nearby";
    if (miles <= 2.0) return "Moderate";
    return "Farther";
  };
</script>

<div class="flex flex-col items-center max-w-7xl mx-auto w-full">
  {#if hasMoreSports}
    <div class="relative w-full">
      {#each sports.slice(currentIndex + 1, currentIndex + 3) as sport, index}
        <div
          class="absolute inset-0 bg-card rounded-3xl shadow-card"
          style={`transform: scale(${0.95 - index * 0.05}) translateY(${(index + 1) * 8}px); z-index: ${-(index + 1)};`}
        ></div>
      {/each}

      <SportCard
        {...currentSport}
        className="relative z-10"
        on:swipe={handleSwipe}
      />
    </div>
  {:else}
    <div class="text-center py-20 max-w-md">
      <div class="text-6xl mb-4">🎉</div>
      <h3 class="text-2xl font-bold mb-2">You're all caught up!</h3>
      <p class="text-muted-foreground mb-6">
        You've discovered all available sports in your area.
        {#if matches.length > 0}
          You matched with {matches.length} activities!
        {/if}
      </p>
      <Button variant="hero" onclick={resetStack} className="gap-2">
        <RotateCcw size={20} />
        Discover More Sports
      </Button>
    </div>
  {/if}

  {#if hasMoreSports}
    <div class="mt-6 text-center">
      <p class="text-sm text-muted-foreground">
        {sports.length - currentIndex} sports remaining
      </p>
      {#if matches.length > 0}
        <p class="text-sm text-primary font-medium mt-1">
          {matches.length} {matches.length === 1 ? "match" : "matches"} so far!
        </p>
      {/if}
    </div>
  {/if}

  {#if !hasMoreSports && matchedSports.length > 0}
    <div class="mt-12 w-full bg-card border border-border rounded-2xl p-8 shadow-card">
      <div class="mb-6 text-left">
        <h4 class="text-2xl font-black tracking-tight">Your Matched Sports Comparison</h4>
        <p class="text-muted-foreground mt-1">
          Compare your matches side-by-side before deciding what to join first.
        </p>
        <div class="mt-3 flex flex-wrap gap-4 text-sm">
          <span class="text-primary font-semibold">
            Matches: {matchedSports.length}
          </span>
          <span class="text-muted-foreground">
            Avg occupancy: {averageOccupancy}%
          </span>
          {#if closestDistance !== null}
            <span class="text-muted-foreground">
              Closest: {closestDistance.toFixed(1)} mi
            </span>
          {/if}
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[1200px] text-sm md:text-base">
          <thead>
            <tr class="border-b border-border text-muted-foreground">
              <th class="text-left py-3 pr-4 font-semibold">Sport</th>
              <th class="text-left py-3 pr-4 font-semibold">Difficulty</th>
              <th class="text-left py-3 pr-4 font-semibold">Intensity</th>
              <th class="text-left py-3 pr-4 font-semibold">Location</th>
              <th class="text-left py-3 pr-4 font-semibold">Distance</th>
              <th class="text-left py-3 pr-4 font-semibold">Time (24h)</th>
              <th class="text-left py-3 pr-4 font-semibold">Open Spots</th>
              <th class="text-left py-3 pr-4 font-semibold">Fill Rate</th>
              <th class="text-left py-3 pr-0 font-semibold">Nearby Clubs</th>
            </tr>
          </thead>
          <tbody>
            {#each matchedSports as sport}
              <tr class="border-b border-border/60">
                <td class="py-3 pr-4 font-semibold text-foreground">{sport.name}</td>
                <td class="py-3 pr-4">{sport.difficulty}</td>
                <td class="py-3 pr-4">{getIntensityTag(sport)}</td>
                <td class="py-3 pr-4">{sport.location}</td>
                <td class="py-3 pr-4">
                  {sport.distance}
                  <span class="ml-2 text-xs text-muted-foreground">({getTravelTag(sport.distance)})</span>
                </td>
                <td class="py-3 pr-4">{sport.time}</td>
                <td class="py-3 pr-4">{sport.maxParticipants - sport.participants}</td>
                <td class="py-3 pr-4">{Math.round((sport.participants / sport.maxParticipants) * 100)}%</td>
                <td class="py-3 pr-0">
                  {#if sport.nearbyClubs && sport.nearbyClubs.length > 0}
                    <details class="group rounded-lg border border-border/70 bg-muted/20 p-2">
                      <summary class="cursor-pointer select-none text-sm font-medium text-primary">
                        {sport.nearbyClubs.length} nearby {sport.nearbyClubs.length === 1 ? "club" : "clubs"}
                      </summary>
                      <div class="mt-2 space-y-2 text-xs text-muted-foreground">
                        {#each sport.nearbyClubs as club}
                          <div class="rounded-md border border-border/60 bg-background/60 p-2">
                            <p class="font-semibold text-foreground">{club.clubName}</p>
                            <p>{club.location}</p>
                            <p>{club.distance} • {club.time}</p>
                          </div>
                        {/each}
                      </div>
                    </details>
                  {:else}
                    <span class="text-muted-foreground text-sm">No alternatives listed</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
