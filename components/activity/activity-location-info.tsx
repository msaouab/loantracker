"use client";

import { Copy, ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notifyError, notifySuccess } from "@/lib/toast";
import {
  formatAdminLocationSummary,
  toGoogleMapsUrl,
  type IpApiLocationPayload,
} from "@/lib/ip-location-shared";

type ActivityLocationInfoProps = {
  detail: IpApiLocationPayload;
};

export function ActivityLocationInfo({ detail }: ActivityLocationInfoProps) {
  const summary = formatAdminLocationSummary(detail);
  const mapsUrl = toGoogleMapsUrl(detail);
  const metaParts = [
    detail.isp ? `ISP: ${detail.isp}` : null,
    detail.timezone ? detail.timezone : null,
  ].filter(Boolean);

  async function copyMapsLink() {
    if (!mapsUrl) {
      notifyError(null, "No map location available");
      return;
    }

    try {
      await navigator.clipboard.writeText(mapsUrl);
      notifySuccess("Google Maps link copied");
    } catch {
      notifyError(null, "Could not copy link");
    }
  }

  return (
    <div className="space-y-1 rounded-md border border-border/60 bg-muted/30 px-2.5 py-2">
      <div className="flex items-start gap-1.5">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-xs font-medium text-foreground">{summary}</p>
          {metaParts.length > 0 ? (
            <p className="text-xs text-muted-foreground">{metaParts.join(" · ")}</p>
          ) : null}
          {detail.lat != null && detail.lon != null ? (
            <p className="text-xs text-muted-foreground">
              {detail.lat}, {detail.lon}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">IP: {detail.query}</p>
        </div>
      </div>
      {mapsUrl ? (
        <div className="flex flex-wrap items-center gap-1 pl-5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-1.5 text-xs text-muted-foreground"
            onClick={() => void copyMapsLink()}
            aria-label="Copy Google Maps link"
          >
            <Copy className="h-3 w-3" />
            Copy maps link
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-1.5 text-xs text-muted-foreground"
            asChild
          >
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" />
              Open in Maps
            </a>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
