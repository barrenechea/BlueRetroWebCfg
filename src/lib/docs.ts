const REPO = "https://github.com/barrenechea/BlueRetro";
const WIKI = REPO + "/wiki";

export interface DocRef {
  href: string;
  label: string;
}

/**
 * One wiki page per documented section: GitHub wikis don't scroll to a
 * `#heading` link on page load, so section anchors would land at the top.
 * The label is the page title GitHub shows, minus the shared prefix.
 */
function page(name: string): DocRef {
  return {
    href: WIKI + "/" + name,
    label: name.replace(/^Web-Config-/, "").replace(/-/g, " "),
  };
}

export const links = {
  repo: REPO,
  releases: REPO + "/releases",
  wiki: WIKI,
  mempak: "https://bryc.github.io/mempak",
  mempakAuthor: "https://github.com/bryc",
};

export const docs = {
  manual: page("BlueRetro-BLE-Web-Config-User-Manual"),
  advance: page("Web-Config-Advance-Config"),
  cfgSelection: page("Web-Config-Config-Selection"),
  globalCfg: page("Web-Config-Global-Config"),
  outputCfg: page("Web-Config-Output-Config"),
  mappingCfg: page("Web-Config-Mapping-Config"),
  presets: page("Web-Config-Presets"),
  system: page("Web-Config-System-Manager"),
  ota: page("Web-Config-OTA-FW-Update"),
  files: page("Web-Config-Files-Manager"),
  n64CtrlPak: page("Web-Config-N64-Controller-Pak-Manager"),
  dcVmu: page("Web-Config-DC-VMU-Manager"),
  debugTrace: page("Debug-trace"),
};
