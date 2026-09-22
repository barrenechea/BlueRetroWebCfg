export function setProgress(percent: number) {
  const progress = document.querySelector(
    "#progress_bar .percent",
  ) as HTMLElement | null;
  if (progress) {
    progress.style.width = percent + "%";
    progress.textContent = percent + "%";
  }
}
