interface ConnectButtonProps {
  hint: string;
  onClick: () => void;
}

export function ConnectButton({ hint, onClick }: ConnectButtonProps) {
  return (
    <div id="divBtConn">
      <button id="btConn" onClick={onClick}>
        Connect BlueRetro
      </button>
      <br />
      <small>
        <i>{hint}</i>
      </small>
    </div>
  );
}
