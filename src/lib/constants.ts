export const SC: Record<string, { l: string; bg: string; tc: string }> = {
  draft:       {l:'Draft',       bg:'var(--bg3)',     tc:'var(--t3)'},
  open:        {l:'Open',        bg:'var(--blue-bg)', tc:'var(--blue)'},
  assigned:    {l:'Assigned',    bg:'var(--teal-bg)',tc:'var(--teal)'},
  picked_up:   {l:'Picked Up',   bg:'var(--blue-bg)', tc:'#67E8F9'},
  accepted:    {l:'Accepted',    bg:'var(--blue-bg)', tc:'#22D3EE'},
  in_progress: {l:'In Progress', bg:'var(--amber-bg)',tc:'var(--amber)'},
  submitted:   {l:'Submitted',   bg:'#1C1000',        tc:'#FB923C'},
  under_review:{l:'In Review',   bg:'var(--teal-bg)',tc:'var(--teal)'},
  completed:   {l:'Done',        bg:'var(--green-bg)',tc:'var(--green)'},
  rejected:    {l:'Rejected',    bg:'var(--red-bg)',  tc:'var(--red)'},
  reopened:    {l:'Reopened',    bg:'var(--amber-bg)',tc:'var(--amber)'},
  cancelled:   {l:'Cancelled',   bg:'var(--bg3)',     tc:'var(--t3)'},
  overdue:     {l:'Overdue',     bg:'var(--red-bg)',  tc:'var(--red)'},
};

export const PC: Record<string, { c: string; l: string }> = {
  low:{c:'var(--t3)',l:'Low'},
  medium:{c:'var(--blue)',l:'Med'},
  high:{c:'var(--amber)',l:'High'},
  urgent:{c:'var(--red)',l:'Urgent'}
};

export const CATS = ['Design','Content','QA','Ops','Field','Other'];

export const URGENCY_COLORS = {
  safe:  {color:'#34D399',bg:'rgba(52,211,153,.1)',  border:'rgba(52,211,153,.18)'},
  warn:  {color:'#FBBF24',bg:'rgba(251,191,36,.1)',  border:'rgba(251,191,36,.2)'},
  hot:   {color:'#FB923C',bg:'rgba(251,146,60,.1)',  border:'rgba(251,146,60,.22)'},
  fire:  {color:'#F87171',bg:'rgba(248,113,113,.1)', border:'rgba(248,113,113,.25)'},
  over:  {color:'#F43F5E',bg:'rgba(244,63,94,.12)',  border:'rgba(244,63,94,.3)'},
};

export const PLABELS: Record<string, string> = {
  create:'Create tasks',edit_own:'Edit own tasks',edit_all:'Edit any tasks',
  delete:'Delete tasks',approve:'Approve tasks',invite:'Invite users',
  finance:'View budgets',settings:'Edit settings'
};

export const KCOLS = [
  {id:'open',l:'Open'},
  {id:'in_progress',l:'In Progress'},
  {id:'under_review',l:'In Review'},
  {id:'submitted',l:'Submitted'},
  {id:'completed',l:'Done'}
];
