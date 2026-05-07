// Phone number masking for display (账号与安全 / phone detail).
// E.164-style: keep + country code + first 3 digits + 4 stars + last 4 digits.
//
// Country codes are matched against a small whitelist (longest-prefix first)
// to avoid the generic-regex hazard where "+86138..." gets greedily parsed
// as "+861 + 38...". Per account-settings-shell spec T3 decision A
// (2026-05-07): cover the common M1 markets explicitly; extend the table
// when a new market joins. Out-of-list country → "未绑定".

const COUNTRY_CODES = ['+852', '+886', '+86', '+44', '+81', '+82', '+1', '+7'] as const;

export function maskPhone(phone: string | null): string {
  if (phone === null || phone === '') return '未绑定';

  const countryCode = COUNTRY_CODES.find((cc) => phone.startsWith(cc));
  if (!countryCode) return '未绑定';

  const localNumber = phone.slice(countryCode.length);
  if (!/^\d+$/.test(localNumber) || localNumber.length < 7) return '未绑定';

  const head = localNumber.slice(0, 3);
  const tail = localNumber.slice(-4);
  const middleLen = localNumber.length - 7;
  const middle = '*'.repeat(Math.max(middleLen, 4));

  return `${countryCode} ${head}${middle}${tail}`;
}
