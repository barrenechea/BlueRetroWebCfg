interface DivInfoProps {
  name: string;
  bdaddr: string;
  appVer: string;
  latestVer: string;
  game?: string;
  gameid?: string;
}

export function DivInfo({
  name,
  bdaddr,
  appVer,
  latestVer,
  game,
  gameid,
}: DivInfoProps) {
  return (
    <div id="divInfo" style={{ marginBottom: "1em" }}>
      Connected to: {name} ({bdaddr}) [{appVer}]
      {game !== undefined && (
        <>
          <br /> Current Game: {game} ({gameid})
        </>
      )}
      {appVer.indexOf(latestVer) === -1 && (
        <>
          <br />
          <br />
          Download latest FW {latestVer} from{" "}
          <a
            href="https://github.com/darthcloud/BlueRetro/releases"
            target="_blank"
          >
            GitHub
          </a>
        </>
      )}
    </div>
  );
}
