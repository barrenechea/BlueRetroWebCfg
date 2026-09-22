export const ChromeSamples = {
  log: function (...arguments_: unknown[]) {
    const line = arguments_
      .map((argument) =>
        typeof argument === "string" ? argument : JSON.stringify(argument),
      )
      .join(" ");

    const logEl = document.querySelector("#log");
    if (logEl) {
      logEl.textContent += line + "\n";
    }
  },

  clearLog: function () {
    const logEl = document.querySelector("#log");
    if (logEl) {
      logEl.textContent = "";
    }
  },

  setStatus: function (status: string) {
    const statusEl = document.querySelector("#status");
    if (statusEl) {
      statusEl.textContent = status;
    }
  },

  setContent: function (newContent: Node) {
    const content = document.querySelector("#content");
    if (content) {
      while (content.hasChildNodes() && content.lastChild) {
        content.removeChild(content.lastChild);
      }
      content.appendChild(newContent);
    }
  },
};

export const log = (...args: unknown[]) => ChromeSamples.log(...args);
