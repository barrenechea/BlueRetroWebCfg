export function setProgress(percent: number) {
  const progress = document.querySelector(
    "#progress_bar .percent",
  ) as HTMLElement | null;
  if (progress) {
    progress.style.width = percent + "%";
    progress.textContent = percent + "%";
  }
}

export function resetProgress() {
  setProgress(0);
}

export function showProgressBar() {
  const bar = document.getElementById("progress_bar");
  if (bar) {
    bar.className = "loading";
  }
}
