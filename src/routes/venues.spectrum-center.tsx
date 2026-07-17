import { createFileRoute, notFound } from "@tanstack/react-router";
import { VenueWorkspace } from "@/components/venue/VenueWorkspace";
import { repository } from "@/lib/drt/repository";

export const Route = createFileRoute("/venues/spectrum-center")({
  head: () => ({
    meta: [
      { title: "Spectrum Center · DRT Venue Twin" },
      {
        name: "description",
        content:
          "Pilot venue workspace for Spectrum Center — Damascus Road Tour Spring 2027 planning geometry, rigging references and placement notes.",
      },
      { property: "og:title", content: "Spectrum Center · DRT Venue Twin" },
      {
        property: "og:description",
        content: "DRT at Spectrum Center — planning, rigging references and sources.",
      },
    ],
  }),
  loader: () => {
    const venue = repository.getVenue("spectrum-center");
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
