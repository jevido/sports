<script>
  import { ChevronLeft, RotateCcw } from "lucide-svelte";
  import { Button } from "@/lib/components/ui/button";
  import { cn } from "@/lib/utils";
  import SportStack from "@/lib/components/SportStack.svelte";
  import sportsData from "@/lib/data/sports.json";
  import { getRecommendedSports } from "@/lib/recommendations";

  const questions = [
    {
      id: "energy",
      question: "What's your energy like?",
      emoji: "⚡",
      options: [
        { label: "Chill & steady", value: "low", emoji: "🧘" },
        { label: "Bursts of intensity", value: "medium", emoji: "🔥" },
        { label: "Non-stop action", value: "high", emoji: "💥" }
      ]
    },
    {
      id: "social",
      question: "Lone wolf or pack animal?",
      emoji: "🐺",
      options: [
        { label: "Solo missions", value: "solo", emoji: "🎯" },
        { label: "Small squad", value: "small", emoji: "🤝" },
        { label: "Big team energy", value: "team", emoji: "🏟️" }
      ]
    },
    {
      id: "setting",
      question: "Where do you thrive?",
      emoji: "🌍",
      options: [
        { label: "Indoors", value: "indoor", emoji: "🏢" },
        { label: "Outdoors", value: "outdoor", emoji: "🌳" },
        { label: "Water", value: "water", emoji: "🌊" }
      ]
    },
    {
      id: "compete",
      question: "How competitive are you?",
      emoji: "🏆",
      options: [
        { label: "Just for fun", value: "casual", emoji: "😄" },
        { label: "Friendly rivalry", value: "moderate", emoji: "😏" },
        { label: "I play to win", value: "intense", emoji: "😤" }
      ]
    },
    {
      id: "schedule",
      question: "How much time can you commit per week?",
      emoji: "⏰",
      options: [
        { label: "30 min sessions", value: "short", emoji: "⚡" },
        { label: "1-2 hours", value: "medium", emoji: "🕐" },
        { label: "Half day+", value: "long", emoji: "☀️" }
      ]
    },
    {
      id: "vibe",
      question: "Pick a vibe:",
      emoji: "🎵",
      options: [
        { label: "Graceful & precise", value: "precision", emoji: "🎯" },
        { label: "Raw power", value: "power", emoji: "💪" },
        { label: "Speed & agility", value: "speed", emoji: "⚡" }
      ]
    },
    {
      id: "experience",
      question: "What's your current fitness level?",
      emoji: "📈",
      options: [
        { label: "Total beginner", value: "beginner", emoji: "🌱" },
        { label: "Some practice", value: "intermediate", emoji: "🏃" },
        { label: "Very experienced", value: "advanced", emoji: "🏆" }
      ]
    },
    {
      id: "impact",
      question: "How much impact do you want?",
      emoji: "🦵",
      options: [
        { label: "Low impact", value: "low", emoji: "🧘" },
        { label: "Moderate", value: "medium", emoji: "🚶" },
        { label: "High impact", value: "high", emoji: "💥" }
      ]
    },
    {
      id: "budget",
      question: "What's your gear budget?",
      emoji: "💸",
      options: [
        { label: "Keep it cheap", value: "low", emoji: "🪙" },
        { label: "Mid-range is fine", value: "medium", emoji: "💳" },
        { label: "No real limit", value: "high", emoji: "💎" }
      ]
    },
    {
      id: "goal",
      question: "Your main goal right now?",
      emoji: "🎯",
      options: [
        { label: "Get fitter", value: "fitness", emoji: "❤️" },
        { label: "Make friends", value: "social", emoji: "🤝" },
        { label: "Compete hard", value: "competition", emoji: "🥇" }
      ]
    }
  ];

  let currentStep = 0;
  let answers = {};
  let selectedOption = null;
  let showRecommendations = false;
  let animating = false;
  let recommendedSports = [];

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
        recommendedSports = getRecommendedSports(newAnswers, sportsData, 30);
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
    </div>
  {/if}
</div>
