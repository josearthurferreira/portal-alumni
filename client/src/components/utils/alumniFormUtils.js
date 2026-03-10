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

/* ------------------ Datas: regra 110 anos ------------------ (improvável que o usuário tenha mais que 110 anos de idade*/

function toLocalIso(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getBirthDateBoundsIso(maxYears = 110) {
  const now = new Date();
  const maxIso = toLocalIso(now); // hoje (não pode futuro)

  const minDate = new Date(
    now.getFullYear() - maxYears,
    now.getMonth(),
    now.getDate(),
  );
  const minIso = toLocalIso(minDate); // hoje - maxYears

  return { minIso, maxIso };
}

export function validateBirthDate(br, minIso, maxIso) {
  const v = (br || '').trim();
  if (!v) return '';

  const iso = brToIso(v);
  if (!iso) return 'Use dd/mm/aaaa e uma data real.';

  // Comparação ISO (YYYY-MM-DD) funciona por ordem lexicográfica
  if (iso < minIso) return 'Data muito antiga, tem certeza?';
  if (iso > maxIso) return 'Data errada, tente novamente';

  return '';
}

/* ------------------ Ano de formatura ------------------ */

export function validateGraduationYear(br, yearRaw) {
  const v = (br || '').trim();

  const value = String(yearRaw || '').trim();
  if (!value) return ''; // required do browser já cuida

  if (!/^\d{4}$/.test(value)) return 'Digite um ano válido com 4 dígitos.';
  const year = Number(value);

  const currentYear = new Date().getFullYear();

  // Não dá pra “já ter se formado” em ano futuro
  if (year > currentYear) {
    return `Ano de formatura deve ser antes que ${currentYear}.`;
  }

  if (year < br) {
    return `Ano de formatura deve ser antes que ${currentYear}.`;
  }

  // sanity (opcional, mas bom)
  if (year < 1900) {
    return 'Ano de formatura muito antigo. Verifique.';
  }

  return '';
}

/* ------------------ Telefone (opcional) ------------------ */
/**
 * Regras simples (práticas):
 * - Vazio: ok (campo opcional)
 * - Se começa com "+": internacional -> 8 a 15 dígitos (E.164 até 15)
 * - Se não começa com "+": nacional (BR) -> 10 ou 11 dígitos (DDD + número)
 */
export function validatePhone(phoneRaw) {
  const raw = String(phoneRaw || '').trim();
  if (!raw) return '';

  const hasPlus = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');

  if (hasPlus) {
    if (digits.length < 8 || digits.length > 15) {
      return 'Telefone internacional deve ter entre 8 e 15 dígitos (incluindo o código do país).';
    }
    return '';
  }

  // nacional (BR)
  if (!(digits.length === 10 || digits.length === 11)) {
    return 'Telefone nacional deve ter 10 ou 11 dígitos (DDD + número).';
  }

  return '';
}
