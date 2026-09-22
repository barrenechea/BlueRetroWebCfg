import { mtu, block } from "../constants";
import type { CancelRef, ProgressFn } from "../types";

export const dcWriteRecursive = (
  chrc: BluetoothRemoteGATTCharacteristic,
  data: ArrayBuffer,
  offset: number,
  transferProgressHook: ProgressFn,
  cancelRef: CancelRef,
): Promise<void> => {
  return new Promise(function (resolve, reject) {
    const curBlock = ~~(offset / block) + 1;
    if (cancelRef.current === 1) {
      throw new Error("Cancelled");
    }
    transferProgressHook(progress(data.byteLength, offset));
    let tmpViewSize = curBlock * block - offset;
    if (tmpViewSize > mtu) {
      tmpViewSize = mtu;
    }
    const tmpView = new DataView(data, offset, tmpViewSize);
    chrc
      .writeValue(tmpView)
      .then(() => {
        offset += tmpViewSize;
        if (offset < data.byteLength) {
          resolve(
            dcWriteRecursive(
              chrc,
              data,
              offset,
              transferProgressHook,
              cancelRef,
            ),
          );
        } else {
          resolve();
        }
      })
      .catch((error) => {
        reject(error instanceof Error ? error : new Error(String(error)));
      });
  });
};

const progress = (total: number, loaded: number): number => {
  const percentLoaded = Math.round((loaded / total) * 100);
  if (percentLoaded < 100) {
    return percentLoaded;
  }
  return percentLoaded;
};

export default dcWriteRecursive;
