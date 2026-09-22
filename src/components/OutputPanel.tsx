export function OutputPanel() {
  return (
    <>
      <h3>Live Output</h3>
      <div id="output" className="output">
        <div id="content"></div>
        <div id="status"></div>
        <pre id="log"></pre>
      </div>
    </>
  );
}
