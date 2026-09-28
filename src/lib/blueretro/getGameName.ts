import initSqlJs, { type Database } from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";

let gameDb: Promise<Database> | undefined;

/**
 * Loads the game database once and shares it across lookups, retrying on the
 * next lookup if the load failed. gameid.db is served from /public; the wasm
 * comes from the sql.js npm package (emitted as a hashed asset by Vite).
 */
function loadGameDb(): Promise<Database> {
  gameDb ??= (async () => {
    const [SQL, data] = await Promise.all([
      initSqlJs({ locateFile: () => wasmUrl }),
      fetch("gameid.db").then((rsp) => {
        if (!rsp.ok) throw new Error("gameid.db: HTTP " + rsp.status);
        return rsp.arrayBuffer();
      }),
    ]);
    return new SQL.Database(new Uint8Array(data));
  })().catch((error: unknown) => {
    gameDb = undefined;
    throw error;
  });
  return gameDb;
}

export const getGameName = async (
  gameid: string,
): Promise<string | undefined> => {
  const db = await loadGameDb();
  const [result] = db.exec("SELECT name FROM games WHERE id = ? LIMIT 1", [
    gameid,
  ]);
  const name = result?.values[0]?.[0];
  return typeof name === "string" ? name : undefined;
};

export default getGameName;
