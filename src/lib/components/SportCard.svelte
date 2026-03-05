<script>
  import { Heart, X, MapPin, Users, Clock } from "lucide-svelte";
  import { Button } from "@/lib/components/ui/button";
  import { cn } from "@/lib/utils";
  import { createEventDispatcher } from "svelte";

  export let id;
  export let name;
  export let image;
  export let location;
  export let distance;
  export let participants;
  export let maxParticipants;
  export let time;
  export let description;
  export let difficulty;
  export let className = "";

  const dispatch = createEventDispatcher();

  let isAnimating = false;
  let swipeDirection = null;

  const handleSwipe = (direction) => {
    isAnimating = true;
    swipeDirection = direction;
    dispatch("swipe", { direction, sportId: id });

    setTimeout(() => {
      isAnimating = false;
      swipeDirection = null;
    }, 500);
  };

  const getDifficultyColor = (level) => {
    switch (level) {
      case "Beginner":
        return "bg-accent/20 text-accent border border-accent/30";
      case "Intermediate":
        return "bg-secondary/20 text-secondary border border-secondary/30";
      case "Advanced":
        return "bg-destructive/20 text-destructive border border-destructive/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };
</script>

<div
  class={cn(
    "relative w-full max-w-sm mx-auto bg-card rounded-2xl overflow-hidden shadow-card border border-border",
    "animate-card-enter transition-all duration-300",
    isAnimating && swipeDirection === "right" && "animate-swipe-right",
    isAnimating && swipeDirection === "left" && "animate-swipe-left",
    className
  )}
>
  <div class="relative h-72 overflow-hidden">
    <img src={image} alt={name} class="w-full h-full object-cover" />
    <div class="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent"></div>

    <div class={cn("absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold", getDifficultyColor(difficulty))}>
      {difficulty}
    </div>

    <div class="absolute bottom-4 left-4 right-4">
      <h2 class="text-xl font-black mb-1">{name}</h2>
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin size={14} class="text-primary" />
        <span>{location}</span>
        <span class="text-border">•</span>
        <span>{distance}</span>
      </div>
    </div>
  </div>

  <div class="p-5">
    <p class="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>

    <div class="flex items-center justify-between mb-5 text-xs text-muted-foreground">
      <div class="flex items-center gap-1.5">
        <Users size={14} class="text-primary" />
        <span>{participants}/{maxParticipants}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <Clock size={14} class="text-secondary" />
        <span>{time}</span>
      </div>
    </div>

    <div class="flex gap-3">
      <Button variant="reject" size="lg" className="flex-1" onclick={() => handleSwipe("left")}>
        <X size={18} /> Pass
      </Button>
      <Button variant="accept" size="lg" className="flex-1" onclick={() => handleSwipe("right")}>
        <Heart size={18} /> Join
      </Button>
    </div>
  </div>
</div>
