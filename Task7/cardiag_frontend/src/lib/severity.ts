/** Shared color tokens for urgency / confidence badges across screens. */

export function urgencyColor(urgency?: string | null): string {
  switch (urgency?.toUpperCase()) {
    case "CRITICAL":
      return "#FF4444";
    case "HIGH":
      return "#FF6B35";
    case "MEDIUM":
      return "#FFA500";
    case "LOW":
      return "#44D17A";
    default:
      return "#8A8F98";
  }
}

export function confidenceColor(label?: string | null): string {
  switch (label?.toUpperCase()) {
    case "HIGH":
      return "#44D17A";
    case "MEDIUM":
      return "#FFA500";
    case "LOW":
      return "#FF6B35";
    default:
      return "#8A8F98";
  }
}

/** Human-friendly label for an InputType. */
export function inputTypeLabel(type?: string | null): string {
  switch (type?.toUpperCase()) {
    case "IMAGE":
      return "Photo";
    case "AUDIO":
      return "Engine sound";
    case "TEXT":
      return "Description";
    default:
      return "Scan";
  }
}
