export const charFromName = (name: string) => {
  const nameParts = name.split(" ");
  if (nameParts.length > 1) {
    return (
      nameParts[0].charAt(0).toUpperCase() +
      nameParts[1].charAt(0).toUpperCase()
    );
  }
  return name.charAt(0).toUpperCase();
};

export const charFromEmail = (email: string) => {
  const name = email.split("@")[0];
  return name.charAt(0).toUpperCase();
};

export const nameFromEmail = (email: string) => {
  const name = email.split("@")[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
};
