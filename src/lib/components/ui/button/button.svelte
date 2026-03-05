<script>
  import { cva } from "class-variance-authority";
  import { cn } from "@/lib/utils";

  const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
      variants: {
        variant: {
          default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-card hover:shadow-card-hover",
          destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
          secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          ghost: "hover:bg-accent hover:text-accent-foreground",
          link: "text-primary underline-offset-4 hover:underline",
          hero: "bg-gradient-hero text-white font-bold shadow-glow hover:scale-105 hover:shadow-glow border-0",
          accept: "bg-gradient-accept text-white font-semibold hover:scale-105 transform transition-all duration-300",
          reject: "bg-gradient-reject text-white font-semibold hover:scale-105 transform transition-all duration-300",
          card: "bg-gradient-card text-foreground border border-border hover:shadow-card-hover hover:scale-[1.02] transform transition-all duration-300"
        },
        size: {
          default: "h-10 px-4 py-2",
          sm: "h-9 rounded-md px-3",
          lg: "h-11 rounded-md px-8",
          icon: "h-10 w-10"
        }
      },
      defaultVariants: {
        variant: "default",
        size: "default"
      }
    }
  );

  export let variant = "default";
  export let size = "default";
  export let className = "";
  export let type = "button";
</script>

<button
  {type}
  class={cn(buttonVariants({ variant, size }), className)}
  {...$$restProps}
>
  <slot />
</button>
