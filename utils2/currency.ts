export const getCurrencyByCountry = (country?: string | null): string => {
  switch (String(country || "").toUpperCase()) {
    case "KH":
      return "USD";
    case "ID":
      return "IDR";
    case "PH":
      return "PHP";
    case "TW":
      return "TWD";
    case "SG":
      return "SGD";
    case "MY":
      return "MYR";
    case "MN":
      return "MNT";
    case "NL":
      return "EUR";
    case "AU":
      return "AUD";
    case "TH":
      return "THB";
    case "JP":
      return "JPY";
    case "CN":
      return "CNY";
    case "US":
      return "USD";
    case "KR":
      return "KRW";
    default:
      return "USD";
  }
};

export const getCurrencySymbol = (country?: string | null): string => {
  const currency = getCurrencyByCountry(country);

  switch (currency) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "JPY":
      return "¥";
    default:
      return currency;
  }
};

export const formatCurrencyValue = (
  value: number | string | null | undefined,
  country?: string | null
): string => {
  const num = Number(value ?? 0);
  const safe = Number.isFinite(num) ? num : 0;
  const currency = getCurrencyByCountry(country);

  if (currency === "USD") {
    return `$${safe.toLocaleString()}`;
  }

  if (currency === "EUR") {
    return `€${safe.toLocaleString()}`;
  }

  if (currency === "JPY") {
    return `¥${safe.toLocaleString()}`;
  }

  return `${currency} ${safe.toLocaleString()}`;
};

export const formatCurrencyLabel = (country?: string | null): string => {
  return getCurrencyByCountry(country);
};
