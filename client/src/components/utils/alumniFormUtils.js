export function normalizeYear(value = '') {
  return value.replace(/\D/g, '').slice(0, 4);
}

export function normalizeBrDate(value = '') {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);

  let out = dd;
  if (mm) out += `/${mm}`;
  if (yyyy) out += `/${yyyy}`;
  return out;
}

export function brToIso(br) {
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return '';

  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);

  const date = new Date(Date.UTC(yyyy, mm - 1, dd));
  const ok =
    date.getUTCFullYear() === yyyy &&
    date.getUTCMonth() === mm - 1 &&
    date.getUTCDate() === dd;

  if (!ok) return '';
  return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(
    2,
    '0',
  )}`;
}

export function isoToBr(iso) {
  if (!iso) return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return '';
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function applyPtBrValidityMessage(el) {
  el.setCustomValidity('');

  if (el.validity.valueMissing) {
    el.setCustomValidity('Preencha este campo.');
    return;
  }

  if (el.validity.patternMismatch) {
    if (el.name === 'graduationYear') {
      el.setCustomValidity('Digite um ano válido com 4 dígitos (ex: 2020).');
      return;
    }
    if (el.name === 'birthDate') {
      el.setCustomValidity('Use o formato dd/mm/aaaa.');
      return;
    }
    el.setCustomValidity('Formato inválido.');
  }
}

/** Regra: nascimento entre hoje e (hoje - maxYears) */
function toLocalIso(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getBirthDateBoundsIso(maxYears = 110) {
  const now = new Date();
  const maxIso = toLocalIso(now);

  const minDate = new Date(
    now.getFullYear() - maxYears,
    now.getMonth(),
    now.getDate(),
  );
  const minIso = toLocalIso(minDate);

  return { minIso, maxIso };
}

export function validateBirthDate(br, minIso, maxIso) {
  const v = (br || '').trim();
  if (!v) return '';

  const iso = brToIso(v);
  if (!iso) return 'Use uma data real.';

  if (iso < minIso) return 'Tem certeza que digitou certo?';
  if (iso > maxIso) return 'Tem certeza que digitou certo?';

  return '';
}
