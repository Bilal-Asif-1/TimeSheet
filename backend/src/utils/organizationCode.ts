export const normalizeOrganizationCode = (value: string) => value.trim().toUpperCase();

export const generateOrganizationCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";

  for (let index = 0; index < 6; index += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return `ORG-${suffix}`;
};

export const isValidOrganizationCode = (value: string) => /^ORG-[A-Z0-9]{4,12}$/.test(value);
