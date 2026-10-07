// Fixed synthetic workload: 400 activity records for each of the first 120 tasks.
// Keep it unchanged when comparing captures. Tasks added later have no history.
export const activity = Array.from({ length: 48000 }, (_, i) => ({
  todo: `task-${String((i % 120) + 1).padStart(3, '0')}`,
  time: (i * 7919) % 100000,
  weight: (i % 7) + 1,
}));
