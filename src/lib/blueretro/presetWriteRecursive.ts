import { ChromeSamples } from "../logger";

export function presetWriteRecursive(
  cfg: Uint8Array<ArrayBuffer>,
  inputCtrl: Uint16Array<ArrayBuffer>,
  ctrl_chrc: BluetoothRemoteGATTCharacteristic,
  data_chrc: BluetoothRemoteGATTCharacteristic,
): Promise<void> {
  return new Promise(function (resolve, reject) {
    ChromeSamples.log("Set Input Ctrl CHRC... " + inputCtrl[1]);
    ctrl_chrc
      .writeValue(inputCtrl)
      .then(() => {
        ChromeSamples.log("Writing Input Data CHRC...");
        let tmpViewSize = cfg.byteLength - inputCtrl[1];
        if (tmpViewSize > 512) {
          tmpViewSize = 512;
        }
        const tmpView = new DataView(cfg.buffer, inputCtrl[1], tmpViewSize);
        return data_chrc.writeValue(tmpView);
      })
      .then(() => {
        ChromeSamples.log("Input Data Written");
        inputCtrl[1] += Number(512);
        if (inputCtrl[1] < cfg.byteLength) {
          resolve(presetWriteRecursive(cfg, inputCtrl, ctrl_chrc, data_chrc));
        } else {
          resolve();
        }
      })
      .catch((error) => {
        reject(error instanceof Error ? error : new Error(String(error)));
      });
  });
}

export default presetWriteRecursive;
