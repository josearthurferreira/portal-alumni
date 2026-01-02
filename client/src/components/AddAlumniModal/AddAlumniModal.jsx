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
  validateGraduationYear,
  validatePhone,
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

const ALL_SKILLS = [
  "Gestão de Projetos", "Liderança", "Python", "AutoCAD", "SolidWorks", "C++", "MATLAB",
  "Excel Avançado", "Inglês Fluente", "Planejamento Estratégico", "Lean Manufacturing"
];

const SUGGESTIONS_BY_CATEGORY = {
  "Engenharia & Técnica": ["AutoCAD", "SolidWorks", "MATLAB", "Python", "C++", "Cálculo Estrutural"],
  "Soft Skills": ["Liderança", "Comunicação Assertiva", "Trabalho em Equipe", "Gestão de Tempo"],
  "Gestão & Negócios": ["Planejamento Estratégico", "Logística", "Finanças", "Gestão de Riscos"],
  "Idiomas": ["Inglês Fluente", "Espanhol", "Francês", "Alemão"]
};

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
  skills: [],

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

  const [skillInput, setSkillInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // refs pra bolha nativa (reportValidity)
  const formRef = useRef(null);
  const birthInputRef = useRef(null);
  const gradYearInputRef = useRef(null);
  const phoneInputRef = useRef(null);

  // input date escondido pra abrir o calendário
  const hiddenDateRef = useRef(null);

  const {
    countries,
    states,
    cities,
    loadingStates,
    loadingCities,
    isBrazil,
    hasStates,
    allowManualCity,
    citiesAvailable, // pode não ser usado aqui, mas deixei se quiser
  } = useCountryLocations(isOpen, form.countryIso2, form.stateUf);

  // Antes de selecionar país, mantém Estado/Cidade visíveis (placeholders).
  // Se selecionar um país SEM estados, some Estado/Cidade e entra "Complemento".
  const showStateAndCity = !form.countryIso2 || hasStates;

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setExtraErrors((prev) => ({ ...prev, [name]: '' }));
  }

  // Filtra a lista mestre baseada no que o usuário digita
  const filteredSuggestions = useMemo(() => {
    const query = skillInput.trim().toLowerCase();
    if (!query) return [];
    return ALL_SKILLS.filter(s =>
      s.toLowerCase().includes(query) &&
      !form.skills.includes(s)
    ).slice(0, 6); // Limita a 6 sugestões no dropdown
  }, [skillInput, form.skills]);

  // Função única para adicionar habilidade
  const addSkill = (skill) => {
    const cleanSkill = skill.trim();
    if (cleanSkill && !form.skills.includes(cleanSkill)) {
      setField('skills', [...form.skills, cleanSkill]);
      setSkillInput('');
      setShowSuggestions(false);
    }
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Impede o envio do formulário
      addSkill(skillInput);
    }
  };

  const removeSkill = (skillToRemove) => {
    setField('skills', form.skills.filter(s => s !== skillToRemove));
  };

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

  // Estado mudou -> zera Cidade (só se o país tiver estados)
  useEffect(() => {
    if (!isOpen) return;
    if (!hasStates) return;
    setForm((prev) => ({ ...prev, city: '' }));
    setExtraErrors((prev) => ({ ...prev, city: '' }));
  }, [isOpen, form.stateUf, hasStates]);

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
    birthInputRef.current?.setCustomValidity('');
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

  // helper: seta erro detalhado embaixo + bolha "Corrija sua informação"
  function setCustomFieldError(ref, fieldName, message) {
    setExtraErrors((prev) => ({ ...prev, [fieldName]: message || '' }));
    if (ref?.current) {
      ref.current.setCustomValidity(message ? 'Corrija sua informação' : '');
    }
  }

  function runCustomValidations() {
    // 1) nascimento coerente (<= 110 anos e não futuro)
    const birthMsg = validateBirthDate(
      form.birthDate,
      birthBounds.minIso,
      birthBounds.maxIso,
    );
    setCustomFieldError(birthInputRef, 'birthDate', birthMsg);

    // 2) ano de formatura não pode ser futuro
    const gradMsg = validateGraduationYear(form.graduationYear);
    setCustomFieldError(gradYearInputRef, 'graduationYear', gradMsg);

    // 3) telefone: opcional, mas se preenchido deve estar ok
    const phoneMsg = validatePhone(form.phone);
    setCustomFieldError(phoneInputRef, 'phone', phoneMsg);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setShowValidation(true);

    runCustomValidations();

    const formEl = formRef.current;
    if (formEl && !formEl.checkValidity()) {
      formEl.reportValidity();
      const firstInvalid = formEl.querySelector(':invalid');
      firstInvalid?.focus();
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        preferredName: form.preferredName.trim(),

        birthDate: form.birthDate.trim()
          ? brToIso(form.birthDate.trim())
          : null,

        course: form.course,
        graduationYear: form.graduationYear
          ? Number(form.graduationYear)
          : null,

        country: form.countryIso2,
        state: hasStates ? form.stateUf : null, // <- evita mandar estado em país sem estados
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
          ref={formRef}
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
              input={
                <input
                  name="fullName"
                  value={form.fullName}
                  readOnly
                  aria-readonly="true"
                  className="readonly"
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
              required
              error={extraErrors.birthDate}
              input={
                <div className="dateRow">
                  <input
                    ref={birthInputRef}
                    name="birthDate"
                    value={form.birthDate}
                    onChange={(e) =>
                      setField('birthDate', normalizeBrDate(e.target.value))
                    }
                    placeholder="dd/mm/aaaa"
                    inputMode="numeric"
                    maxLength={10}
                    pattern="^[0-9]{2}/[0-9]{2}/[0-9]{4}$"
                    onInvalid={(e) => applyPtBrValidityMessage(e.target)}
                    onInput={(e) => {
                      e.target.setCustomValidity('');
                      setExtraErrors((prev) => ({ ...prev, birthDate: '' }));
                    }}
                    onBlur={() => {
                      const msg = validateBirthDate(
                        form.birthDate,
                        birthBounds.minIso,
                        birthBounds.maxIso,
                      );
                      setCustomFieldError(birthInputRef, 'birthDate', msg);
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
              error={extraErrors.graduationYear}
              input={
                <input
                  ref={gradYearInputRef}
                  name="graduationYear"
                  value={form.graduationYear}
                  onChange={(e) =>
                    setField('graduationYear', normalizeYear(e.target.value))
                  }
                  placeholder="ex: 2020"
                  inputMode="numeric"
                  required
                  pattern="^[0-9]{4}$"
                  onInvalid={(e) => applyPtBrValidityMessage(e.target)}
                  onInput={(e) => {
                    e.target.setCustomValidity('');
                    setExtraErrors((prev) => ({ ...prev, graduationYear: '' }));
                  }}
                  onBlur={() => {
                    const msg = validateGraduationYear(form.graduationYear);
                    setCustomFieldError(
                      gradYearInputRef,
                      'graduationYear',
                      msg,
                    );
                  }}
                />
              }
            />

            {/* País */}
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

            {/* Estado + Cidade (padrão). Se o país não tiver estados, entra Complemento. */}
            {showStateAndCity ? (
              <>
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
              </>
            ) : (
              <Field
                label="Complemento / Cidade"
                fullWidth
                input={
                  <input
                    name="city"
                    value={form.city}
                    onChange={(e) => setField('city', e.target.value)}
                    placeholder="Digite sua cidade ou província"
                  />
                }
              />
            )}
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
              required
              hint="Opcional. Se internacional, inclua o DDI (+55, +1...)."
              error={extraErrors.phone}
              input={
                <input
                  ref={phoneInputRef}
                  name="phone"
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  placeholder="ex: (11) 99999-9999 ou +55 11 99999-9999"
                  required
                  onInvalid={(e) => applyPtBrValidityMessage(e.target)}
                  onInput={(e) => {
                    e.target.setCustomValidity('');
                    setExtraErrors((prev) => ({ ...prev, phone: '' }));
                  }}
                  onBlur={() => {
                    const msg = validatePhone(form.phone);
                    setCustomFieldError(phoneInputRef, 'phone', msg);
                  }}
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

            <Field
              label="Habilidades"
              fullWidth
              input={
                <div className="skillsWrapper">
                  <div className="inputRelative" style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => {
                        setSkillInput(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onKeyDown={handleSkillKeyDown}
                      placeholder="Procure ou digite uma habilidade e aperte Enter..."
                      className="skillInputMain"
                    />

                    {/* Dropdown de sugestões flutuante */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div className="suggestionsDropdown">
                        {filteredSuggestions.map(sug => (
                          <div
                            key={sug}
                            className="dropdownOption"
                            onClick={() => addSkill(sug)}
                          >
                            + {sug}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Área de Tags (Habilidades já selecionadas) */}
                  <div className="selectedSkillsArea">
                    {form.skills.map((skill) => (
                      <span key={skill} className="skillTag">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          aria-label={`Remover ${skill}`}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
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
