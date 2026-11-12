"use client";

import React from "react";
import { DEFAULT_VIEWER_RANGES, type ViewerRangeOption } from "@/lib/studio-data";
import { Dashicon } from "@/components/Dashicons";

interface ViewerRangeControlProps {
  value: ViewerRangeOption;
  onChange: (range: ViewerRangeOption) => void;
  label?: string;
  compact?: boolean;
}

/**
 * Selector compartido de audiencia simulada (Viewer Range 4x2)
 * sincronizado entre CAM, TRY ON, DÚO y TikTok Live.
 */
export function ViewerRangeControl({
  value,
  onChange,
  label = "Audiencia simulada",
  compact = false,
}: ViewerRangeControlProps) {
  return (
    <div className={`duo-section-block viewer-range-shared-box ${compact ? "is-compact-card" : ""}`}>
      <div className="duo-section-header-row">
        <span className="duo-section-label">{label}</span>
        <span className="duo-viewer-counter">
          <Dashicon name="visibility" size={13} />
          <span>{value.formattedCount}</span>
        </span>
      </div>

      <div className="duo-viewer-grid" role="group" aria-label="Rango de audiencia simulada">
        {DEFAULT_VIEWER_RANGES.map((range) => {
          const isRangeActive = value.id === range.id;
          return (
            <button
              key={range.id}
              type="button"
              aria-pressed={isRangeActive}
              className={`duo-viewer-pill ${isRangeActive ? "active" : ""}`}
              onClick={() => onChange(range)}
            >
              {range.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
