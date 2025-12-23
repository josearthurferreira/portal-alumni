import { useEffect, useMemo, useRef, useState } from 'react';
import './AddAlumniModal.css';

const DEFAULT_COURSES = [
  'Engenharia Cartográfica',
  'Engenharia da Computação',
  'Engenharia de Comunicações',
  'Engenharia de Fortificação e Construção',
  'Engenharia de Materiais',
  'Engenharia Elétrica',
  'Engenharia Eletrônica',
  'Engenharia Mecânica',
  'Engenharia Química',
];

const initialForm = {
  fullName: '',
  preferredName: '',
  birthDate: '', // dd/mm/aaaa
  course: '',
  graduationYear: '',
  stateUf: '', // "RJ"
  city: '',
  organization: '',
  role: '',
  email: '',
  phone: '',
  linkedinUser: '',
  bio: '',
  photoFile: null,
  photoPreviewUrl: '',
};

function normalizeYear(value) {
  return value.replace(/\D/g, '').slice(0, 4);
}

function normalizeBrDate(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);

  let out = dd;
  if (mm) out += `/${mm}`;
  if (yyyy) out += `/${yyyy}`;
  return out;
}

function brToIso(br) {
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return '';

  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);

  // valida se a data existe de verdade (ex: 31/02 não passa)
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

function isoToBr(iso) {
  if (!iso) return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return '';
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function applyPtBrValidityMessage(el) {
  el.setCustomValidity('');

  if (el.validity.valueMissing) {
    el.setCustomValidity('Preencha este campo.');
    return;
  }

  if (el.validity.typeMismatch && el.type === 'email') {
    el.setCustomValidity('Digite um email válido.');
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

const COMMON_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
  'uol.com.br',
  'bol.com.br',
  'ig.com.br',
  'terra.com.br',
]);

function getEmailStatus(valueRaw) {
  const value = valueRaw.trim().toLowerCase();
  if (!value) return { status: 'empty', message: '' };

  const basicOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (!basicOk)
    return { status: 'invalid', message: 'Formato de email inválido' };

  const domain = value.split('@')[1] || '';
  if (COMMON_EMAIL_DOMAINS.has(domain)) {
    return { status: 'valid', message: 'Email válido' };
  }

  return {
    status: 'uncommon',
    message: 'Domínio não comum, verifique se está correto',
  };
}

const DEFAULT_ROLE_GROUPS = [
  {
    label: 'Engenharia',
    options: [
      'Engenheiro Júnior',
      'Engenheiro Pleno',
      'Engenheiro Sênior',
      'Coordenador de Engenharia',
      'Diretor Técnico',
    ],
  },
  {
    label: 'Gestão / Projetos',
    options: ['Gerente de Projetos', 'Consultor', 'Analista'],
  },
  {
    label: 'Carreira Académica',
    options: [
      'Pesquisador',
      'Professor',
      'Professor Doutor',
      'Professor Adjunto',
      'Professor Titular',
      'Pós-Doutorando',
      'Doutorando',
      'Mestrando',
    ],
  },
  {
    label: 'Outros',
    options: [
      'Empresário',
      'Autônomo',
      'Funcionário Público',
      'Militar',
      'Prefiro não informar',
    ],
  },
];

export default function AddAlumniModal({
  isOpen = true,
  onClose,
  onSubmit,
  courses = DEFAULT_COURSES, // aqui entra a lista completa
  roles = DEFAULT_ROLE_GROUPS,
}) {
  const [form, setForm] = useState(initialForm);
  const [extraErrors, setExtraErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // controla quando mostrar borda/erro de required (só após tentativa de enviar)
  const [showValidation, setShowValidation] = useState(false);

  // IBGE: UFs e cidades
  const [ufs, setUfs] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingUfs, setLoadingUfs] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // input date escondido pra abrir o calendário, mantendo o campo digitável
  const hiddenDateRef = useRef(null);

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setExtraErrors((prev) => ({ ...prev, [name]: '' }));
  }

  // reset ao abrir
  useEffect(() => {
    if (!isOpen) return;
    setForm(initialForm);
    setExtraErrors({});
    setIsSubmitting(false);
    setShowValidation(false);
  }, [isOpen]);

  // carrega UFs (IBGE) ao abrir
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const ctrl = new AbortController();

    async function loadUfs() {
      try {
        setLoadingUfs(true);
        const res = await fetch(
          'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome',
          { signal: ctrl.signal },
        );
        const data = await res.json();
        if (!cancelled) setUfs(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setUfs([]);
      } finally {
        if (!cancelled) setLoadingUfs(false);
      }
    }

    loadUfs();
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [isOpen]);

  // UF mudou -> zera cidade e busca municípios daquela UF
  useEffect(() => {
    if (!isOpen) return;

    setForm((prev) => ({ ...prev, city: '' }));
    setCities([]);

    if (!form.stateUf || !ufs.length) return;

    const ufObj = ufs.find((u) => u.sigla === form.stateUf);
    if (!ufObj?.id) return;

    let cancelled = false;
    const ctrl = new AbortController();

    async function loadCities() {
      try {
        setLoadingCities(true);
        const res = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufObj.id}/municipios?orderBy=nome`,
          { signal: ctrl.signal },
        );
        const data = await res.json();

        if (!cancelled) {
          setCities(
            Array.isArray(data) ? data.map((m) => m.nome).filter(Boolean) : [],
          );
        }
      } catch {
        if (!cancelled) setCities([]);
      } finally {
        if (!cancelled) setLoadingCities(false);
      }
    }

    loadCities();
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [isOpen, form.stateUf, ufs]);

  // evita leak de preview de imagem
  useEffect(() => {
    return () => {
      if (form.photoPreviewUrl) URL.revokeObjectURL(form.photoPreviewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emailInfo = useMemo(() => getEmailStatus(form.email), [form.email]);

  function openCalendar() {
    const el = hiddenDateRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') el.showPicker();
    else el.click();
  }

  function handleHiddenDateChange(e) {
    setField('birthDate', isoToBr(e.target.value));
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = 5 * 1024 * 1024;
    const okType = ['image/jpeg', 'image/png'].includes(file.type);

    if (!okType) {
      setExtraErrors((prev) => ({ ...prev, photoFile: 'Envie JPG ou PNG.' }));
      return;
    }
    if (file.size > maxBytes) {
      setExtraErrors((prev) => ({ ...prev, photoFile: 'Máximo de 5MB.' }));
      return;
    }

    if (form.photoPreviewUrl) URL.revokeObjectURL(form.photoPreviewUrl);

    const previewUrl = URL.createObjectURL(file);
    setForm((prev) => ({
      ...prev,
      photoFile: file,
      photoPreviewUrl: previewUrl,
    }));
    setExtraErrors((prev) => ({ ...prev, photoFile: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setShowValidation(true);

    if (form.birthDate.trim() && !brToIso(form.birthDate.trim())) {
      setExtraErrors((prev) => ({
        ...prev,
        birthDate: 'Use dd/mm/aaaa e uma data real.',
      }));
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        fullName: form.fullName.trim(),
        preferredName: form.preferredName.trim(),
        birthDate: form.birthDate.trim()
          ? brToIso(form.birthDate.trim())
          : null,
        course: form.course,
        graduationYear: Number(form.graduationYear),
        state: form.stateUf,
        city: form.city,
        organization: form.organization.trim(),
        role: form.role,
        email: form.email.trim(),
        phone: form.phone.trim(),
        linkedinUrl: form.linkedinUser.trim()
          ? `https://linkedin.com/in/${form.linkedinUser.trim()}`
          : '',
        bio: form.bio.trim(),
        photoFile: form.photoFile || null,
      };

      await onSubmit?.(payload);
      onClose?.();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <header className="header">
          <h2 className="title">Adicionar Seu Perfil</h2>
          <button
            type="button"
            className="closeButton"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </header>

        <form
          className={`form ${showValidation ? 'validated' : ''}`}
          onSubmit={handleSubmit}
          // quando o browser detectar inválido, a gente liga o "modo validação"
          onInvalidCapture={() => setShowValidation(true)}
        >
          {/* FOTO */}
          <section className="photoSection">
            <div className="photoCircle">
              {form.photoPreviewUrl ? (
                <img
                  className="photoImg"
                  src={form.photoPreviewUrl}
                  alt="Prévia da foto do perfil"
                />
              ) : (
                <span className="photoIcon" aria-hidden="true">
                  📷
                </span>
              )}
            </div>

            <div className="photoControls">
              <label className="photoLabel">Foto do Perfil</label>

              <div className="photoActions">
                <input
                  id="photo-input"
                  type="file"
                  accept="image/png,image/jpeg"
                  className="fileInput"
                  onChange={handlePhotoChange}
                />
                <label htmlFor="photo-input" className="photoButton">
                  Escolher Foto
                </label>
                <span className="photoHint">JPG, PNG até 5MB</span>
              </div>

              {extraErrors.photoFile ? (
                <p className="errorText">{extraErrors.photoFile}</p>
              ) : null}
            </div>
          </section>

          {/* CAMPOS */}
          <section className="grid">
            <Field
              label="Nome Completo"
              required
              input={
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={(e) => setField('fullName', e.target.value)}
                  placeholder="Digite seu nome completo"
                  required
                  onInvalid={(e) => applyPtBrValidityMessage(e.target)}
                  onInput={(e) => e.target.setCustomValidity('')}
                />
              }
            />

            <Field
              label="Como prefere ser chamado"
              input={
                <input
                  name="preferredName"
                  value={form.preferredName}
                  onChange={(e) => setField('preferredName', e.target.value)}
                  placeholder="ex: João, Ana, etc."
                />
              }
            />

            <Field
              label="Data de Aniversário"
              hint="Você pode digitar (dd/mm/aaaa) ou usar o calendário."
              error={extraErrors.birthDate}
              input={
                <div className="dateRow">
                  <input
                    name="birthDate"
                    value={form.birthDate}
                    onChange={(e) =>
                      setField('birthDate', normalizeBrDate(e.target.value))
                    }
                    placeholder="dd/mm/aaaa"
                    inputMode="numeric"
                    pattern="^\d{2}\/\d{2}\/\d{4}$"
                    onInvalid={(e) => applyPtBrValidityMessage(e.target)}
                    onInput={(e) => {
                      e.target.setCustomValidity('');
                      setExtraErrors((prev) => ({ ...prev, birthDate: '' }));
                    }}
                  />
                  <button
                    type="button"
                    className="calendarBtn"
                    onClick={openCalendar}
                    aria-label="Abrir calendário"
                  >
                    📅
                  </button>
                  <input
                    ref={hiddenDateRef}
                    className="hiddenDate"
                    type="date"
                    value={brToIso(form.birthDate) || ''}
                    onChange={handleHiddenDateChange}
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>
              }
            />

            {/* CURSOS COMPLETOS */}
            <Field
              label="Curso"
              required
              input={
                <select
                  name="course"
                  value={form.course}
                  onChange={(e) => setField('course', e.target.value)}
                  required
                  onInvalid={(e) => applyPtBrValidityMessage(e.target)}
                  onInput={(e) => e.target.setCustomValidity('')}
                >
                  <option value="">Selecione o curso</option>
                  {courses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              }
            />

            <Field
              label="Ano de Formatura"
              required
              input={
                <input
                  name="graduationYear"
                  value={form.graduationYear}
                  onChange={(e) =>
                    setField('graduationYear', normalizeYear(e.target.value))
                  }
                  placeholder="ex: 2020"
                  inputMode="numeric"
                  required
                  pattern="^\d{4}$"
                  onInvalid={(e) => applyPtBrValidityMessage(e.target)}
                  onInput={(e) => e.target.setCustomValidity('')}
                />
              }
            />

            <Field
              label="Estado"
              required
              input={
                <select
                  name="stateUf"
                  value={form.stateUf}
                  onChange={(e) => setField('stateUf', e.target.value)}
                  required
                  disabled={loadingUfs}
                  onInvalid={(e) => applyPtBrValidityMessage(e.target)}
                  onInput={(e) => e.target.setCustomValidity('')}
                >
                  <option value="">
                    {loadingUfs
                      ? 'Carregando estados...'
                      : 'Selecione o estado'}
                  </option>
                  {ufs.map((u) => (
                    <option key={u.id} value={u.sigla}>
                      {u.sigla}
                    </option>
                  ))}
                </select>
              }
            />

            <Field
              label="Cidade"
              required
              input={
                <select
                  name="city"
                  value={form.city}
                  onChange={(e) => setField('city', e.target.value)}
                  required
                  disabled={!form.stateUf || loadingCities}
                  onInvalid={(e) => applyPtBrValidityMessage(e.target)}
                  onInput={(e) => e.target.setCustomValidity('')}
                >
                  <option value="">
                    {!form.stateUf
                      ? 'Primeiro selecione o estado'
                      : loadingCities
                      ? 'Carregando cidades...'
                      : 'Selecione a cidade'}
                  </option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              }
            />

            <Field
              label="Empresa/Instituição"
              input={
                <input
                  name="organization"
                  value={form.organization}
                  onChange={(e) => setField('organization', e.target.value)}
                  placeholder="Sua empresa/instituição atual"
                />
              }
            />

            <Field
              label="Cargo/Posição"
              input={
                <select
                  name="role"
                  value={form.role}
                  onChange={(e) => setField('role', e.target.value)}
                >
                  <option value="">Selecione seu cargo</option>
                  {roles.map((g) => (
                    <optgroup key={g.label} label={g.label}>
                      {g.options.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              }
            />

            <Field
              label="Email"
              input={
                <div>
                  <div className={`emailWrap email-${emailInfo.status}`}>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setField('email', e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      onInvalid={(e) => applyPtBrValidityMessage(e.target)}
                      onInput={(e) => e.target.setCustomValidity('')}
                    />
                    {emailInfo.status !== 'empty' ? (
                      <span className="emailIcon" aria-hidden="true">
                        {emailInfo.status === 'valid' ? '✓' : '!'}
                      </span>
                    ) : null}
                  </div>

                  {emailInfo.status !== 'empty' ? (
                    <p className={`emailMsg email-${emailInfo.status}`}>
                      {emailInfo.message}
                    </p>
                  ) : null}
                </div>
              }
            />

            <Field
              label="Telefone (Nacional/Internacional)"
              hint="Para números internacionais, inclua o código do país: +55 (Brasil), +1 (EUA), etc."
              input={
                <input
                  name="phone"
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  placeholder="ex: (11) 99999-9999 ou +55 11 99999-9999"
                />
              }
            />

            <Field
              label="LinkedIn (nome de usuário)"
              fullWidth
              input={
                <div className="linkedinWrap">
                  <span className="linkedinPrefix">linkedin.com/in/</span>
                  <input
                    name="linkedinUser"
                    value={form.linkedinUser}
                    onChange={(e) => setField('linkedinUser', e.target.value)}
                    placeholder="seu-nome-de-usuario"
                    className="linkedinInput"
                  />
                </div>
              }
            />

            <Field
              label="Biografia"
              fullWidth
              input={
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={(e) => setField('bio', e.target.value)}
                  placeholder="Conte sobre você, sua experiência e interesses..."
                  rows={4}
                />
              }
            />
          </section>

          <footer className="footer">
            <button
              type="button"
              className="cancelButton"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="submitButton"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adicionando...' : 'Adicionar Perfil'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

/**
 * Field: componente “wrapper” pra manter o layout consistente:
 * label + required (*) + input + hint/erro.
 */
function Field({ label, required, hint, error, input, fullWidth }) {
  return (
    <div className={`field ${fullWidth ? 'fullWidth' : ''}`}>
      <label className="label">
        {label} {required ? <span className="required">*</span> : null}
      </label>

      <div className="control">{input}</div>

      {hint ? <p className="hint">{hint}</p> : null}
      {error ? <p className="errorText">{error}</p> : null}
    </div>
  );
}
