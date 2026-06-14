export function anonymizeIp(ip: string): string {
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return `${parts.slice(0, 4).join(":")}:xxxx`;
  }

  const octets = ip.split(".");
  if (octets.length === 4) {
    octets[3] = "0";
    return octets.join(".");
  }

  return "0.0.0.0";
}
