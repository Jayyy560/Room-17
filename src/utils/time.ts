export const ACTIVATION_START_HOUR = 15; // 3 PM
export const ACTIVATION_END_HOUR = 17; // 5 PM

export const activationWindowBounds = (reference: Date) => {
  const start = new Date(reference);
  start.setHours(ACTIVATION_START_HOUR, 0, 0, 0);
  const end = new Date(reference);
  end.setHours(ACTIVATION_END_HOUR, 0, 0, 0);
  return { start, end };
};

export const isInActivationWindow = (now: Date) => {
  const { start, end } = activationWindowBounds(now);
  return now >= start && now <= end;
};

export const nextActivationWindow = (now: Date) => {
  const start = new Date(now);
  start.setHours(ACTIVATION_START_HOUR, 0, 0, 0);
  if (now <= start) return start;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(ACTIVATION_START_HOUR, 0, 0, 0);
  return tomorrow;
};

export const msToCountdown = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
