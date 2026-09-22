import { urlLatestRelease } from "../constants";

export const getLatestRelease = async (): Promise<string> => {
  try {
    const rsp = await fetch(urlLatestRelease);
    const data = (await rsp.json()) as { tag_name: string };
    let latest_ver = data["tag_name"];
    return latest_ver;
  } catch {
    return "";
  }
};

export default getLatestRelease;
