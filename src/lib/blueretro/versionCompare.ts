export const versionCompare = (v1: string, v2: string): number => {
  let vnum1 = 0,
    vnum2 = 0;

  for (let i = 0, j = 0; i < v1.length || j < v2.length;) {
    while (i < v1.length && v1[i] !== ".") {
      vnum1 = vnum1 * 10 + (v1.charCodeAt(i) - 48);
      i++;
    }

    while (j < v2.length && v2[j] !== ".") {
      vnum2 = vnum2 * 10 + (v2.charCodeAt(j) - 48);
      j++;
    }

    if (vnum1 > vnum2) return 1;
    if (vnum2 > vnum1) return -1;

    vnum1 = vnum2 = 0;
    i++;
    j++;
  }
  return 0;
};

export default versionCompare;
