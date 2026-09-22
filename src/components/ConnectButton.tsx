interface ConnectButtonProps {
  connected: boolean;
  connecting: boolean;
  hint: string;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectButton({
  connected,
  connecting,
  hint,
  onConnect,
  onDisconnect,
}: ConnectButtonProps) {
  return (
    <div id="divBtConn">
      <button
        id="btConn"
        disabled={connecting}
        onClick={connected ? onDisconnect : onConnect}
      >
        {connected
          ? "Disconnect BlueRetro"
          : connecting
            ? "Connecting..."
            : "Connect BlueRetro"}
      </button>
      <br />
      {!connected && (
        <small>
          <i>{hint}</i>
        </small>
      )}
    </div>
  );
}
