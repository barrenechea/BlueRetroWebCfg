import { urlLatestRelease } from "../constants";

interface Release {
  name: string | null;
  tag_name: string;
}

// The dev prerelease is tagged "dev", so the version comes from its name
// ("Development build v26.09-dev-34-g15bb4b7") when the tag isn't one.
const VERSION = /v\d+\.\d+[\w.-]*/;

export const getLatestRelease = async (): Promise<string> => {
  try {
    const rsp = await fetch(urlLatestRelease);
    const [release] = (await rsp.json()) as Release[];
    return (
      release.tag_name.match(VERSION)?.[0] ??
      release.name?.match(VERSION)?.[0] ??
      ""
    );
  } catch {
    return "";
  }
};

export default getLatestRelease;
