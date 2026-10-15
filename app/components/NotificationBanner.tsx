"use client";

export function NotificationBanner({
  tone,
  message,
}: {
  tone: "success" | "error" | "idle";
  message: string;
}) {
  return (
    <div
      id="notification-banner"
      data-testid="notification-banner"
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={message ? `banner banner-${tone}` : "banner"}
    >
      {message ? (
        <p>
          <span className="banner-kicker">{tone === "error" ? "Error" : "Success"}</span>
          {message}
        </p>
      ) : null}
    </div>
  );
}
