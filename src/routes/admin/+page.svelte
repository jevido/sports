<script>
  import { onMount } from "svelte";
  import { Button } from "@/lib/components/ui/button";
  import { quizQuestions } from "@/lib/quiz-questions";
  import { apiFetch } from "@/lib/api";

  let adminToken = "";
  let sportSubmissions = [];
  let clubSubmissions = [];
  let loading = false;
  let error = "";
  let info = "";

  const questionMap = Object.fromEntries(
    quizQuestions.map((question) => [
      question.id,
      {
        label: question.question,
        options: Object.fromEntries(question.options.map((option) => [option.value, option.label]))
      }
    ])
  );

  const fetchPending = async () => {
    error = "";
    info = "";
    if (!adminToken.trim()) {
      error = "Enter admin token.";
      return;
    }

    loading = true;
    try {
      const response = await apiFetch("/api/admin/submissions?status=pending", {
        headers: { "x-admin-token": adminToken }
      });
      const payload = await response.json();
      if (!response.ok) {
        error = payload?.error || "Failed to fetch submissions.";
        sportSubmissions = [];
        return;
      }
      sportSubmissions = payload?.submissions || [];

      const clubResponse = await apiFetch("/api/admin/club-submissions?status=pending", {
        headers: { "x-admin-token": adminToken }
      });
      const clubPayload = await clubResponse.json();
      if (!clubResponse.ok) {
        error = clubPayload?.error || "Failed to fetch club submissions.";
        clubSubmissions = [];
        return;
      }
      clubSubmissions = clubPayload?.submissions || [];
    } catch {
      error = "Network error while loading submissions.";
      sportSubmissions = [];
      clubSubmissions = [];
    } finally {
      loading = false;
    }
  };

  const reviewSport = async (id, action) => {
    error = "";
    info = "";
    try {
      const response = await apiFetch(`/api/admin/submissions/${id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken
        },
        body: JSON.stringify({ action })
      });
      const payload = await response.json();
      if (!response.ok) {
        error = payload?.error || `Failed to ${action} submission.`;
        return;
      }
      info = `Sport submission ${action}d.`;
      sportSubmissions = sportSubmissions.filter((item) => item.id !== id);
    } catch {
      error = "Network error while moderating.";
    }
  };

  const reviewClub = async (id, action) => {
    error = "";
    info = "";
    try {
      const response = await apiFetch(`/api/admin/club-submissions/${id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken
        },
        body: JSON.stringify({ action })
      });
      const payload = await response.json();
      if (!response.ok) {
        error = payload?.error || `Failed to ${action} club submission.`;
        return;
      }
      info = `Club submission ${action}d.`;
      clubSubmissions = clubSubmissions.filter((item) => item.id !== id);
    } catch {
      error = "Network error while moderating.";
    }
  };

  onMount(() => {
    const stored = localStorage.getItem("sports_admin_token");
    if (stored) adminToken = stored;
  });

  $: if (adminToken) {
    localStorage.setItem("sports_admin_token", adminToken);
  }
</script>

<svelte:head>
  <title>Admin moderation</title>
</svelte:head>

<div class="min-h-screen bg-background py-16 px-6">
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="text-center">
      <h1 class="text-4xl font-black tracking-tight">Admin Moderation</h1>
      <p class="text-muted-foreground mt-2">
        Approve or reject submitted sports and local clubs before they appear in recommendations.
      </p>
    </div>

    <div class="bg-card border border-border rounded-2xl p-6 space-y-4">
      <label class="block text-sm font-semibold" for="adminToken">Admin token</label>
      <div class="flex flex-wrap gap-3">
        <input
          id="adminToken"
          type="password"
          bind:value={adminToken}
          class="flex-1 min-w-64 rounded-lg border border-border bg-background px-3 py-2"
          placeholder="Set ADMIN_TOKEN on the server"
        />
        <Button variant="hero" onclick={fetchPending} disabled={loading}>
          {loading ? "Loading..." : "Load pending"}
        </Button>
      </div>
      {#if error}
        <p class="text-sm text-destructive">{error}</p>
      {/if}
      {#if info}
        <p class="text-sm text-accent">{info}</p>
      {/if}
    </div>

    <div class="space-y-4">
      <h2 class="text-2xl font-black tracking-tight">Pending Sport Submissions</h2>
      {#if sportSubmissions.length === 0 && !loading}
        <div class="bg-card border border-border rounded-2xl p-6 text-muted-foreground">
          No pending sport submissions.
        </div>
      {:else}
        {#each sportSubmissions as submission}
          <article class="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div>
              <h2 class="text-2xl font-bold">{submission.sportName}</h2>
              <p class="text-sm text-muted-foreground">
                Difficulty: {submission.difficulty} • Submitted: {submission.createdAt}
              </p>
            </div>

            <p class="text-sm text-muted-foreground">{submission.description || "No description provided."}</p>

            <div class="grid gap-2">
              {#each Object.entries(submission.answers || {}) as [questionId, answer]}
                <div class="text-sm">
                  <span class="font-semibold">{questionMap[questionId]?.label || questionId}:</span>
                  <span class="text-muted-foreground ml-2">
                    {questionMap[questionId]?.options?.[answer] || answer}
                  </span>
                </div>
              {/each}
            </div>

            <div class="flex gap-3">
              <Button variant="accept" onclick={() => reviewSport(submission.id, "approve")}>Approve</Button>
              <Button variant="reject" onclick={() => reviewSport(submission.id, "reject")}>Reject</Button>
            </div>
          </article>
        {/each}
      {/if}

      <h2 class="text-2xl font-black tracking-tight mt-8">Pending Club Submissions</h2>
      {#if clubSubmissions.length === 0 && !loading}
        <div class="bg-card border border-border rounded-2xl p-6 text-muted-foreground">
          No pending club submissions.
        </div>
      {:else}
        {#each clubSubmissions as club}
          <article class="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div>
              <h3 class="text-2xl font-bold">{club.clubName}</h3>
              <p class="text-sm text-muted-foreground">
                Sport: {club.sportName} • Submitted: {club.createdAt}
              </p>
            </div>

            <div class="grid gap-2 text-sm">
              <p><span class="font-semibold">Location:</span> <span class="text-muted-foreground">{club.location}</span></p>
              <p><span class="font-semibold">Distance:</span> <span class="text-muted-foreground">{club.distance || "N/A"}</span></p>
              <p><span class="font-semibold">Time:</span> <span class="text-muted-foreground">{club.time || "N/A"}</span></p>
            </div>

            <div class="flex gap-3">
              <Button variant="accept" onclick={() => reviewClub(club.id, "approve")}>Approve</Button>
              <Button variant="reject" onclick={() => reviewClub(club.id, "reject")}>Reject</Button>
            </div>
          </article>
        {/each}
      {/if}
    </div>
  </div>
</div>
