"use client";

export function ErrorContent() {
  const url = new URLSearchParams(window.location.hash.replace("#", ""));

  return (
    <>
      {url ? (
        <p className="text-sm text-muted-foreground">
          Error Code: {url.get("error_code")} <br /> Description:{" "}
          {url.get("error_description")}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          An unspecified error occurred.
        </p>
      )}
    </>
  );
}
