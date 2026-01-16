import { useEffect, useMemo, useRef, useState } from 'react';
import './AddAlumniModal.css';
import { getMe, getMyProfile } from '../../services/api';

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
  'Gestão de Projetos',
  'Liderança',
  'Python',
  'AutoCAD',
  'SolidWorks',
  'C++',
  'MATLAB',
  'Excel Avançado',
  'Inglês Fluente',
  'Planejamento Estratégico',
  'Lean Manufacturing',
];

const initialForm = {
  fullName: '',
  preferredName: '',
  birthDate: '',
  course: '',
  graduationYear: '',
  countryIso2: '',
  stateUf: '',
  city: '',
  addressComplement: '',
  organization: '',
  role: '',
  email: '',
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

  // trava contra resets durante hidratação inicial
  const isHydratingRef = useRef(false);

  const {
    countries,
    states,
    cities,
    loadingStates,
    loadingCities,
    isBrazil,
    hasStates,
    needsAddressComplement, // país tem estado, mas não tem lista de cidades (ex: Bangladesh)
  } = useCountryLocations(isOpen, form.countryIso2, form.stateUf);

  // País sem estados: some Estado e mostra só Cidade/Região
  const showStateAndCity = !form.countryIso2 || hasStates;

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setExtraErrors((prev) => ({ ...prev, [name]: '' }));
  }

  // RESET SÓ QUANDO O USUÁRIO MUDA (não em useEffect)
  function handleCountryChange(e) {
    const newCountry = e.target.value;
    setForm((prev) => ({
      ...prev,
      countryIso2: newCountry,
      stateUf: '',
      city: '',
      addressComplement: '',
    }));
    setExtraErrors((prev) => ({ ...prev, stateUf: '', city: '' }));
  }

  function handleStateChange(e) {
    const newState = e.target.value;
    setForm((prev) => ({
      ...prev,
      stateUf: newState,
      city: '',
      addressComplement: '',
    }));
    setExtraErrors((prev) => ({ ...prev, city: '' }));
  }

  // sugestões de skills
  const filteredSuggestions = useMemo(() => {
    const query = skillInput.trim().toLowerCase();
    if (!query) return [];
    return ALL_SKILLS.filter(
      (s) => s.toLowerCase().includes(query) && !form.skills.includes(s),
    ).slice(0, 6);
  }, [skillInput, form.skills]);

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
      e.preventDefault();
      addSkill(skillInput);
    }
  };

  const removeSkill = (skillToRemove) => {
    setField(
      'skills',
      form.skills.filter((s) => s !== skillToRemove),
    );
  };

  const [isEditing, setIsEditing] = useState(false);

  // Hidrata ao abrir
  useEffect(() => {
    if (!isOpen) return;

    (async () => {
      try {
        isHydratingRef.current = true;

        // 1) pega dados da conta
        const res = await getMe();
        const me = res.data;

        setForm((prev) => ({
          ...prev,
          fullName: me.fullName || '',
          email: me.email || '',
        }));

        // 2) tenta pegar perfil
        try {
          const profRes = await getMyProfile();
          const p = profRes.data;

          setIsEditing(true);

          setForm((prev) => ({
            ...prev,
            preferredName: p.preferredName || '',

            birthDate: p.birthDate
              ? isoToBr(String(p.birthDate).slice(0, 10))
              : '',

            course: p.course || '',
            graduationYear: p.graduationYear ? String(p.graduationYear) : '',

            // backend pode retornar country/state/city direto (ok)
            countryIso2: p.country || '',
            stateUf: p.state || '',
            city: (p.city || '').trim(),

            // COMPAT: backend antigo usa addressComp/company
            addressComplement: (
              p.addressComplement ??
              p.addressComp ??
              ''
            ).trim(),
            organization: (p.organization ?? p.company ?? '').trim(),

            role: p.role || '',
            phone: p.phone || '',

            linkedinUser: (p.linkedinUrl || '')
              .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')
              .replace(/\/$/, ''),

            bio: p.bio || '',
            skills: Array.isArray(p.skills)
              ? p.skills
              : typeof p.skills === 'string' && p.skills.trim()
              ? p.skills
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              : [],
          }));
        } catch (err) {
          if (err?.response?.status === 404) {
            setIsEditing(false);
          } else {
            console.error(err);
          }
        }

        setExtraErrors((prev) => ({ ...prev, _form: '' }));
      } catch (err) {
        console.error(err);
        setExtraErrors((prev) => ({
          ...prev,
          _form: 'Sessão expirada. Faça login novamente.',
        }));
      } finally {
        // solta a trava no próximo tick (evita resets durante render inicial)
        setTimeout(() => {
          isHydratingRef.current = false;
        }, 0);
      }
    })();
  }, [isOpen]);

  // evita leak de preview de imagem
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

  function setCustomFieldError(ref, fieldName, message) {
    setExtraErrors((prev) => ({ ...prev, [fieldName]: message || '' }));
    if (ref?.current) {
      ref.current.setCustomValidity(message ? 'Corrija sua informação' : '');
    }
  }

  function runCustomValidations() {
    const birthMsg = validateBirthDate(
      form.birthDate,
      birthBounds.minIso,
      birthBounds.maxIso,
    );
    setCustomFieldError(birthInputRef, 'birthDate', birthMsg);

    const gradMsg = validateGraduationYear(form.graduationYear);
    setCustomFieldError(gradYearInputRef, 'graduationYear', gradMsg);

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

    if (!onSubmit) {
      setExtraErrors((prev) => ({
        ...prev,
        _form: 'Erro: ação de salvar não configurada (onSubmit ausente).',
      }));
      return;
    }

    try {
      setIsSubmitting(true);
      setExtraErrors((prev) => ({ ...prev, _form: '' }));

      const birthIsoDate = form.birthDate.trim()
        ? brToIso(form.birthDate.trim())
        : '';
      const birthIsoDateTime = birthIsoDate
        ? `${birthIsoDate}T00:00:00.000Z`
        : null;

      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        preferredName: form.preferredName.trim(),

        birthDate: birthIsoDateTime,

        course: form.course,
        graduationYear: form.graduationYear
          ? Number(form.graduationYear)
          : null,

        country: form.countryIso2,
        state: hasStates ? form.stateUf : null,

        // sempre manda city (manual ou select)
        city: form.city ? String(form.city).trim() : '',

        ...(form.addressComplement.trim()
          ? { addressComplement: form.addressComplement.trim() }
          : {}),

        organization: form.organization.trim(),
        role: form.role,
        phone: form.phone.trim(),

        linkedinUrl: form.linkedinUser.trim()
          ? `https://linkedin.com/in/${form.linkedinUser.trim()}`
          : '',

        bio: form.bio.trim(),
        skills: form.skills,
      };

      await onSubmit(payload);
      onClose?.();
    } catch (err) {
      const backendMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Não foi possível salvar seu perfil.';

      setExtraErrors((prev) => ({ ...prev, _form: backendMsg }));
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

        {extraErrors._form ? (
          <div className="formError" role="alert">
            {extraErrors._form}
          </div>
        ) : null}

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
                    required
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
                  onChange={handleCountryChange}
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

            {showStateAndCity ? (
              <>
                <Field
                  label="Estado"
                  required
                  input={
                    <select
                      name="stateUf"
                      value={form.stateUf}
                      onChange={handleStateChange}
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

                {/* Se tem lista de cidades: select */}
                {!needsAddressComplement ? (
                  <Field
                    label="Cidade"
                    required
                    input={
                      <select
                        name="city"
                        value={form.city}
                        onChange={(e) => setField('city', e.target.value)}
                        required
                        disabled={
                          !form.countryIso2 || !form.stateUf || loadingCities
                        }
                        onInvalid={(e) => applyPtBrValidityMessage(e.target)}
                        onInput={(e) => e.target.setCustomValidity('')}
                      >
                        <option value="">
                          {!form.countryIso2
                            ? 'Selecione o país'
                            : !form.stateUf
                            ? 'Selecione o estado'
                            : loadingCities
                            ? 'Carregando cidades...'
                            : 'Selecione a cidade'}
                        </option>

                        {/* fallback se a cidade salva não estiver na lista */}
                        {form.city &&
                        !loadingCities &&
                        Array.isArray(cities) &&
                        !cities.includes(String(form.city).trim()) ? (
                          <option value={String(form.city).trim()}>
                            {String(form.city).trim()} (salvo)
                          </option>
                        ) : null}

                        {cities.map((city) => (
                          <option key={city} value={String(city).trim()}>
                            {String(city).trim()}
                          </option>
                        ))}
                      </select>
                    }
                  />
                ) : (
                  <>
                    {/* Sem lista de cidades: cidade manual + complemento */}
                    <Field
                      label="Cidade / Região"
                      required
                      fullWidth
                      input={
                        <input
                          name="city"
                          value={form.city}
                          onChange={(e) => setField('city', e.target.value)}
                          disabled={!form.countryIso2 || !form.stateUf}
                          placeholder="Ex: Dinajpur, bairro, região, distrito..."
                          required
                          onInvalid={(e) => applyPtBrValidityMessage(e.target)}
                          onInput={(e) => e.target.setCustomValidity('')}
                        />
                      }
                    />

                    <Field
                      label="Complemento do endereço"
                      fullWidth
                      input={
                        <input
                          name="addressComplement"
                          value={form.addressComplement}
                          onChange={(e) =>
                            setField('addressComplement', e.target.value)
                          }
                          disabled={!form.countryIso2 || !form.stateUf}
                          placeholder="Opcional (ex: rua, número, referência...)"
                        />
                      }
                    />
                  </>
                )}
              </>
            ) : (
              // País sem estados
              <Field
                label="Cidade / Região"
                required
                fullWidth
                input={
                  <input
                    name="city"
                    value={form.city}
                    onChange={(e) => setField('city', e.target.value)}
                    placeholder="Digite sua cidade ou província"
                    required
                    onInvalid={(e) => applyPtBrValidityMessage(e.target)}
                    onInput={(e) => e.target.setCustomValidity('')}
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
              hint="Se internacional, inclua o DDI (+55, +1...)."
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
                  <div
                    className="inputRelative"
                    style={{ position: 'relative' }}
                  >
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

                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div className="suggestionsDropdown">
                        {filteredSuggestions.map((sug) => (
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
              {isSubmitting
                ? isEditing
                  ? 'Salvando...'
                  : 'Adicionando...'
                : isEditing
                ? 'Salvar Alterações'
                : 'Adicionar Perfil'}
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
