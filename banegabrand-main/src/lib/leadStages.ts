/** Brand pipeline stages (main stage on a lead) */
export const LEAD_STAGES = [
  { value: "new", label: "New" },
  { value: "answered", label: "Answered" },
  { value: "not_answered", label: "Not Answered" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
] as const;

/** Call / follow-up sub-stages per main stage */
export const LEAD_SUB_STAGES: Record<string, { value: string; label: string }[]> = {
  new: [
    { value: "did_not_pick", label: "Did Not Pick" },
    { value: "switch_off", label: "Switch Off" },
    { value: "will_call_back", label: "Will Call Back" },
    { value: "meeting_booked", label: "Meeting Booked" },
    { value: "business_generated", label: "Business Generated" },
  ],
  answered: [
    { value: "meeting_booked", label: "Meeting Booked" },
    { value: "business_generated", label: "Business Generated" },
    { value: "will_call_back", label: "Will Call Back" },
  ],
  not_answered: [
    { value: "did_not_pick", label: "Did Not Pick" },
    { value: "switch_off", label: "Switch Off" },
    { value: "will_call_back", label: "Will Call Back" },
  ],
  qualified: [
    { value: "meeting_booked", label: "Meeting Booked" },
    { value: "business_generated", label: "Business Generated" },
    { value: "will_call_back", label: "Will Call Back" },
  ],
  converted: [
    { value: "business_generated", label: "Business Generated" },
    { value: "order_confirmed", label: "Order Confirmed" },
  ],
  lost: [
    { value: "did_not_pick", label: "Did Not Pick" },
    { value: "switch_off", label: "Switch Off" },
    { value: "not_interested", label: "Not Interested" },
  ],
};

/** Lead status (synced with pipeline outcomes) */
export const LEAD_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "answered", label: "Answered" },
  { value: "not_answered", label: "Not Answered" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
] as const;

const STAGE_LABELS = Object.fromEntries(LEAD_STAGES.map((s) => [s.value, s.label]));
const SUB_STAGE_LABELS = Object.fromEntries(
  Object.values(LEAD_SUB_STAGES)
    .flat()
    .map((s) => [s.value, s.label]),
);

export function formatStageLabel(value: string | null | undefined): string {
  if (!value) return "-";
  return STAGE_LABELS[value] ?? SUB_STAGE_LABELS[value] ?? value.replace(/_/g, " ");
}

export function getSubStagesForStage(stage: string | null | undefined) {
  if (!stage) return [];
  return LEAD_SUB_STAGES[stage] ?? [];
}

export const DEFAULT_LEAD_STAGE = "new";
