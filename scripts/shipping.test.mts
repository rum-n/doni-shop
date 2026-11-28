import { optionsForZone, cheapestForZone, parseShippingRates, readShippingRates,
         ZONE_COUNTRIES, isShippingZone, DEFAULT_RATES } from "../src/lib/shipping";

let bad = 0;
const check = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) bad++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name.padEnd(46)} ${JSON.stringify(got)}${ok ? "" : `  want ${JSON.stringify(want)}`}`);
};

const rates = { bgOffice: 3, bgAddress: 5, eu: 15 };

check("BG offers two options", optionsForZone("bg", rates).length, 2);
check("EU offers one option", optionsForZone("eu", rates).length, 1);
check("BG cheapest is the office rate", cheapestForZone("bg", rates), 3);
check("EU cheapest is the flat rate", cheapestForZone("eu", rates), 15);

// the guarantee that makes this safe
check("BG zone allows only Bulgaria", ZONE_COUNTRIES.bg, ["BG"]);
check("EU zone excludes Bulgaria", ZONE_COUNTRIES.eu.includes("BG"), false);
check("EU zone has 26 countries", ZONE_COUNTRIES.eu.length, 26);
check("zones never overlap",
  ZONE_COUNTRIES.bg.filter((c) => ZONE_COUNTRIES.eu.includes(c)), []);

check("zone guard accepts bg", isShippingZone("bg"), true);
check("zone guard rejects junk", isShippingZone("../../etc"), false);
check("zone guard rejects undefined", isShippingZone(undefined), false);

// validation
check("free shipping (0) is allowed", parseShippingRates({ bgOffice: 0, bgAddress: 0, eu: 0 }), { bgOffice: 0, bgAddress: 0, eu: 0 });
check("negative is rejected", parseShippingRates({ bgOffice: -1, bgAddress: 5, eu: 15 }), null);
check("absurd amount is rejected", parseShippingRates({ bgOffice: 3, bgAddress: 5, eu: 99999 }), null);
check("non-numeric is rejected", parseShippingRates({ bgOffice: "free", bgAddress: 5, eu: 15 }), null);
check("missing field is rejected", parseShippingRates({ bgOffice: 3 }), null);
check("rounds to cents", parseShippingRates({ bgOffice: 3.456, bgAddress: 5, eu: 15 })?.bgOffice, 3.46);

// reading tolerates partial / junk rows
check("partial row falls back per field", readShippingRates({ eu: 20 }), { ...DEFAULT_RATES, eu: 20 });
check("junk row falls back wholly", readShippingRates("nonsense"), DEFAULT_RATES);
check("null falls back wholly", readShippingRates(null), DEFAULT_RATES);

console.log(bad ? `\n${bad} failed` : "\nall shipping checks pass");
process.exit(bad ? 1 : 0);
