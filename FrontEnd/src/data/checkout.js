const digits = (v) => String(v ?? "").replace(/\D/g, "");

/** Máscaras de digitação. */
export const maskCPF = (v) => digits(v).slice(0, 11)
  .replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1-$2");
export const maskCNPJ = (v) => digits(v).slice(0, 14)
  .replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
  .replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");

const allEqual = (s) => /^(\d)\1+$/.test(s);

export function isValidCPF(value) {
  const s = digits(value);
  if (s.length !== 11 || allEqual(s)) return false;
  const check = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(s[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return check(9) === Number(s[9]) && check(10) === Number(s[10]);
}

export function isValidCNPJ(value) {
  const s = digits(value);
  if (s.length !== 14 || allEqual(s)) return false;
  const check = (len) => {
    let sum = 0, w = len - 7;
    for (let i = 0; i < len; i++) { sum += Number(s[i]) * w--; if (w < 2) w = 9; }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return check(12) === Number(s[12]) && check(13) === Number(s[13]);
}

export const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());

/** Data do `<input type="date">` (AAAA-MM-DD): precisa existir, não pode ser futura nem anterior a 1900. */
export function isValidBirthDate(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v ?? "")) return false;
  const d = new Date(`${v}T00:00:00`);
  return !Number.isNaN(d.getTime()) && d <= new Date() && d.getFullYear() >= 1900;
}

/** Frete de uma opção: grátis nos Correios acima do valor mínimo. */
export function shippingPrice(option, productsTotal, config) {
  const free = option.id === config.freeShippingCarrier && productsTotal > config.freeShippingFrom;
  return free ? 0 : option.price;
}
