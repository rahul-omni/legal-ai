export function trimName(name: string): string {
  if (typeof name !== "string") return "";
  return name.length > 15 ? name.slice(0, 15) + "..." : name;
}
