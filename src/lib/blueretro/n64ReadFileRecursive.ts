import { pakSize } from "../constants";
import type { CancelRef, ProgressFn } from "../types";

export const n64ReadFileRecursive = (
  chrc: BluetoothRemoteGATTCharacteristic,
  data: Uint8Array,
  offset: number,
  setProgress: ProgressFn,
  cancel: CancelRef,
): Promise<Uint8Array> => {
  return new Promise(function (resolve, reject) {
    if (cancel.current === 1) {
      throw new Error("Cancelled");
    }
    setProgress(Math.round((offset / pakSize) * 100));
    chrc
      .readValue()
      .then((value) => {
        const tmp = new Uint8Array(value.buffer);
        data.set(tmp, offset);
        offset += value.byteLength;
        if (offset < pakSize) {
          resolve(
            n64ReadFileRecursive(chrc, data, offset, setProgress, cancel),
          );
        } else {
          resolve(data);
        }
      })
      .catch((error) => {
        reject(error instanceof Error ? error : new Error(String(error)));
      });
  });
};

export default n64ReadFileRecursive;
