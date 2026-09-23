export async function GET(request: Request) {
    const url = new URL(request.url).searchParams.get("url");
    if (!url) return new Response("Missing url", { status: 400 });
    try {
        const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
        if (!res.ok) return new Response(`TinyURL HTTP ${res.status}`, { status: 502 });
        return new Response((await res.text()).trim(), { headers: { "Content-Type": "text/plain" } });
    } catch {
        return new Response("Upstream failed", { status: 502 });
    }
}
