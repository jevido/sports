<script>
  import { onMount } from "svelte";
  import { ChevronLeft, RotateCcw } from "lucide-svelte";
  import { Button } from "@/lib/components/ui/button";
  import { cn } from "@/lib/utils";
  import SportStack from "@/lib/components/SportStack.svelte";
  import sportsData from "@/lib/data/sports.json";
  import { getRecommendedSports } from "@/lib/recommendations";
  import { quizQuestions as questions } from "@/lib/quiz-questions";
  import { apiFetch } from "@/lib/api";

  let currentStep = 0;
  let answers = {};
  let selectedOption = null;
  let showRecommendations = false;
  let animating = false;
  let recommendedSports = [];
  let communityProfiles = [];

  const createCommunitySport = (profile, index) => ({
    id: `community-${profile.sportName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index}`,
    name: profile.sportName,
    imageKey: "basketball",
    location: "Community Submitted",
    distance: "N/A",
    participants: 1,
    maxParticipants: 10,
    time: "Flexible",
    description:
      profile.description?.trim() ||
      "Community-submitted sport profile curated by quiz voters.",
    difficulty: profile.difficulty || "Intermediate",
    nearbyClubs: []
  });

  onMount(async () => {
    try {
      const response = await apiFetch("/api/community-sports");
      if (!response.ok) return;
      const payload = await response.json();
      const profiles = Array.isArray(payload?.sports) ? payload.sports : [];
      communityProfiles = profiles.map((profile, index) => ({
        sport: createCommunitySport(profile, index),
        recommendedAnswers: profile.recommendedAnswers || {}
      }));
    } catch {
      communityProfiles = [];
    }
  });

  $: currentQuestion = questions[currentStep];
  $: progress = (currentStep / questions.length) * 100;

  const handleSelectAndAdvance = (value) => {
    if (animating) return;

    selectedOption = value;
    animating = true;

    const newAnswers = { ...answers, [currentQuestion.id]: value };
    answers = newAnswers;

    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        currentStep += 1;
        selectedOption = answers[questions[currentStep]?.id] || null;
      } else {
        showRecommendations = true;
        selectedOption = null;
        recommendedSports = getRecommendedSports(newAnswers, sportsData, 24, communityProfiles);
      }
      animating = false;
    }, 220);
  };

  const handleBack = () => {
    if (currentStep === 0 || animating) return;

    animating = true;
    setTimeout(() => {
      currentStep -= 1;
      selectedOption = answers[questions[currentStep]?.id] || null;
      animating = false;
    }, 200);
  };

  const handleReset = () => {
    currentStep = 0;
    answers = {};
    selectedOption = null;
    showRecommendations = false;
    recommendedSports = [];
    animating = false;
  };
</script>

<div class="w-full max-w-lg mx-auto">
  {#if !showRecommendations}
    <div class="relative">
      <div class="mb-8">
        <div class="flex justify-between items-center mb-2">
          <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Question {currentStep + 1} of {questions.length}
          </span>
          <span class="text-xs font-bold text-primary">{Math.round(progress)}%</span>
        </div>
        <div class="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-neon rounded-full transition-all duration-500 ease-out"
            style={`width: ${progress}%`}
          ></div>
        </div>
      </div>

      <div
        class={cn(
          "bg-card border border-border rounded-2xl p-8 shadow-card transition-all duration-300",
          animating && "opacity-0 translate-y-4",
          !animating && "opacity-100 translate-y-0"
        )}
      >
        <div class="text-center mb-8">
          <span class="text-5xl mb-4 block">{currentQuestion.emoji}</span>
          <h3 class="text-2xl font-black tracking-tight">{currentQuestion.question}</h3>
        </div>

        <div class="space-y-3">
          {#each currentQuestion.options as option}
            <button
              type="button"
              onclick={() => handleSelectAndAdvance(option.value)}
              class={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left",
                selectedOption === option.value
                  ? "border-primary bg-primary/10 shadow-neon"
                  : "border-border bg-muted/30 hover:border-muted-foreground/30 hover:bg-muted/50"
              )}
            >
              <span class="text-2xl">{option.emoji}</span>
              <span
                class={cn(
                  "font-semibold text-lg",
                  selectedOption === option.value ? "text-primary" : "text-foreground"
                )}
              >
                {option.label}
              </span>
            </button>
          {/each}
        </div>
      </div>

      <div class="flex justify-between mt-6">
        <Button
          variant="ghost"
          onclick={handleBack}
          disabled={currentStep === 0}
          className="text-muted-foreground"
        >
          <ChevronLeft size={18} />
          Back
        </Button>
        <p class="text-sm text-muted-foreground self-center">Tap an option to continue</p>
      </div>
    </div>
  {:else}
    <div class="animate-card-enter space-y-6">
      <div class="bg-card border border-primary/30 rounded-2xl p-6 shadow-card text-center">
        <span class="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">
          Your Personalized Stack
        </span>
        <h3 class="text-3xl font-black tracking-tight mb-2">Swipe Your Recommendations</h3>
        <p class="text-muted-foreground">
          Based on your quiz answers, here are sports that fit your profile.
        </p>
      </div>

      <SportStack sportsInput={recommendedSports} />

      <div class="flex justify-center">
        <Button variant="ghost" onclick={handleReset} className="gap-2">
          <RotateCcw size={18} />
          Retake Quiz
        </Button>
      </div>
      <div class="text-center text-sm text-muted-foreground">
        Know a sport missing from this list?
        <a href="/submit" class="text-primary font-semibold hover:underline">Submit it</a>
        or
        <a href="/admin" class="text-primary font-semibold hover:underline">moderate submissions</a>.
      </div>
    </div>
  {/if}
</div>
