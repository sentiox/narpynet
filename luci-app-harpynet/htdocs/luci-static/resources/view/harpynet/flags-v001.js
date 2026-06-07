"use strict";
"require baseclass";

const SMALL_CAPS = {
  A: "ᴀ", B: "ʙ", C: "ᴄ", D: "ᴅ", E: "ᴇ", F: "ꜰ", G: "ɢ",
  H: "ʜ", I: "ɪ", J: "ᴊ", K: "ᴋ", L: "ʟ", M: "ᴍ", N: "ɴ",
  O: "ᴏ", P: "ᴘ", Q: "ǫ", R: "ʀ", S: "ꜱ", T: "ᴛ", U: "ᴜ",
  V: "ᴠ", W: "ᴡ", X: "x", Y: "ʏ", Z: "ᴢ",
};

function normalizeCountryCode(country) {
  const code = `${country || ""}`.trim().toLowerCase();
  return /^[a-z]{2}$/.test(code) ? code : "";
}

function inferCountryCode(name) {
  const value = `${name || ""}`.trim().toLowerCase();
  const prefixed = value.match(/^([a-z]{2})\s+/i);
  if (prefixed) return normalizeCountryCode(prefixed[1]);

  const aliases = [
    ["япони", "jp"], ["japan", "jp"], ["эстони", "ee"], ["estonia", "ee"],
    ["швец", "se"], ["sweden", "se"], ["сингапур", "sg"], ["singapore", "sg"],
    ["британи", "gb"], ["united kingdom", "gb"], ["great britain", "gb"],
    ["германи", "de"], ["germany", "de"], ["нидерланд", "nl"], ["netherlands", "nl"],
    ["финлян", "fi"], ["finland", "fi"], ["франц", "fr"], ["france", "fr"],
    ["сша", "us"], ["united states", "us"], ["usa", "us"], ["канад", "ca"], ["canada", "ca"],
    ["польш", "pl"], ["poland", "pl"], ["росси", "ru"], ["russia", "ru"],
    ["украин", "ua"], ["ukraine", "ua"], ["швейцар", "ch"], ["switzerland", "ch"],
    ["австри", "at"], ["austria", "at"], ["итал", "it"], ["italy", "it"],
    ["испан", "es"], ["spain", "es"], ["турц", "tr"], ["turkey", "tr"],
    ["казахстан", "kz"], ["тайван", "tw"], ["гонконг", "hk"], ["hong kong", "hk"],
    ["коре", "kr"], ["korea", "kr"], ["инди", "in"], ["india", "in"],
    ["австрали", "au"], ["australia", "au"], ["бразил", "br"], ["brazil", "br"],
  ];

  return aliases.find(([alias]) => value.includes(alias))?.[1] || "";
}

function stripCountryPrefix(name, country) {
  let value = `${name || ""}`.trim();
  const code = normalizeCountryCode(country).toUpperCase();
  if (!code) return value;

  value = value.replace(/^[\u{1F1E6}-\u{1F1FF}]{2}\s*/u, "");
  const prefixes = [
    code,
    code.toLowerCase(),
    code.split("").map((char) => SMALL_CAPS[char] || char).join(""),
  ];

  for (const prefix of prefixes) {
    if (value.startsWith(`${prefix} `)) {
      return value.slice(prefix.length).trim();
    }
  }

  return value;
}

function renderCountryFlag(country, label) {
  const code = normalizeCountryCode(country);
  if (!code) return null;

  return E("img", {
    class: "harpynet-country-flag",
    src: `/luci-static/resources/harpynet/flags/${code}.png`,
    alt: "",
    title: label || code.toUpperCase(),
    loading: "lazy",
    decoding: "async",
    error: (event) => {
      event.currentTarget.style.display = "none";
    },
  });
}

return baseclass.extend({
  normalizeCountryCode,
  inferCountryCode,
  stripCountryPrefix,
  renderCountryFlag,
});
