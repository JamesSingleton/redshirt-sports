export function clampRange(value: number, min = 0, max = 1) {
  return value < min ? min : value > max ? max : value
}
