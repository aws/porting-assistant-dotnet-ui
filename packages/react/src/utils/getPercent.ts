export const getPercent = (numerator: number, denominator: number) => {
  const value = getPercentNumber(numerator, denominator);
  if (value == null) {
    return "-";
  }
  return `${value}%`;
};

export const getPercentNumber = (numerator: number, denominator: number) => {
  if (denominator === 0) {
    return null;
  }
  const value = Math.round((numerator / denominator) * 100);
  return value;
};
