export const yearsList = (future: number, past: number) => {
  const currentYear = new Date().getFullYear() + future
  const years = []

  for (var i = 0; i < future + past; i++) {
    years.push((currentYear - i).toString())
  }

  return years.reverse()
}
