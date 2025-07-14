export function trimName(name: string): string {
  if (typeof name !== "string") return "";
  return name.length > 10 ? name.slice(0, 10) + "..." : name;
}
