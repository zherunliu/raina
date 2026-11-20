import { createFileRoute } from "@tanstack/react-router";
import { ExplorePage } from "@/components/explore-page";
export const Route = createFileRoute("/_authenticated/explore")({
  component: ExplorePage,
});
