export interface OperatorInfo {
  brand: string;
  name: string;
  prefixes: string[];
  iconUrl?: string;
}

export const INDONESIAN_OPERATORS: OperatorInfo[] = [
  {
    brand: "TELKOMSEL",
    name: "Telkomsel",
    prefixes: ["0811", "0812", "0813", "0821", "0822", "0823", "0852", "0853"],
    iconUrl: "https://cdn.marketpoint.id/gallery/icon/409982d9-3738-4f43-b1eb-beac8fccac1d.png",
  },
  {
    brand: "by.U",
    name: "by.U",
    prefixes: ["0851"],
    iconUrl: "https://cdn.marketpoint.id/gallery/icon/a1a2ee7f-fb08-45bb-89ae-17c1c1fd430f.png",
  },
  {
    brand: "INDOSAT",
    name: "Indosat Ooredoo",
    prefixes: ["0814", "0815", "0816", "0855", "0856", "0857", "0858"],
    iconUrl: "https://cdn.marketpoint.id/gallery/icon/4a8028eb-54aa-4eac-9c75-a3a9856245aa.png",
  },
  {
    brand: "XL",
    name: "XL Axiata",
    prefixes: ["0817", "0818", "0819", "0859", "0877", "0878"],
    iconUrl: "https://cdn.marketpoint.id/gallery/icon/53d4b1e2-8a00-4be8-a763-7975459b1d8e.png",
  },
  {
    brand: "AXIS",
    name: "Axis",
    prefixes: ["0831", "0832", "0833", "0838"],
    iconUrl: "https://cdn.marketpoint.id/gallery/icon/46b6ad8c-3cfc-42fc-9761-0b8fc4bcdfab.png",
  },
  {
    brand: "TRI",
    name: "Tri (3)",
    prefixes: ["0895", "0896", "0897", "0898", "0899"],
    iconUrl: "https://cdn.marketpoint.id/gallery/icon/5a549a68-0910-4e9f-bb91-d9abcea9a7c7.png",
  },
  {
    brand: "SMARTFREN",
    name: "Smartfren",
    prefixes: ["0881", "0882", "0883", "0884", "0885", "0886", "0887", "0888", "0889"],
    iconUrl: "https://cdn.marketpoint.id/gallery/icon/27c0d8d8-b02a-464d-9afb-51e270e6da94.png",
  },
];

export function normalizePhoneNumber(raw: string): string {
  if (!raw) return "";
  let clean = raw.replace(/[^0-9+]/g, "").trim();
  if (clean.startsWith("+62")) {
    clean = "0" + clean.slice(3);
  } else if (clean.startsWith("62")) {
    clean = "0" + clean.slice(2);
  }
  return clean.replace(/[^0-9]/g, "");
}

export function detectOperatorFromPhone(raw: string): OperatorInfo | null {
  const normalized = normalizePhoneNumber(raw);
  if (normalized.length < 4) return null;

  const prefix4 = normalized.slice(0, 4);

  // Special check for by.U vs Telkomsel on 0851
  if (prefix4 === "0851") {
    return {
      brand: "by.U",
      name: "by.U",
      prefixes: ["0851"],
      iconUrl: "https://cdn.marketpoint.id/gallery/icon/a1a2ee7f-fb08-45bb-89ae-17c1c1fd430f.png",
    };
  }

  for (const op of INDONESIAN_OPERATORS) {
    if (op.prefixes.includes(prefix4)) {
      return op;
    }
  }

  return null;
}
