interface CfgSelectionProps {
  currentCfg: number;
  hasGameId: boolean;
  docUrl?: string;
  onSwitchToGameId: () => void;
  onSwitchToGlobal: () => void;
}

export function CfgSelection({
  currentCfg,
  hasGameId,
  docUrl,
  onSwitchToGameId,
  onSwitchToGlobal,
}: CfgSelectionProps) {
  return (
    <div id="divCfgSel" style={{ marginBottom: "1em" }}>
      <h2 style={{ margin: 0 }}>Config Selection</h2>
      {docUrl && (
        <>
          <a href={docUrl} target="_blank">
            Wiki doc for Config Selection
          </a>
          <br />
          <br />
        </>
      )}
      {currentCfg == 0 ? "Current config: Global" : "Current config: GameID"}
      <div style={{ marginTop: "1em" }}>
        {currentCfg == 0 ? (
          hasGameId && (
            <button id="cfgSw" onClick={onSwitchToGameId}>
              Switch to GameID
            </button>
          )
        ) : (
          <button id="cfgSw" onClick={onSwitchToGlobal}>
            Switch to Global
          </button>
        )}
      </div>
    </div>
  );
}
