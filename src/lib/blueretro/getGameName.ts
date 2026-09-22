import initSqlJs from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";

// gameid.db is served from /public; the wasm comes from the sql.js npm
// package (emitted as a hashed asset by Vite).
export const getGameName = async (
  gameid: string,
): Promise<string | undefined> => {
  const rsp = await fetch("gameid.db");
  const data = await rsp.arrayBuffer();
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const db = new SQL.Database(new Uint8Array(data));
  const gamename = db.exec(
    "SELECT name FROM 'games' WHERE id=\"" + gameid + '" LIMIT 1',
  );
  try {
    return gamename[0].values[0][0] as string;
  } catch {
    return undefined;
  }
};

export default getGameName;
