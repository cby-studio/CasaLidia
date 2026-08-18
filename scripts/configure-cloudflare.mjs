import fs from "node:fs";

const kvNamespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID;

if (!kvNamespaceId) {
  throw new Error("Missing CLOUDFLARE_KV_NAMESPACE_ID secret.");
}

const config = JSON.parse(fs.readFileSync("wrangler.jsonc", "utf8"));
config.kv_namespaces = [
  {
    binding: "BOOKINGS_KV",
    id: kvNamespaceId,
  },
];

fs.writeFileSync("wrangler.jsonc", `${JSON.stringify(config, null, 2)}\n`);
