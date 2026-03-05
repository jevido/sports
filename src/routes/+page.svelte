<script>
  import HeroSection from "@/lib/components/HeroSection.svelte";
  import SportQuiz from "@/lib/components/SportQuiz.svelte";
</script>

<div class="min-h-screen bg-background">
  <HeroSection />

  <section id="quiz" class="py-24 px-6 relative">
    <div class="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.02] to-background"></div>
    <div class="max-w-6xl mx-auto relative z-10">
      <div class="text-center mb-16">
        <span class="text-xs font-bold uppercase tracking-widest text-primary mb-4 block">Personalized For You</span>
        <h2 class="text-4xl md:text-5xl font-black tracking-tight mb-4">What Sport Fits You?</h2>
        <p class="text-lg text-muted-foreground max-w-xl mx-auto">
          Answer 10 quick questions, then swipe through multiple recommendations tailored to your vibe.
        </p>
      </div>

      <SportQuiz />
    </div>
  </section>
</div>
