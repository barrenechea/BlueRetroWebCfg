interface CfgSelectionProps {
  currentCfg: number;
  hasGameId: boolean;
  onSwitchToGameId: () => void;
  onSwitchToGlobal: () => void;
}

export function CfgSelection({
  currentCfg,
  hasGameId,
  onSwitchToGameId,
  onSwitchToGlobal,
}: CfgSelectionProps) {
  return (
    <div id="divCfgSel" style={{ marginBottom: "1em" }}>
      <h2 style={{ margin: 0 }}>Config Selection</h2>
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
