export const calculateLevel = (braveryPoints: number) => {
  if (braveryPoints >= 300) return 4;
  if (braveryPoints >= 150) return 3;
  if (braveryPoints >= 50) return 2;
  return 1;
};
