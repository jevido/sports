<script>
  import { Zap, MapPin, Users } from "lucide-svelte";
  import { Button } from "@/lib/components/ui/button";

  const scrollToQuiz = () => {
    document.getElementById("quiz")?.scrollIntoView({ behavior: "smooth" });
  };
</script>

<section class="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden">
  <div class="absolute inset-0 overflow-hidden">
    <div class="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-pulse-glow"></div>
    <div class="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-secondary/10 blur-3xl animate-pulse-glow" style="animation-delay: 1s"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl"></div>
  </div>

  <div
    class="absolute inset-0 opacity-[0.03]"
    style="background-image: linear-gradient(hsl(185 100% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(185 100% 50%) 1px, transparent 1px); background-size: 60px 60px;"
  ></div>

  <div class="relative z-10 text-center max-w-4xl mx-auto px-6">
    <div class="mb-8 animate-card-enter">
      <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 backdrop-blur-sm mb-6 animate-neon-pulse">
        <Zap size={40} class="text-primary" />
      </div>
    </div>

    <h1 class="text-5xl md:text-8xl font-black tracking-tight mb-6 animate-card-enter" style="animation-delay: 0.2s">
      <span class="text-foreground">FIND YOUR</span>
      <span class="block text-glow text-primary">SPORT</span>
    </h1>

    <p class="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto animate-card-enter" style="animation-delay: 0.4s">
      Answer a few questions and we'll match you with the perfect sport based on your personality, lifestyle, and goals.
    </p>

    <div class="flex flex-wrap justify-center gap-8 mb-12 animate-card-enter" style="animation-delay: 0.6s">
      <div class="flex items-center gap-2 text-muted-foreground">
        <MapPin size={20} class="text-primary" />
        <span class="text-sm font-semibold uppercase tracking-wider">Nearby</span>
      </div>
      <div class="flex items-center gap-2 text-muted-foreground">
        <Users size={20} class="text-secondary" />
        <span class="text-sm font-semibold uppercase tracking-wider">Teams</span>
      </div>
      <div class="flex items-center gap-2 text-muted-foreground">
        <Zap size={20} class="text-accent" />
        <span class="text-sm font-semibold uppercase tracking-wider">Matched</span>
      </div>
    </div>

    <div class="animate-card-enter" style="animation-delay: 0.8s">
      <Button
        variant="hero"
        size="lg"
        onclick={scrollToQuiz}
        className="text-lg px-10 py-6 h-auto font-black uppercase tracking-wider"
      >
        <Zap size={20} />
        Take the Quiz
      </Button>
    </div>

    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
      <div class="w-6 h-10 border-2 border-primary/30 rounded-full flex justify-center">
        <div class="w-1 h-3 bg-primary/50 rounded-full mt-2 animate-pulse"></div>
      </div>
    </div>
  </div>
</section>
