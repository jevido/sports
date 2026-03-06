<script>
  import { quizQuestions } from "@/lib/quiz-questions";
  import { Button } from "@/lib/components/ui/button";
  import { apiFetch } from "@/lib/api";

  const difficulties = ["Beginner", "Intermediate", "Advanced"];

  let sportName = "";
  let description = "";
  let difficulty = "Intermediate";
  let answers = {};
  let isSubmitting = false;
  let isSubmittingClub = false;
  let message = "";
  let clubMessage = "";
  let error = "";
  let clubError = "";

  let clubSportName = "";
  let clubName = "";
  let clubLocation = "";
  let clubDistance = "";
  let clubTime = "";

  const getOptionLabel = (questionId, optionValue) => {
    const question = quizQuestions.find((item) => item.id === questionId);
    const option = question?.options.find((item) => item.value === optionValue);
    return option?.label ?? optionValue;
  };

  const handleSubmit = async () => {
    error = "";
    message = "";

    if (!sportName.trim()) {
      error = "Sport name is required.";
      return;
    }

    const missing = quizQuestions.filter((question) => !answers[question.id]).map((item) => item.question);
    if (missing.length > 0) {
      error = "Please answer all quiz-fit questions before submitting.";
      return;
    }

    isSubmitting = true;
    try {
      const response = await apiFetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sportName,
          description,
          difficulty,
          answers
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        error = payload?.error || "Could not submit your sport.";
        return;
      }

      message = "Thanks. Your sport is submitted and waiting for moderation.";
      sportName = "";
      description = "";
      difficulty = "Intermediate";
      answers = {};
    } catch {
      error = "Network error while submitting.";
    } finally {
      isSubmitting = false;
    }
  };

  const handleClubSubmit = async () => {
    clubError = "";
    clubMessage = "";

    if (!clubSportName.trim() || !clubName.trim() || !clubLocation.trim()) {
      clubError = "Sport name, club name, and location are required.";
      return;
    }

    isSubmittingClub = true;
    try {
      const response = await apiFetch("/api/club-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sportName: clubSportName,
          clubName,
          location: clubLocation,
          distance: clubDistance,
          time: clubTime
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        clubError = payload?.error || "Could not submit your club.";
        return;
      }

      clubMessage = "Thanks. Your local club is submitted and waiting for moderation.";
      clubSportName = "";
      clubName = "";
      clubLocation = "";
      clubDistance = "";
      clubTime = "";
    } catch {
      clubError = "Network error while submitting club.";
    } finally {
      isSubmittingClub = false;
    }
  };
</script>

<svelte:head>
  <title>Submit sports and clubs</title>
</svelte:head>

<div class="min-h-screen bg-background py-16 px-6">
  <div class="max-w-3xl mx-auto space-y-8">
    <div class="text-center">
      <h1 class="text-4xl font-black tracking-tight">Submit Sports and Local Clubs</h1>
      <p class="text-muted-foreground mt-2">
        Add a sport profile or share a local club. An admin must approve submissions first.
      </p>
    </div>

    <div class="bg-card border border-border rounded-2xl p-6 space-y-6">
      <h2 class="text-2xl font-black tracking-tight">Submit a Sport</h2>
      <div class="space-y-2">
        <label class="block text-sm font-semibold" for="sportName">Sport name</label>
        <input
          id="sportName"
          class="w-full rounded-lg border border-border bg-background px-3 py-2"
          bind:value={sportName}
          placeholder="e.g. Pickleball"
        />
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-semibold" for="description">Description</label>
        <textarea
          id="description"
          class="w-full rounded-lg border border-border bg-background px-3 py-2 min-h-24"
          bind:value={description}
          placeholder="Short description (optional)"
        ></textarea>
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-semibold" for="difficulty">Difficulty</label>
        <select id="difficulty" class="w-full rounded-lg border border-border bg-background px-3 py-2" bind:value={difficulty}>
          {#each difficulties as level}
            <option value={level}>{level}</option>
          {/each}
        </select>
      </div>

      <div class="space-y-5">
        <h2 class="text-xl font-bold">Best quiz answers for this sport</h2>
        {#each quizQuestions as question}
          <div class="space-y-2">
            <p class="text-sm font-semibold">{question.question}</p>
            <div class="grid gap-2 sm:grid-cols-3">
              {#each question.options as option}
                <button
                  type="button"
                  onclick={() => (answers = { ...answers, [question.id]: option.value })}
                  class={`rounded-lg border px-3 py-2 text-left ${
                    answers[question.id] === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background"
                  }`}
                >
                  {option.emoji} {option.label}
                </button>
              {/each}
            </div>
            {#if answers[question.id]}
              <p class="text-xs text-muted-foreground">
                Selected: {getOptionLabel(question.id, answers[question.id])}
              </p>
            {/if}
          </div>
        {/each}
      </div>

      {#if error}
        <p class="text-sm text-destructive">{error}</p>
      {/if}
      {#if message}
        <p class="text-sm text-accent">{message}</p>
      {/if}

      <div class="flex flex-wrap gap-3">
        <Button variant="hero" onclick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit for moderation"}
        </Button>
      </div>
    </div>

    <div class="bg-card border border-border rounded-2xl p-6 space-y-6">
      <h2 class="text-2xl font-black tracking-tight">Submit a Local Sports Club</h2>
      <p class="text-sm text-muted-foreground">
        Share nearby clubs so they can appear under the sport comparison table once approved.
      </p>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <label class="block text-sm font-semibold" for="clubSportName">Sport name</label>
          <input
            id="clubSportName"
            class="w-full rounded-lg border border-border bg-background px-3 py-2"
            bind:value={clubSportName}
            placeholder="e.g. Basketball"
          />
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-semibold" for="clubName">Club name</label>
          <input
            id="clubName"
            class="w-full rounded-lg border border-border bg-background px-3 py-2"
            bind:value={clubName}
            placeholder="e.g. Downtown Hoops Club"
          />
        </div>
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-semibold" for="clubLocation">Location</label>
        <input
          id="clubLocation"
          class="w-full rounded-lg border border-border bg-background px-3 py-2"
          bind:value={clubLocation}
          placeholder="e.g. Main Street Arena"
        />
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <label class="block text-sm font-semibold" for="clubDistance">Distance (optional)</label>
          <input
            id="clubDistance"
            class="w-full rounded-lg border border-border bg-background px-3 py-2"
            bind:value={clubDistance}
            placeholder="e.g. 1.2 mi"
          />
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-semibold" for="clubTime">Time (optional)</label>
          <input
            id="clubTime"
            class="w-full rounded-lg border border-border bg-background px-3 py-2"
            bind:value={clubTime}
            placeholder="e.g. Tue 19:00"
          />
        </div>
      </div>

      {#if clubError}
        <p class="text-sm text-destructive">{clubError}</p>
      {/if}
      {#if clubMessage}
        <p class="text-sm text-accent">{clubMessage}</p>
      {/if}

      <div class="flex flex-wrap gap-3">
        <Button variant="hero" onclick={handleClubSubmit} disabled={isSubmittingClub}>
          {isSubmittingClub ? "Submitting..." : "Submit club for moderation"}
        </Button>
        <a href="/" class="inline-flex items-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
          Back to quiz
        </a>
      </div>
    </div>
  </div>
</div>
