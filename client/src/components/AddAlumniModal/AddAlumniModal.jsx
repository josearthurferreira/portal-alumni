import { useEffect, useMemo, useRef, useState } from 'react';
import './AddAlumniModal.css';

import { useCountryLocations } from '../hooks/useCountryLocations';

import {
  normalizeYear,
  normalizeBrDate,
  brToIso,
  isoToBr,
  applyPtBrValidityMessage,
  getBirthDateBoundsIso,
  validateBirthDate,
} from '../utils/alumniFormUtils';

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

// MOCK vindo do "login"
const MOCK_FULL_NAME = 'João da Silva Filho';
const MOCK_EMAIL = 'joao.silva@gmail.com';

const initialForm = {
  fullName: MOCK_FULL_NAME,
  preferredName: '',
  birthDate: '',

  course: '',
  graduationYear: '',

  countryIso2: '',
  stateUf: '',
  city: '',

  organization: '',
  role: '',
  email: MOCK_EMAIL,
  phone: '',
  linkedinUser: '',
  bio: '',

  photoFile: null,
  photoPreviewUrl: '',
};

export default function AddAlumniModal({
  isOpen = true,
  onClose,
  onSubmit,
  courses = DEFAULT_COURSES,
  roles = DEFAULT_ROLE_GROUPS,
}) {
  const [form, setForm] = useState(initialForm);
  const [extraErrors, setExtraErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const birthBounds = useMemo(() => getBirthDateBoundsIso(110), []);
  const hiddenDateRef = useRef(null);

  const { countries, states, cities, loadingStates, loadingCities, isBrazil } =
    useCountryLocations(isOpen, form.countryIso2, form.stateUf);

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

  // País mudou -> zera Estado e Cidade
  useEffect(() => {
    if (!isOpen) return;
    setForm((prev) => ({ ...prev, stateUf: '', city: '' }));
    setExtraErrors((prev) => ({ ...prev, stateUf: '', city: '' }));
  }, [isOpen, form.countryIso2]);

  // Estado mudou -> zera Cidade
  useEffect(() => {
    if (!isOpen) return;
    setForm((prev) => ({ ...prev, city: '' }));
    setExtraErrors((prev) => ({ ...prev, city: '' }));
  }, [isOpen, form.stateUf]);

  // evita leak de preview de imagem (correto)
  useEffect(() => {
    return () => {
      if (form.photoPreviewUrl) URL.revokeObjectURL(form.photoPreviewUrl);
    };
  }, [form.photoPreviewUrl]);

  function openCalendar() {
    const el = hiddenDateRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') el.showPicker();
    else el.click();
  }

  function handleHiddenDateChange(e) {
    setField('birthDate', isoToBr(e.target.value));
    setExtraErrors((prev) => ({ ...prev, birthDate: '' }));
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

  function validateBirthDateAndSetError() {
    const msg = validateBirthDate(
      form.birthDate,
      birthBounds.minIso,
      birthBounds.maxIso,
    );
    setExtraErrors((prev) => ({ ...prev, birthDate: msg }));
    return msg;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setShowValidation(true);

    const birthMsg = validateBirthDateAndSetError();
    if (birthMsg) return;

    try {
      setIsSubmitting(true);

      const payload = {
        fullName: form.fullName.trim(), // vem do login
        email: form.email.trim(), // vem do login (mock)
        preferredName: form.preferredName.trim(),

        birthDate: form.birthDate.trim()
          ? brToIso(form.birthDate.trim())
          : null,

        course: form.course,
        graduationYear: form.graduationYear
          ? Number(form.graduationYear)
          : null,

        country: form.countryIso2,
        state: form.stateUf, // BR = sigla, fora BR = isoCode do estado
        city: form.city,

        organization: form.organization.trim(),
        role: form.role,
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
                  readOnly
                  aria-readonly="true"
                  className="readonly"
                  required
                />
              }
            />

            <Field
              label="Email"
              input={
                <input
                  name="email"
                  type="text"
                  value={form.email}
                  readOnly
                  aria-readonly="true"
                  className="readonly"
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
              error={extraErrors.birthDate}
              input={
                <div className="dateRow">
                  <input
                    name="birthDate"
                    value={form.birthDate}
                    onChange={(e) =>
                      setField('birthDate', normalizeBrDate(e.target.value))
                    }
                    onBlur={validateBirthDateAndSetError}
                    placeholder="dd/mm/aaaa"
                    inputMode="numeric"
                    maxLength={10}
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
                    min={birthBounds.minIso}
                    max={birthBounds.maxIso}
                    value={brToIso(form.birthDate) || ''}
                    onChange={handleHiddenDateChange}
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>
              }
            />

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

            {/* País -> Estado -> Cidade */}
            <Field
              label="País"
              required
              input={
                <select
                  name="countryIso2"
                  value={form.countryIso2}
                  onChange={(e) => setField('countryIso2', e.target.value)}
                  required
                  onInvalid={(e) => applyPtBrValidityMessage(e.target)}
                  onInput={(e) => e.target.setCustomValidity('')}
                >
                  <option value="">Selecione o país</option>
                  {countries.map((c) => (
                    <option key={c.iso2} value={c.iso2}>
                      {c.name}
                    </option>
                  ))}
                </select>
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
                  disabled={!form.countryIso2 || loadingStates}
                  onInvalid={(e) => applyPtBrValidityMessage(e.target)}
                  onInput={(e) => e.target.setCustomValidity('')}
                >
                  <option value="">
                    {!form.countryIso2
                      ? 'Primeiro selecione o país'
                      : loadingStates
                      ? 'Carregando estados...'
                      : 'Selecione o estado'}
                  </option>

                  {states.map((s) => (
                    <option key={`${s.code}-${s.name}`} value={s.code}>
                      {isBrazil ? `${s.code} - ${s.name}` : s.name}
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
                  placeholder="Sua empresa/instituição actual"
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
