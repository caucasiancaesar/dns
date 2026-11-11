import { createServer } from 'node:http';

const PORT = process.env.PORT || 3000;
const NEXTDNS_URL = "https://dns.nextdns.io/7dfbb6";

const server = createServer(async (req, res) => {
  const target = `${NEXTDNS_URL}${req.url}`;
  
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (key !== 'host' && key !== 'connection') {
      headers.set(key, value);
    }
  }
  headers.set("Host", "dns.nextdns.io");

  // Collect request body for POST (standard for DoH wireformat)
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

  try {
    const response = await fetch(target, {
      method: req.method,
      headers,
      body,
      redirect: "follow"
    });

    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    const responseBuffer = await response.arrayBuffer();
    res.end(Buffer.from(responseBuffer));
  } catch (e) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Proxy Error: " + e.message);
  }
});

server.listen(PORT, () => {
  console.log(`NextDNS proxy running on port ${PORT}`);
});