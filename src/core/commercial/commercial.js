export function markup(cost, percent) {
  return cost + cost * (percent / 100);
}
export function realMargin(cost, percent) {
  return cost / (1 - percent / 100);
}
