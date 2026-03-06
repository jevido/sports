<script>
  import { onMount } from "svelte";
  import { Button } from "@/lib/components/ui/button";
  import { quizQuestions } from "@/lib/quiz-questions";
  import { apiFetch } from "@/lib/api";

  let adminToken = "";
  let sportSubmissions = [];
  let clubSubmissions = [];
  let managedProfiles = [];
  let managedClubs = [];
  let loading = false;
  let loadingManage = false;
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

  const withProfileKeys = (profiles) =>
    profiles.map((profile) => ({
      ...profile,
      profileKey: profile.profileKey || profile.sportName
    }));

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

  const fetchManaged = async () => {
    error = "";
    info = "";
    if (!adminToken.trim()) {
      error = "Enter admin token.";
      return;
    }

    loadingManage = true;
    try {
      const profileResponse = await apiFetch("/api/admin/sport-profiles", {
        headers: { "x-admin-token": adminToken }
      });
      const profilePayload = await profileResponse.json();
      if (!profileResponse.ok) {
        error = profilePayload?.error || "Failed to fetch managed sport profiles.";
        managedProfiles = [];
        return;
      }
      managedProfiles = withProfileKeys(profilePayload?.profiles || []);

      const clubResponse = await apiFetch("/api/admin/sport-clubs", {
        headers: { "x-admin-token": adminToken }
      });
      const clubPayload = await clubResponse.json();
      if (!clubResponse.ok) {
        error = clubPayload?.error || "Failed to fetch managed clubs.";
        managedClubs = [];
        return;
      }
      managedClubs = clubPayload?.clubs || [];
    } catch {
      error = "Network error while loading managed data.";
      managedProfiles = [];
      managedClubs = [];
    } finally {
      loadingManage = false;
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

  const updateProfileField = (index, key, value) => {
    managedProfiles = managedProfiles.map((profile, currentIndex) =>
      currentIndex === index ? { ...profile, [key]: value } : profile
    );
  };

  const updateProfileAnswerField = (index, questionId, value) => {
    managedProfiles = managedProfiles.map((profile, currentIndex) =>
      currentIndex === index
        ? {
          ...profile,
          recommendedAnswers: { ...(profile.recommendedAnswers || {}), [questionId]: value }
        }
        : profile
    );
  };

  const saveProfile = async (profile) => {
    error = "";
    info = "";
    try {
      const response = await apiFetch(`/api/admin/sport-profiles/${encodeURIComponent(profile.profileKey)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken
        },
        body: JSON.stringify({
          sportName: profile.sportName,
          description: profile.description || "",
          difficulty: profile.difficulty,
          recommendedAnswers: profile.recommendedAnswers
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        error = payload?.error || "Failed to save sport profile.";
        return;
      }
      managedProfiles = withProfileKeys(payload?.profiles || managedProfiles);
      info = "Sport profile updated.";
    } catch {
      error = "Network error while saving sport profile.";
    }
  };

  const deleteProfile = async (profile) => {
    error = "";
    info = "";
    try {
      const response = await apiFetch(`/api/admin/sport-profiles/${encodeURIComponent(profile.profileKey)}`, {
        method: "DELETE",
        headers: {
          "x-admin-token": adminToken
        }
      });
      const payload = await response.json();
      if (!response.ok) {
        error = payload?.error || "Failed to delete sport profile.";
        return;
      }
      managedProfiles = withProfileKeys(payload?.profiles || []);
      managedClubs = payload?.clubs || managedClubs;
      info = "Sport profile deleted.";
    } catch {
      error = "Network error while deleting sport profile.";
    }
  };

  const updateClubField = (index, key, value) => {
    managedClubs = managedClubs.map((club, currentIndex) =>
      currentIndex === index ? { ...club, [key]: value } : club
    );
  };

  const saveClub = async (club) => {
    error = "";
    info = "";
    try {
      const response = await apiFetch(`/api/admin/sport-clubs/${club.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken
        },
        body: JSON.stringify({
          sportName: club.sportName,
          clubName: club.clubName,
          location: club.location,
          distance: club.distance || "",
          time: club.time || ""
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        error = payload?.error || "Failed to save club.";
        return;
      }
      managedClubs = payload?.clubs || managedClubs;
      info = "Club updated.";
    } catch {
      error = "Network error while saving club.";
    }
  };

  const deleteClub = async (clubId) => {
    error = "";
    info = "";
    try {
      const response = await apiFetch(`/api/admin/sport-clubs/${clubId}`, {
        method: "DELETE",
        headers: {
          "x-admin-token": adminToken
        }
      });
      const payload = await response.json();
      if (!response.ok) {
        error = payload?.error || "Failed to delete club.";
        return;
      }
      managedClubs = payload?.clubs || [];
      info = "Club deleted.";
    } catch {
      error = "Network error while deleting club.";
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
        <Button variant="ghost" onclick={fetchManaged} disabled={loadingManage}>
          {loadingManage ? "Loading..." : "Load managed"}
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

      <h2 class="text-2xl font-black tracking-tight mt-8">Manage Approved Sports</h2>
      {#if managedProfiles.length === 0 && !loadingManage}
        <div class="bg-card border border-border rounded-2xl p-6 text-muted-foreground">
          No approved sport profiles loaded.
        </div>
      {:else}
        {#each managedProfiles as profile, profileIndex}
          <article class="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div class="grid gap-4 sm:grid-cols-3">
              <div class="space-y-2 sm:col-span-2">
                <label class="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sport name</label>
                <input
                  class="w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={profile.sportName}
                  oninput={(event) => updateProfileField(profileIndex, "sportName", event.currentTarget.value)}
                />
              </div>
              <div class="space-y-2">
                <label class="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Difficulty</label>
                <select
                  class="w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={profile.difficulty}
                  onchange={(event) => updateProfileField(profileIndex, "difficulty", event.currentTarget.value)}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div class="space-y-2">
              <label class="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</label>
              <textarea
                class="w-full rounded-lg border border-border bg-background px-3 py-2 min-h-20"
                value={profile.description || ""}
                oninput={(event) => updateProfileField(profileIndex, "description", event.currentTarget.value)}
              ></textarea>
            </div>

            <div class="grid gap-3 md:grid-cols-2">
              {#each quizQuestions as question}
                <div class="space-y-1">
                  <label class="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{question.question}</label>
                  <select
                    class="w-full rounded-lg border border-border bg-background px-3 py-2"
                    value={profile.recommendedAnswers?.[question.id]}
                    onchange={(event) => updateProfileAnswerField(profileIndex, question.id, event.currentTarget.value)}
                  >
                    {#each question.options as option}
                      <option value={option.value}>{option.label}</option>
                    {/each}
                  </select>
                </div>
              {/each}
            </div>

            <div class="flex gap-3">
              <Button variant="accept" onclick={() => saveProfile(profile)}>Save</Button>
              <Button variant="reject" onclick={() => deleteProfile(profile)}>Delete</Button>
            </div>
          </article>
        {/each}
      {/if}

      <h2 class="text-2xl font-black tracking-tight mt-8">Manage Approved Clubs</h2>
      {#if managedClubs.length === 0 && !loadingManage}
        <div class="bg-card border border-border rounded-2xl p-6 text-muted-foreground">
          No approved clubs loaded.
        </div>
      {:else}
        {#each managedClubs as club, clubIndex}
          <article class="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-2">
                <label class="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sport</label>
                <input
                  class="w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={club.sportName}
                  oninput={(event) => updateClubField(clubIndex, "sportName", event.currentTarget.value)}
                />
              </div>
              <div class="space-y-2">
                <label class="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Club name</label>
                <input
                  class="w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={club.clubName}
                  oninput={(event) => updateClubField(clubIndex, "clubName", event.currentTarget.value)}
                />
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-3">
              <div class="space-y-2 sm:col-span-2">
                <label class="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</label>
                <input
                  class="w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={club.location}
                  oninput={(event) => updateClubField(clubIndex, "location", event.currentTarget.value)}
                />
              </div>
              <div class="space-y-2">
                <label class="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Distance</label>
                <input
                  class="w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={club.distance || ""}
                  oninput={(event) => updateClubField(clubIndex, "distance", event.currentTarget.value)}
                />
              </div>
            </div>

            <div class="space-y-2">
              <label class="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time</label>
              <input
                class="w-full rounded-lg border border-border bg-background px-3 py-2"
                value={club.time || ""}
                oninput={(event) => updateClubField(clubIndex, "time", event.currentTarget.value)}
              />
            </div>

            <div class="flex gap-3">
              <Button variant="accept" onclick={() => saveClub(club)}>Save</Button>
              <Button variant="reject" onclick={() => deleteClub(club.id)}>Delete</Button>
            </div>
          </article>
        {/each}
      {/if}
    </div>
  </div>
</div>
