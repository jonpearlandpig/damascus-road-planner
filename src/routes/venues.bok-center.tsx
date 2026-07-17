import { createFileRoute, notFound } from "@tanstack/react-router";
import { VenueWorkspace } from "@/components/venue/VenueWorkspace";
import { repository } from "@/lib/drt/repository";

export const Route = createFileRoute("/venues/bok-center")({
  head: () => ({
    meta: [
      { title: "BOK Center · DRT Venue Twin" },
      {
        name: "description",
        content:
          "Reuse-test venue workspace for BOK Center — Damascus Road Tour Spring 2027.",
      },
    ],
  }),
  loader: () => {
    const venue = repository.getVenue("bok-center");
    const placement = venue ? repository.getPlacement(venue.id) : undefined;
    const pkg = placement ? repository.getPackage(placement.packageId) : undefined;
    if (!venue || !placement || !pkg) throw notFound();
    return { venue, placement, pkg };
  },
  component: Page,
});

function Page() {
  const { venue, placement, pkg } = Route.useLoaderData();
  return <VenueWorkspace venue={venue} tourPackage={pkg} placement={placement} />;
}
