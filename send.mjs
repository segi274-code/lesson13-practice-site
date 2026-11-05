// Runs on Netlify, not in the browser. The Make webhook address is read from
// the MAKE_WEBHOOK_URL environment variable, so it never appears in the page.

function isMakeAddress(url) {
  try {
    const host = new URL(url).hostname;
    return host.endsWith(".make.com") || host.endsWith(".integromat.com");
  } catch {
    return false;
  }
}

export default async (req) => {
  const hook = Netlify.env.get("MAKE_WEBHOOK_URL");

  // The page asks this first, to show whether the address is set
  if (req.method === "GET") {
    return Response.json({ configured: Boolean(hook) && isMakeAddress(hook) });
  }

  if (!hook) return Response.json({ error: "not_set" });
  if (!isMakeAddress(hook)) {
    return Response.json({ error: "MAKE_WEBHOOK_URL doesn’t look like a Make webhook address." });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "The page sent something unreadable." });
  }

  const payload = {
    title: String(body.title || "").slice(0, 200),
    issue: String(body.issue || "").slice(0, 50)
  };

  try {
    const res = await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const reply = (await res.text()).slice(0, 2000);
    return Response.json({ status: res.status, reply });
  } catch {
    return Response.json({ error: "Make didn’t answer. Check the webhook address is right." });
  }
};

export const config = { path: "/api/send" };
