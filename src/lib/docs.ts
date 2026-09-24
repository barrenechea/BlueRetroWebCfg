const REPO = "https://github.com/darthcloud/BlueRetro";
const WIKI = REPO + "/wiki";
const MANUAL = WIKI + "/BlueRetro-BLE-Web-Config-User-Manual";

export interface DocRef {
  href: string;
  label: string;
}

/**
 * GitHub derives a heading's anchor from the heading text, so one string gives
 * both the link and the label. Keep these identical to the wiki headings.
 */
function section(heading: string): DocRef {
  const anchor = heading
    .toLowerCase()
    .replace(/[^\w\- ]/g, "")
    .replace(/ /g, "-");
  return { href: MANUAL + "#" + anchor, label: heading };
}

export const links = {
  repo: REPO,
  releases: REPO + "/releases",
  wiki: WIKI,
  mempak: "https://bryc.github.io/mempak",
  mempakAuthor: "https://github.com/bryc",
};

export const docs = {
  manual: { href: MANUAL, label: "BlueRetro BLE Web Config User Manual" },
  advance: section("2 - Advance config page"),
  cfgSelection: section("2.1 - Config selection"),
  globalCfg: section("2.2 - Global config"),
  outputCfg: section("2.3 - Output config"),
  mappingCfg: section("2.4 - Mapping config"),
  presets: section("3 - Presets page"),
  system: section("4 - System manager page"),
  ota: section("5 - OTA FW update page"),
  files: section("6 - Files manager page"),
  n64CtrlPak: section("7.1 - N64 controller pak manager page"),
  dcVmu: section("7.2 - DC VMU manager page"),
  debugTrace: {
    href: "https://github.com/darthcloud/BlueRetroWiki/blob/master/Debug-trace.md",
    label: "Debug Trace Documentation",
  },
};
