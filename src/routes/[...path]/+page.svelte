<script>
  import { goto } from "$app/navigation";
  import { Button } from "@/lib/components/ui/button";
</script>

<div class="min-h-screen flex items-center justify-center bg-background px-6">
  <div class="text-center max-w-md">
    <p class="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">404</p>
    <h1 class="text-4xl font-black tracking-tight mb-4">Page Not Found</h1>
    <p class="text-muted-foreground mb-8">This route does not exist in Sportinder.</p>

    <Button variant="hero" onclick={() => goto("/")}>Back to Home</Button>
  </div>
</div>
