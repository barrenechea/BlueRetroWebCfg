import { PageLayout } from "../components/PageLayout";

export function Index() {
  return (
    <PageLayout title="BlueRetro Web config">
      <p style={{ textAlign: "center" }}>
        <a href="https://blueretro.com/products/brx">
          <img src="/brx_banner.png" alt="BlueRetro BRX" />
        </a>
      </p>
      <br />
      Please consult the documentation found on the wiki:
      <br />
      <a
        href="https://github.com/darthcloud/BlueRetro/wiki/BlueRetro-BLE-Web-Config-User-Manual"
        target="_blank"
      >
        BlueRetro BLE Web Config User Manual
      </a>
      <br />
      <br />
      <p>
        <a href="/advance">BlueRetro Advance config</a>
      </p>
      <p>
        <a href="/presets">BlueRetro Presets config</a>
      </p>
      <p>
        <a href="/system">BlueRetro System manager</a>
      </p>
      <p>
        <a href="/ota">BlueRetro OTA FW update</a>
      </p>
      <p>
        <a href="/files">BlueRetro Files Manager</a>
      </p>
      <p>
        <a href="/n64_ctrlpak">BlueRetro N64 controller pak manager</a>
      </p>
      <p>
        <a href="/dc_vmu">BlueRetro DC VMU manager</a>
      </p>
      <p>
        <a href="/debug">BlueRetro Debug</a>
      </p>
    </PageLayout>
  );
}
