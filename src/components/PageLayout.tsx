import { useEffect, type ReactNode } from "react";

interface PageLayoutProps {
  title: string;
  children: ReactNode;
}

export function PageLayout({ title, children }: PageLayoutProps) {
  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <>
      <img className="pageIcon" src="/icon.png" alt="" />
      <h1>{title}</h1>
      <p className="availability">
        <a href="/">Index</a> |{" "}
        <a target="_blank" href="https://github.com/darthcloud/BlueRetro">
          View on GitHub
        </a>
      </p>
      {children}
    </>
  );
}
