import { mtu } from "../constants";
import type { CancelRef, ProgressFn } from "../types";

const otaWriteFwRecursive = (
  chrc: BluetoothRemoteGATTCharacteristic,
  data: ArrayBuffer,
  offset: number,
  setProgress: ProgressFn,
  cancel: CancelRef,
): Promise<void> => {
  return new Promise(function (resolve, reject) {
    if (cancel.current === 1) {
      throw new Error("Cancelled");
    }
    setProgress(Math.round((offset / data.byteLength) * 100));
    let tmpViewSize = data.byteLength - offset;
    if (tmpViewSize > mtu) {
      tmpViewSize = mtu;
    }
    const tmpView = new DataView(data, offset, tmpViewSize);
    chrc
      .writeValue(tmpView)
      .then(() => {
        offset += Number(mtu);
        if (offset < data.byteLength) {
          resolve(otaWriteFwRecursive(chrc, data, offset, setProgress, cancel));
        } else {
          resolve();
        }
      })
      .catch((error) => {
        reject(error instanceof Error ? error : new Error(String(error)));
      });
  });
};

export default otaWriteFwRecursive;
