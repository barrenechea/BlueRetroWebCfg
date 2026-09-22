interface WikiIntroProps {
  url: string;
  label: string;
}

export function WikiIntro({ url, label }: WikiIntroProps) {
  return (
    <>
      <p style={{ textAlign: "center" }}>
        <a href="https://blueretro.com/products/brx">
          <img src="/brx_banner.png" alt="BlueRetro BRX" />
        </a>
      </p>
      <br />
      Please consult the documentation found on the wiki:
      <br />
      <a href={url} target="_blank">
        {label}
      </a>
      <br />
      <br />
    </>
  );
}
