import { useEffect, useMemo, useRef, useState } from 'react';
import './AddAlumniModal.css';
import {
  CirclePlus,
  Trash2,
  Save,
  ImageUp,
  Calendar,
  CalendarDays,
} from 'lucide-react';

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
import { ALL_SKILLS } from '../Constants/skills.ts';
import { DEFAULT_ROLE_GROUPS } from '../Constants/RouleGroups.ts';
const DEFAULT_COURSES = [
  'Engenharia Cartográfica',
  'Engenharia da Computação',
  'Engenharia de Comunicações',
  'Engenharia de Fortificação e Construção',
  'Engenharia de Materiais',
  'Engenharia Elétrica',
  'Engenharia Eletrônica',
  'Engenharia Mecânica e de Automóveis',
  'Engenharia Mecânica e de Armamentos',
  'Engenharia Química',
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
  company: '',
  yearsOfExperience: '',
  role: '',
  email: '',
  phone: '',
  linkedinUser: '',
  bio: '',
  skills: [],
  photoFile: null,
  photoPreviewUrl: null, // Centralizado aqui
  removePhoto: false, // Flag de remoção
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
  const [isEditing, setIsEditing] = useState(false);

  const birthBounds = useMemo(() => getBirthDateBoundsIso(110), []);

  const [skillInput, setSkillInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Refs para validação nativa (reportValidity)
  const formRef = useRef(null);
  const expYearsInputRef = useRef(null);
  const birthInputRef = useRef(null);
  const gradYearInputRef = useRef(null);
  const phoneInputRef = useRef(null);

  // Ref para input date escondido
  const hiddenDateRef = useRef(null);

  // Trava contra resets durante hidratação inicial
  const isHydratingRef = useRef(false);

  const {
    countries,
    states,
    cities,
    loadingStates,
    loadingCities,
    isBrazil,
    hasStates,
    needsAddressComplement,
  } = useCountryLocations(isOpen, form.countryIso2, form.stateUf);

  // País sem estados: some Estado e mostra só Cidade/Região
  const showStateAndCity = !form.countryIso2 || hasStates;

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setExtraErrors((prev) => ({ ...prev, [name]: '' }));
  }

  // Reseta campos dependentes ao mudar País
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

  // Reseta cidade ao mudar Estado
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

  // Sugestões de skills (considerando que ALL_SKILLS existe no escopo externo)
  const filteredSuggestions = useMemo(() => {
    const query = skillInput.trim().toLowerCase();
    if (!query) return [];
    // Proteção caso ALL_SKILLS ainda não esteja carregado
    const source = typeof ALL_SKILLS !== 'undefined' ? ALL_SKILLS : [];
    return source
      .filter(
        (s) => s.toLowerCase().includes(query) && !form.skills.includes(s),
      )
      .slice(0, 6);
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

  // Hidratação dos dados ao abrir o modal
  useEffect(() => {
    if (!isOpen) return;

    (async () => {
      try {
        isHydratingRef.current = true;

        // 1) Pega dados da conta (Auth)
        const res = await getMe();
        const me = res.data;

        setForm((prev) => ({
          ...prev,
          fullName: me.fullName || '',
          email: me.email || '',
        }));

        // 2) Tenta pegar perfil existente (Alumni)
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

            countryIso2: p.country || '',
            stateUf: p.state || '',
            city: (p.city || '').trim(),
            addressComplement: (
              p.addressComplement ||
              p.addressComp ||
              ''
            ).trim(),

            company: (p.company || '').trim(),
            yearsOfExperience: p.yearsOfExperience || '',
            role: p.role || '',
            phone: p.phone || '',
            linkedinUser: p.linkedinUrl || '',
            bio: p.bio || '',

            // Se vier do banco, popula o previewUrl
            photoPreviewUrl: p.profilePicture || null,
            photoFile: null,
            removePhoto: false,

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
            setIsEditing(false); // Usuário novo
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
        setTimeout(() => {
          isHydratingRef.current = false;
        }, 0);
      }
    })();
  }, [isOpen]);

  // Limpeza de memória do ObjectURL da imagem
  useEffect(() => {
    return () => {
      if (form.photoPreviewUrl && form.photoFile) {
        URL.revokeObjectURL(form.photoPreviewUrl);
      }
    };
  }, [form.photoPreviewUrl, form.photoFile]);

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

    // Limpa URL anterior se for local
    if (form.photoPreviewUrl && form.photoFile) {
      URL.revokeObjectURL(form.photoPreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);

    setForm((prev) => ({
      ...prev,
      photoFile: file,
      photoPreviewUrl: previewUrl,
      removePhoto: false,
    }));
    setExtraErrors((prev) => ({ ...prev, photoFile: '' }));
  }

  function handleRemovePhoto() {
    // Limpa URL da memória se for um arquivo local recém-carregado
    if (form.photoPreviewUrl && form.photoFile) {
      URL.revokeObjectURL(form.photoPreviewUrl);
    }

    setForm((prev) => ({
      ...prev,
      photoFile: null, // Remove o arquivo novo
      photoPreviewUrl: null, // Remove a visualização
      removePhoto: true, // Marca para deletar no back
    }));
  }

  function setCustomFieldError(ref, fieldName, message) {
    setExtraErrors((prev) => ({ ...prev, [fieldName]: message || '' }));
    if (ref?.current) {
      ref.current.setCustomValidity(message ? 'Corrija sua informação' : '');
    }
  }

  function validateLinkedinUrl(value) {
    if (!value?.trim()) return '';
    const isValid =
      /^https?:\/\/(www\.)?linkedin\.com\/(in|company|school)\/[^\s/]+/i.test(
        value.trim(),
      );
    return isValid ? '' : 'Insira um link válido do LinkedIn.';
  }

  function runCustomValidations() {
    const birthMsg = validateBirthDate(
      form.birthDate,
      birthBounds.minIso,
      birthBounds.maxIso,
    );
    setCustomFieldError(birthInputRef, 'birthDate', birthMsg);

    const gradMsg = validateGraduationYear(form.birthDate, form.graduationYear);
    setCustomFieldError(gradYearInputRef, 'graduationYear', gradMsg);

    const phoneMsg = validatePhone(form.phone);
    setCustomFieldError(phoneInputRef, 'phone', phoneMsg);

    const linkedinMsg = validateLinkedinUrl(form.linkedinUser);
    setExtraErrors((prev) => ({ ...prev, linkedinUser: linkedinMsg }));
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

    // validateGraduationYear(form.birthDate, form.graduationYear);

    if (!onSubmit) {
      setExtraErrors((prev) => ({
        ...prev,
        _form: 'Erro: ação de salvar não configurada.',
      }));
      return;
    }

    try {
      setIsSubmitting(true);
      setExtraErrors((prev) => ({ ...prev, _form: '' }));

      const birthIsoDate = form.birthDate?.trim()
        ? brToIso(form.birthDate.trim())
        : '';
      const birthIsoDateTime = birthIsoDate
        ? `${birthIsoDate}T00:00:00.000Z`
        : null;

      const safeNumber = (val) => {
        if (val === '' || val === null || val === undefined) return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
      };

      const formData = new FormData();

      const payloadData = {
        fullName: form.fullName?.trim(),
        email: form.email?.trim(),
        preferredName: form.preferredName?.trim(),
        birthDate: birthIsoDateTime,
        course: form.course,
        graduationYear: safeNumber(form.graduationYear),
        country: form.countryIso2,
        state: hasStates ? form.stateUf : null,
        city: form.city ? String(form.city).trim() : '',
        addressComp: form.addressComplement?.trim() || null,
        linkedinUrl: form.linkedinUser?.trim() || '',
        company: form.company?.trim(),
        yearsOfExperience: safeNumber(form.yearsOfExperience),
        role: form.role,
        phone: form.phone?.trim(),
        bio: form.bio?.trim(),
        skills: Array.isArray(form.skills) ? form.skills.join(',') : '',
      };

      Object.entries(payloadData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      // Lógica de envio da imagem
      if (form.photoFile) {
        formData.append('profilePicture', form.photoFile);
      }

      // Flag para remover foto antiga
      formData.append('removePhoto', form.removePhoto ? 'true' : 'false');

      await onSubmit(formData);
      onClose?.();
    } catch (err) {
      console.error('Erro no submit:', err);
      const backendMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Não foi possível salvar seu perfil.';

      setExtraErrors((prev) => ({
        ...prev,
        _form: backendMsg,
      }));
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
            {form.photoPreviewUrl && (
              <div
                className="photoSectionBackground"
                style={{
                  backgroundImage: `url('${form.photoPreviewUrl}')`,
                  opacity: 0.2, // SÓ na imagem de fundo
                }}
              />
            )}

            {/* 1. Esquerda: Círculo da Foto */}
            <div className="photoCircle">
              {form.photoPreviewUrl ? (
                <img
                  src={form.photoPreviewUrl}
                  alt="Preview"
                  className="photoImg"
                />
              ) : (
                // Placeholder simplificado
                <span className="photoIcon">👤</span>
              )}
            </div>

            {/* 2. Direita: Botões e Ações */}
            <div className="photoActions">
              {/* Botão de Upload (Label atua como botão) */}
              <div className="photoButtons">
                <label className="photoButton">
                  {form.photoPreviewUrl ? (
                    <span>
                      Trocar Foto <ImageUp size={18} />
                    </span>
                  ) : (
                    <span>
                      Adicionar Foto <CirclePlus size={18} />
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    className="fileInput" // A classe que esconde o input real
                    onChange={handlePhotoChange}
                  />
                </label>

                {/* Botão de Remover */}
                {form.photoPreviewUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="removeButton"
                  >
                    <span>
                      {' '}
                      Remover Foto <Trash2 size={18} />
                    </span>
                  </button>
                )}
              </div>

              {/* Mensagem de Erro */}
              {extraErrors?.photoFile && (
                <span className="errorText">{extraErrors.photoFile}</span>
              )}
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
                    <CalendarDays />
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
                    const msg = validateGraduationYear(
                      form.birthDate,
                      form.graduationYear,
                    );
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
                  name="company"
                  value={form.company}
                  onChange={(e) => setField('company', e.target.value)}
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
              label="Tempo no cargo atual (anos)"
              helper="Considere apenas o tempo na função/cargo atual, não a experiência profissional total."
              input={
                <input
                  type="number"
                  name="yearsOfExperience"
                  value={form.yearsOfExperience}
                  onChange={(e) => {
                    const val = e.target.value;
                    setField(
                      'yearsOfExperience',
                      val === '' ? '' : Number(val),
                    );
                  }}
                  placeholder="ex: 3"
                  min="0"
                  max="60"
                  onWheel={(e) => e.target.blur()}
                />
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
              label="LinkedIn (Link do perfil)"
              fullWidth
              error={extraErrors.linkedinUser}
              input={
                <div className="linkedinWrap">
                  <span className="linkedinPrefix">Link:</span>
                  <input
                    name="linkedinUser"
                    value={form.linkedinUser}
                    onChange={(e) => setField('linkedinUser', e.target.value)}
                    onBlur={() => {
                      const msg = validateLinkedinUrl(form.linkedinUser);
                      setExtraErrors((prev) => ({
                        ...prev,
                        linkedinUser: msg,
                      }));
                    }}
                    placeholder="https://www.linkedin.com/in/seu-perfil"
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
                  placeholder="Conte sobre você, sua experiência e interesses... (máximo de 5000 caracteres)"
                  rows={4}
                  maxLength={5000}
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
              {isSubmitting ? (
                isEditing ? (
                  'Salvando...'
                ) : (
                  'Adicionando...'
                )
              ) : isEditing ? (
                <span>
                  {' '}
                  Salvar Alterações <Save size={18} />
                </span>
              ) : (
                <span>
                  {' '}
                  Adicionar Perfil <Save size={18} />
                </span>
              )}
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
