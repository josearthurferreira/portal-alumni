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

const DEFAULT_ROLE_GROUPS = [
  {
    label: 'Engenharia (Técnico)',
    options: [
      'Engenheiro Trainee',
      'Engenheiro Júnior',
      'Engenheiro Pleno',
      'Engenheiro Sênior',
      'Engenheiro Especialista',
      'Engenheiro Consultor',
      'Pesquisador em Engenharia (R&D)',
    ],
  },
  {
    label: 'Engenharia (Liderança)',
    options: [
      'Líder Técnico (Tech Lead)',
      'Coordenador de Engenharia',
      'Supervisor de Engenharia',
      'Gerente de Engenharia',
      'Gerente de P&D',
      'Head de Engenharia',
      'Diretor Técnico (CTO)',
      'Diretor de Engenharia',
    ],
  },
  {
    label: 'Gestão / Projetos',
    options: [
      'Analista de Projetos',
      'Coordenador de Projetos',
      'Gerente de Projetos',
      'Gerente de Programa (PgM)',
      'Gerente de Portfólio',
      'PMO',
      'Scrum Master',
      'Product Owner',
      'Consultor',
    ],
  },
  {
    label: 'Produto / Dados / Tecnologia',
    options: [
      'Gerente de Produto (PM)',
      'Analista de Dados',
      'Cientista de Dados',
      'Engenheiro de Dados',
      'Engenheiro de Software',
      'Analista de Sistemas',
      'Arquiteto de Soluções',
      'Arquiteto de Software',
      'Analista de BI',
      'Especialista em IA/ML',
    ],
  },
  {
    label: 'Negócios / Operações',
    options: [
      'Analista de Negócios',
      'Coordenador de Operações',
      'Gerente de Operações',
      'Gerente Comercial',
      'Account Manager',
      'Customer Success',
      'Consultor de Negócios',
      'Analista Financeiro',
      'Gerente Financeiro',
    ],
  },
  {
    label: 'Carreira Acadêmica',
    options: [
      'Iniciação Científica',
      'Mestrando',
      'Doutorando',
      'Pós-Doutorando',
      'Pesquisador',
      'Professor',
      'Professor Doutor',
      'Professor Adjunto',
      'Professor Associado',
      'Professor Titular',
      'Coordenador de Curso',
    ],
  },
  {
    label: 'Setor Público / Forças Armadas',
    options: [
      'Servidor Público',
      'Analista de Órgão Público',
      'Especialista de Órgão Público',
      'Militar (Oficial)',
      'Militar (Praça)',
      'Professor Militar',
      'Pesquisador Militar',
    ],
  },
  {
    label: 'Empreendedorismo / Autônomo',
    options: [
      'Empreendedor',
      'Sócio-Fundador',
      'Diretor Executivo (CEO)',
      'Consultor Autônomo',
      'Freelancer',
      'Autônomo',
    ],
  },
  {
    label: 'Outros',
    options: [
      'Estagiário',
      'Trainee',
      'Analista',
      'Coordenador',
      'Gerente',
      'Diretor',
      'Prefiro não informar',
    ],
  },
];

const ALL_SKILLS = [
  'Acessibilidade Web',
  'Account Management',
  'Aconselhamento de Carreira',
  'Acústica Industrial',
  'Ações de Marketing',
  'Adaptabilidade',
  'Adestramento',
  'Administração de Empresas',
  'Administração de Redes',
  'Adobe Acrobat',
  'Adobe After Effects',
  'Adobe Illustrator',
  'Adobe Lightroom',
  'Adobe Photoshop',
  'Adobe Premiere Pro',
  'Adobe XD',
  'Aerodinâmica',
  'Aeronáutica',
  'Affiliate Marketing',
  'Agile Coaching',
  'Agronomia',
  'Alvenaria',
  'Almoxarifado',
  'Análise de Dados',
  'Análise de Riscos',
  'Análise de Sistemas',
  'Análise do Ciclo de Vida',
  'Análise Estatística',
  'Análise Fundamentalista',
  'Análise Técnica',
  'Android Development',
  'Animação 2D',
  'Animação 3D',
  'Antropologia',
  'Apicultura',
  'Apresentações de Alto Impacto',
  'Aquicultura',
  'Arbitragem',
  'Arquitetura de Dados',
  'Arquitetura de Interiores',
  'Arquitetura de Microsserviços',
  'Arquitetura de Nuvem',
  'Arquitetura de Software',
  'Arquitetura e Urbanismo',
  'Arquivologia',
  'Artes Marciais',
  'Artes Plásticas',
  'Articulação Política',
  'Artificial Intelligence',
  'ASIC Design',
  'Asphalt Paving',
  'Assembler',
  'Assessoria de Imprensa',
  'Assistência Social',
  'Astronomia',
  'Atendimento ao Cliente',
  'Atendimento Multicanal',
  'Atuária',
  'Auditoria Ambiental',
  'Auditoria Interna',
  'AutoCAD',
  'Automação de Marketing',
  'Automação Industrial',
  'Automação Predial',
  'Automotive Engineering',
  'AWS (Amazon Web Services)',
  'Azure',
  'Backend Development',
  'Bacteriologia',
  'Balanço Patrimonial',
  'Balé',
  'Banca de Investimento',
  'Bancos de Dados',
  'Barbearia',
  'Barman',
  'Bash Scripting',
  'Bases de Dados NoSQL',
  'Bases de Dados Relacionais',
  'Benchmarks',
  'Benefícios e Compensações',
  'BIM (Building Information Modeling)',
  'Bioinformática',
  'Biologia Marinha',
  'Biologia Molecular',
  'Biomedicina',
  'Biomimética',
  'Biotecnologia',
  'Blockchain',
  'Blog Writing',
  'Blueprints',
  'Bluetooth Technology',
  'Board Governance',
  'Bodywork',
  'Booking Systems',
  'Bootstrap',
  'Botânica',
  'Branding',
  'Bricklaying',
  'Broadcasting',
  'Budgeting',
  'Building Inspection',
  'Business Analysis',
  'Business Continuity Planning',
  'Business Intelligence',
  'Business Process Outsourcing',
  'Business Strategy',
  'C Programming',
  'C#',
  'C++',
  'CAD/CAM',
  'Cadeia de Suprimentos',
  'Calculus',
  'Calibração',
  'Call Center Operations',
  'Canto',
  'Captação de Recursos',
  'Carpintaria',
  'Cartografia',
  'Cash Flow Management',
  'Catering',
  'Células a Combustível',
  'Cenografia',
  'Cerâmica',
  'Certified Scrum Master',
  'Cibersegurança',
  'Ciência de Dados',
  'Ciência de Materiais',
  'Ciências Atuariais',
  'Ciências Políticas',
  'Circuitos Eletrônicos',
  'Citologia',
  'Civil Engineering',
  'Clean Code',
  'Climate Change Mitigation',
  'Cloud Computing',
  'CNC Management',
  'Coaching',
  'Cobol',
  'Cold Calling',
  'Comercialização',
  'Comércio Exterior',
  'Compliance',
  'Composição Musical',
  'Comunicação Assertiva',
  'Comunicação Visual',
  'Confeitaria',
  'Configuração de Redes',
  'Conformidade Regulatória',
  'Conservação Ambiental',
  'Construção Civil',
  'Contabilidade',
  'Contabilidade de Custos',
  'Controle de Qualidade',
  'Copywriting',
  'CorelDRAW',
  'Costura',
  'Cozinha Internacional',
  'Creative Writing',
  'Crédito e Cobrança',
  'CRM (Customer Relationship Management)',
  'Criptografia',
  'Cromatografia',
  'CSS3',
  'Culinária',
  'Customer Experience',
  'Customer Success',
  'Cybersecurity',
  'Danças Contemporâneas',
  'Dart',
  'Dashboard Design',
  'Data Analysis',
  'Data Engineering',
  'Data Mining',
  'Data Science',
  'Data Visualization',
  'Data Warehouse',
  'Day Trading',
  'Debt Collection',
  'Deep Learning',
  'Dental Surgery',
  'Dermatologia',
  'Design de Interiores',
  'Design de Moda',
  'Design de Produto',
  'Design de Serviço',
  'Design Gráfico',
  'Design Thinking',
  'Desktop Support',
  'DevOps',
  'DevSecOps',
  'Diagramação',
  'Dialética',
  'Didática',
  'Direito Administrativo',
  'Direito Civil',
  'Direito Digital',
  'Direito do Trabalho',
  'Direito Penal',
  'Direito Tributário',
  'Direção de Arte',
  'Direção de Fotografia',
  'Discurso Público',
  'DJing',
  'Django',
  'Docker',
  'Documentação Técnica',
  'Dropshipping',
  'E-commerce',
  'E-learning',
  'Econometria',
  'Economia Circular',
  'Economia Criativa',
  'Edição de Áudio',
  'Edição de Imagem',
  'Edição de Vídeo',
  'Educação a Distância',
  'Educação Especial',
  'Educação Física',
  'Educação Infantil',
  'Efeito de Partículas',
  'Eletricidade Industrial',
  'Eletricidade Predial',
  'Eletrônica Analógica',
  'Eletrônica de Potência',
  'Eletrônica Digital',
  'Eletrotécnica',
  'Elementos Finitos (FEA)',
  'Email Marketing',
  'Embedded Systems',
  'Empreendedorismo',
  'Endodontia',
  'Enfermagem',
  'Engenharia Acústica',
  'Engenharia Aeroespacial',
  'Engenharia Ambiental',
  'Engenharia Civil',
  'Engenharia de Alimentos',
  'Engenharia de Bioprocessos',
  'Engenharia de Controle e Automação',
  'Engenharia de Dados',
  'Engenharia de Manutenção',
  'Engenharia de Materiais',
  'Engenharia de Minas',
  'Engenharia de Petróleo',
  'Engenharia de Produção',
  'Engenharia de Redes',
  'Engenharia de Requisitos',
  'Engenharia de Segurança do Trabalho',
  'Engenharia de Software',
  'Engenharia de Tecidos',
  'Engenharia Elétrica',
  'Engenharia Mecânica',
  'Engenharia Mecatrônica',
  'Engenharia Naval',
  'Engenharia Química',
  'Engenharia Reversa',
  'Entomologia',
  'EPIs',
  'ERP (Enterprise Resource Planning)',
  'Ergonomia',
  'Escrita Criativa',
  'Escrita Técnica',
  'Escultura',
  'Espanhol',
  'Espectroscopia',
  'Espeleologia',
  'Esporte de Alto Rendimento',
  'Esquemas Elétricos',
  'Estamparia',
  'Estatística Applied',
  'Estética',
  'Estoque',
  'Estruturas Metálicas',
  'Estudos de Mercado',
  'ETL Processes',
  'Etiqueta Empresarial',
  'Excel Avançado',
  'Facebook Ads',
  'Fact-checking',
  'Falcoaria',
  'Farmacologia',
  'Farmacovigilância',
  'Fashion Design',
  'Fechamento de Vendas',
  'Ferramentaria',
  'Field Sales',
  'Figma',
  'Filantropia',
  'Filmagem',
  'Filosofia',
  'Filtragem de Sinais',
  'Finanças Corporativas',
  'Finanças Pessoais',
  'Financial Modeling',
  'Física Médica',
  'Física Quântica',
  'Fisiologia do Exercício',
  'Fisioterapia',
  'Fitopatologia',
  'Flash Animation',
  'Flutter',
  'Fonoaudiologia',
  'Food Styling',
  'Forensics',
  'Fortran',
  'Fotografia Analógica',
  'Fotografia Digital',
  'Fotogrametria',
  'Francês',
  'Franquias',
  'Front-end Development',
  'Full-stack Development',
  'Fundraising',
  'Funilaria',
  'Fusões e Aquisições',
  'Game Design',
  'Game Development',
  'Gamificação',
  'Gastroenterologia',
  'Gastronomia',
  'Gatekeeping',
  'Gemologia',
  'Genética',
  'Geociências',
  'Geofísica',
  'Geografia',
  'Geologia',
  'Geomarketing',
  'Geometria Descritiva',
  'Geoprocessamento',
  'Georreferenciamento',
  'Gerenciamento de Ativos',
  'Gerenciamento de Crises',
  'Gerenciamento de Resíduos',
  'Geriatria',
  'Gestalt',
  'Gestão Ambiental',
  'Gestão Comercial',
  'Gestão da Cadeia de Suprimentos',
  'Gestão da Inovação',
  'Gestão da Qualidade',
  'Gestão de Categorias',
  'Gestão de Conflitos',
  'Gestão de Contratos',
  'Gestão de Custos',
  'Gestão de Desempenho',
  'Gestão de Energia',
  'Gestão de Equipes Remote',
  'Gestão de Facilidades',
  'Gestão de Frotas',
  'Gestão de Mudanças',
  'Gestão de Operações',
  'Gestão de Orçamentos',
  'Gestão de Parcerias',
  'Gestão de Pessoas',
  'Gestão de Portfólio',
  'Gestão de Processos',
  'Gestão de Produtos',
  'Gestão de Projetos',
  'Gestão de Riscos',
  'Gestão de Stakeholders',
  'Gestão de Talentos',
  'Gestão de Tempo',
  'Gestão de Tráfego Pago',
  'Gestão de Vendas',
  'Gestão do Conhecimento',
  'Gestão Educacional',
  'Gestão Estratégica',
  'Gestão Financeira',
  'Gestão Hospitalar',
  'Gestão hoteleira',
  'Gestão Industrial',
  'Gestão Logística',
  'Gestão Patrimonial',
  'Gestão Pública',
  'Git',
  'GitHub',
  'GitLab',
  'Glass Blowing',
  'Global Strategy',
  'Go (Golang)',
  'Google Ads',
  'Google Analytics',
  'Google Cloud Platform',
  'Google Search Console',
  'Governance, Risk, and Compliance',
  'Graffiti',
  'Graphic Design',
  'Green Belt',
  'Grooming',
  'Growth Hacking',
  'GUI Design',
  'Ginecologia',
  'Habilidades Interpessoais',
  'Hacking Ético',
  'Hadoop',
  'Hardware Design',
  'Haskell',
  'Health and Safety',
  'Heavy Equipment Operation',
  'Hematologia',
  'Hemerografia',
  'Hermenêutica',
  'Hidráulica',
  'Hidrologia',
  'Hidroponia',
  'Higienização Industrial',
  'Histologia',
  'História da Arte',
  'História Geral',
  'Holocracia',
  'Homeopatia',
  'Honestidade Intelectual',
  'Hospedagem de Sites',
  'Hospitalidade',
  'HTML5',
  'Human Resources',
  'Human-Computer Interaction',
  'Hybrid Cloud',
  'Hydraulics',
  'Hydrogeology',
  'Iberian Studies',
  'IBM Cloud',
  'Iconografia',
  'Ideação',
  'Identidade Visual',
  'Idiomas',
  'Iluminação de Palco',
  'Iluminação Pública',
  'Ilustração Digital',
  'Ilustração Médica',
  'Imobiliário',
  'Imunologia',
  'Inbound Marketing',
  'Inclusão Digital',
  'Indicadores de Desempenho (KPIs)',
  'Indústria 4.0',
  'Infectologia',
  'Inferência Estatística',
  'Influencer Marketing',
  'Informática',
  'Information Architecture',
  'Infográficos',
  'Inglês',
  'Inovação Aberta',
  'Inovação de Ruptura',
  'Inseminação Artificial',
  'Inside Sales',
  'Inspeção de Solda',
  'Instalações Elétricas',
  'Instalações Hidrossanitárias',
  'Instrumentation',
  'Instrução Técnica',
  'Insurance',
  'Inteligência Competitiva',
  'Inteligência de Mercado',
  'Inteligência Emocional',
  'Interface de Usuário (UI)',
  'Internal Audit',
  'International Business',
  'International Relations',
  'Internet das Coisas (IoT)',
  'Internet Marketing',
  'Interpretação de Texto',
  'Interpretação Simultânea',
  'Inventário',
  'Investigação Criminal',
  'Investimentos',
  'Ioga',
  'iOS Development',
  'IP Networking',
  'ISO 9001',
  'ISO 14001',
  'ISO 27001',
  'ISO 45001',
  'IT Service Management',
  'ITIL',
  'Jardinagem',
  'Java',
  'JavaScript',
  'Jenkins',
  'Jornalismo',
  'Jornalismo de Dados',
  'Jornalismo Investigativo',
  'JSON',
  'Judo',
  'Jujutsu',
  'Julia (Linguagem)',
  'Jurisprudência',
  'Jury Selection',
  'Just-in-Time',
  'Kanban',
  'Karatê',
  'Key Opinion Leaders',
  'Key Performance Indicators',
  'Keynote',
  'Kotlin',
  'Kubernetes',
  'Labels and Tags',
  'Labor Relations',
  'Laboratórios de Análises Clínicas',
  'Landscaping',
  'Laravel',
  'Laser Cutting',
  'Latex',
  'Latu Sensu',
  'Law Enforcement',
  'Lead Generation',
  'Lean IT',
  'Lean Manufacturing',
  'Lean Six Sigma',
  'Lean Startup',
  'Leather Working',
  'Legal Writing',
  'Legislação Ambiental',
  'Legislação Trabalhista',
  'LGPD (Lei Geral de Proteção de Dados)',
  'Liability',
  'Liderança',
  'Liderança de Pensamento',
  'Liderança Situacional',
  'Linguagem Corporal',
  'Linguística',
  'Linux',
  'Lisp',
  'Litígio',
  'Lives Streaming',
  'Logística',
  'Logística Reversa',
  'Logo Design',
  'Lua (Linguagem)',
  'Lucratividade',
  'Ludicidade',
  'Luxury Goods',
  'Machine Learning',
  'Machine Vision',
  'Madrigal',
  'Magistério',
  'Magnetismo',
  'Mainframe',
  'Maintenance Management',
  'Maquiagem Profissional',
  'Management Consulting',
  'Manutenção Aeronáutica',
  'Manutenção Automotiva',
  'Manutenção de Computadores',
  'Manutenção Industrial',
  'Manufatura Aditiva',
  'Manufatura Enxuta',
  'Mapeamento de Processos',
  'Marcenaria',
  'Marketing de Conteúdo',
  'Marketing de Guerrilha',
  'Marketing de Influência',
  'Marketing de Relacionamento',
  'Marketing Digital',
  'Marketing Direto',
  'Marketing Político',
  'Marketplace Management',
  'Masonry',
  'Massoterapia',
  'Master Data Management',
  'MATLAB',
  'Matriz SWOT',
  'M&A',
  'Mechanical Design',
  'Mecânica de Fluidos',
  'Mecânica dos Solos',
  'Mecânica Geral',
  'Mecatrônica',
  'Medicina do Trabalho',
  'Medicina Esportiva',
  'Medicina Veterinária',
  'Medição de Precisão',
  'Meditação',
  'Melhoria de Processos',
  'Mensageria',
  'Mentoria',
  'Mercado de Capitais',
  'Merchandising',
  'Metaverse Development',
  'Metodologia Científica',
  'Metodologias Ágeis',
  'Metrologia',
  'Microbiologia',
  'Microcontroladores',
  'Microeconomia',
  'Microsoft Access',
  'Microsoft Azure',
  'Microsoft Excel',
  'Microsoft Outlook',
  'Microsoft PowerPoint',
  'Microsoft Project',
  'Microsoft Visio',
  'Microsoft Word',
  'Mineração de Dados',
  'Mixagem de Áudio',
  'Mobile Design',
  'Mobile Development',
  'Moda',
  'Modelagem 3D',
  'Modelagem de Dados',
  'Modelagem de Negócios',
  'Modelagem Financeira',
  'Moderação de Conteúdo',
  'Monitoramento Ambiental',
  'Monitoria de Qualidade',
  'Montagem de Infraestrutura',
  'Montagem Industrial',
  'MongoDB',
  'Morfologia',
  'Motion Design',
  'Motivation',
  'MS Project',
  'Multimedia',
  'Music Production',
  'Music Theory',
  'MySQL',
  'Nanotecnologia',
  'Narrativa',
  'Native Advertising',
  'Natural Language Processing (NLP)',
  'Navegação Aérea',
  'Navegação Marítima',
  'Nefrologia',
  'Negociação',
  'Negócios Internacionais',
  'Neo4j',
  'Net Promoter Score (NPS)',
  'Network Administration',
  'Network Engineering',
  'Network Security',
  'Neurociência',
  'Neurolinguística',
  'Neurologia',
  'Neuropsicologia',
  'Newsletters',
  'Node.js',
  'No-code Tools',
  'Non-profit Management',
  'NoSQL',
  'Nursing',
  'Nutrição Clínica',
  'Nutrição Esportiva',
  'Nutrologia',
  'Objective-C',
  'Obstetrícia',
  'Oceanografia',
  'Ocupational Safety',
  'Odoo',
  'Odontologia',
  'Office Administration',
  'Offshore Engineering',
  'Off-page SEO',
  'Oil and Gas',
  'OKR (Objectives and Key Results)',
  'On-page SEO',
  'Onboarding',
  'Ontologia',
  'Open Source',
  'Operating Systems',
  'Operação de Caixa',
  'Operação de Drones',
  'Operação de Empilhadeira',
  'Operações Bancárias',
  'Operações de Varejo',
  'Ophthalmic Surgery',
  'Oftalmologia',
  'Optometria',
  'Oracle Database',
  'Oratória',
  'Orçamento Público',
  'Orçamentação',
  'Organização de Eventos',
  'Organização de Fluxos de Trabalho',
  'Orientação a Objetos',
  'Ornitologia',
  'Ortodontia',
  'Ortopedia',
  'Otorrinolaringologia',
  'Outbound Sales',
  'Outsourcing',
  'PaaS',
  'Packaging Design',
  'Padrões de Projeto',
  'Paid Search',
  'Paisagismo',
  'Paleontologia',
  'Palestra',
  'Panificação',
  'Parsing',
  'Pascal',
  'Patrimônio Histórico',
  'Patrocínio',
  'PCP (Planejamento e Controle da Produção)',
  'PDCA',
  'Pediátrica',
  'Pedagogia',
  'Penitenciária',
  'Pensamento Crítico',
  'Pensamento Sistêmico',
  'Pension Funds',
  'Pentesting',
  'People Analytics',
  'Percepção Visual',
  'Performance Marketing',
  'Periodontia',
  'Perícia Civil',
  'Perícia Criminal',
  'Perícia Judicial',
  'Personal Training',
  'Pesquisa de Clima Organizacional',
  'Pesquisa de Mercado',
  'Pesquisa de Usuário (UR)',
  'Pesquisa e Desenvolvimento (P&D)',
  'Pesquisa Operacional',
  'Petrofísica',
  'PHP',
  'Pintura Automotiva',
  'Pintura Digital',
  'Pintura Industrial',
  'PL/SQL',
  'Planejamento de Carreira',
  'Planejamento de Demanda',
  'Planejamento de Mídia',
  'Planejamento Estratégico',
  'Planejamento Financeiro',
  'Planejamento Tributário',
  'Planejamento Urbano',
  'Plant Breeding',
  'PLC Programming',
  'Plumbing',
  'Podologia',
  'Poesia',
  'Policiamento',
  'Políticas Públicas',
  'Polímeros',
  'Português',
  'PostgreSQL',
  'Pós-Produção',
  'Power BI',
  'Power Electronics',
  'Power Pivot',
  'Power Query',
  'PowerShell',
  'PR (Public Relations)',
  'Práticas de Fabricação (GMP)',
  'Preaching',
  'Predictive Analytics',
  'Prensagem',
  'Preparações Microscópicas',
  'Preservação de Documentos',
  'Previdência Privada',
  'Pricing Strategy',
  'Primeiros Socorros',
  'Private Equity',
  'Proatividade',
  'Processamento de Imagens',
  'Processamento de Linguagem Natural',
  'Projetos Culturais',
  'Projetos Elétricos',
  'Projetos Hidráulicos',
  'Projetos Mecânicos',
  'Product Design',
  'Product Management',
  'Product Marketing',
  'Programação de CLP',
  'Programação Funcional',
  'Programação Linear',
  'Programação Orientada a Objetos',
  'Progressive Web Apps (PWA)',
  'Project Finance',
  'Project Management',
  'Project Management Office (PMO)',
  'Proofreading',
  'Propriedade Intelectual',
  'Prospecção de Clientes',
  'Prótese Dentária',
  'Prototipagem',
  'Prototipagem Rápida',
  'Psicanálise',
  'Psicologia Clínica',
  'Psicologia do Esporte',
  'Psicologia Educacional',
  'Psicologia Organizacional',
  'Psicopedagogia',
  'Psiquiatria',
  'Public Affairs',
  'Public Relations',
  'Public Speaking',
  'Publicidade',
  'Python',
  'PyTorch',
  'QA (Quality Assurance)',
  'QC (Quality Control)',
  'QGIS',
  'Qualidade de Software',
  'Química Analítica',
  'Química de Polímeros',
  'Química Farmacêutica',
  'Química Industrial',
  'Química Orgânica',
  'Quiropraxia',
  'RabbitMQ',
  'Radiologia',
  'Radioterapia',
  'Raku',
  'Raspberry Pi',
  'React Native',
  'React.js',
  'Real Estate',
  'Realidade Aumentada (AR)',
  'Realidade Virtual (VR)',
  'Recrutamento e Seleção',
  'Recursos Humanos',
  'Redação Acadêmica',
  'Redação de Conteúdo',
  'Redação Publicitária',
  'Redes de Computadores',
  'Redes Neurais',
  'Redis',
  'Redux',
  'Reforma Residencial',
  'Refrigeração',
  'Regulação de Sinistros',
  'Reinforcement Learning',
  'Relações com Investidores',
  'Relações Governamentais',
  'Relações Institucionais',
  'Relações Internacionais',
  'Relações Públicas',
  'Relatórios Financeiros',
  'Remuneração Estratégica',
  'Renewable Energy',
  'Reparação de Maquinaria',
  'Reporting',
  'Reprografia',
  'Requirements Engineering',
  'Research',
  'Resiliência',
  'Resolução de Conflitos',
  'Resolução de Problemas',
  'Responsabilidade Social',
  'Rest API',
  'Restauração de Obras de Arte',
  'Retail Management',
  'Retenção de Talentos',
  'Retórica',
  'Reumatologia',
  'Reverso Logística',
  'Revit',
  'Risk Management',
  'RPA (Robotic Process Automation)',
  'Ruby',
  'Ruby on Rails',
  'Rust',
  'SaaS',
  'Sales Management',
  'Sales Operations',
  'Salesforce',
  'SAP',
  'SAS',
  'Satisfação do Cliente',
  'Saúde Coletiva',
  'Saúde Mental',
  'Saúde Ocupacional',
  'Saúde Pública',
  'Scala',
  'Scikit-learn',
  'Scrum',
  'Search Engine Marketing (SEM)',
  'Search Engine Optimization (SEO)',
  'Secretariado Executivo',
  'Segurança da Informação',
  'Segurança de Dados',
  'Segurança do Trabalho',
  'Seguros',
  'Semiótica',
  'Sensoriamento Remoto',
  'SEO',
  'Service Design',
  'Servidores Linux',
  'Servidores Windows',
  'Shell Scripting',
  'Six Sigma',
  'Sketch',
  'SketchUp',
  'Social Media Marketing',
  'Sociologia',
  'Software Development',
  'Software Engineering',
  'Soluções em Nuvem',
  'Soldagem',
  'SolidWorks',
  'Sommelier',
  'Sourcing',
  'SPSS',
  'SQL',
  'SQL Server',
  'Stakeholder Management',
  'Standard Operating Procedures (SOP)',
  'Statistical Analysis',
  'Storyboarding',
  'Storytelling',
  'Strategic Planning',
  'Strategic Sourcing',
  'Strategy',
  'Supply Chain Management',
  'Suporte ao Cliente',
  'Suporte Técnico',
  'Sustainability',
  'Sustentabilidade',
  'Swift',
  'Symfony',
  'Systems Analysis',
  'Systems Engineering',
  'Tableau',
  'Tailwind CSS',
  'Tandem Computing',
  'Targeting',
  'Tax Law',
  'Tax Preparation',
  'Team Building',
  'Team Leadership',
  'Teamwork',
  'Technical Drawing',
  'Technical Recruiting',
  'Technical Support',
  'Technical Writing',
  'Tecnologia da Informação',
  'Telecomunicações',
  'Telemarketing',
  'Telemetria',
  'TensorFlow',
  'Teologia',
  'Terapia Cognitivo-Comportamental',
  'Terapia de Casal',
  'Terapia Ocupacional',
  'Test Driven Development (TDD)',
  'Testes de Penetração',
  'Testes de Software',
  'Testes Unitários',
  'Têxtil',
  'Time Management',
  'Toxicologia',
  'Trabalho em Equipe',
  'Tradução',
  'Tradução Simultânea',
  'Tráfego Pago',
  'Training and Development',
  'Transmissão de Calor',
  'Transmissão de Energia',
  'Transporte e Logística',
  'Tratamento de Água',
  'Tratamento de Efluentes',
  'Tratamento de Imagem',
  'Treinamento Corporativo',
  'Treinamento de Força',
  'Treinamento e Desenvolvimento',
  'Tributação',
  'Troubleshooting',
  'TypeScript',
  'Typography',
  'UML',
  'Underwriting',
  'Unit Testing',
  'Unity 3D',
  'Unix',
  'Unix Shell',
  'Urbanismo',
  'Usabilidade',
  'User Experience (UX)',
  'User Interface (UI)',
  'User Research',
  'Urologia',
  'Usina de Açúcar e Álcool',
  'Utilities',
  'UX Design',
  'UX Research',
  'UX Writing',
  'Varejo',
  'VBA',
  'Vendas',
  'Vendas B2B',
  'Vendas B2C',
  'Vendas Consultivas',
  'Vendas Diretas',
  'Vendas Externas',
  'Vendas Internas',
  'Vendas Online',
  'Vendas Porta a Porta',
  'Vendas Técnicas',
  'Venture Capital',
  'Veterinária',
  'Viabilidade Econômica',
  'Video Editing',
  'Video Production',
  'Vigilância Sanitária',
  'Virtualization',
  'Visão Computacional',
  'Visual Basic',
  'Visual Effects (VFX)',
  'Visual Identity',
  'Visual Merchandising',
  'Visual Studio',
  'Vitivinicultura',
  'VMware',
  'Voice Over',
  'Voz sobre IP (VoIP)',
  'Vue.js',
  'Vulnerability Assessment',
  'Warehouse Management',
  'Web Analytics',
  'Web Design',
  'Web Development',
  'Web Scraping',
  'Web Services',
  'Webflow',
  'Webpack',
  'Webinar Hosting',
  'Wellness Coaching',
  'Whiteboard Animation',
  'Wide Area Network (WAN)',
  'Windows Server',
  'Winemaking',
  'Wireframing',
  'Wireless Networking',
  'Wireshark',
  'Wolfram Mathematica',
  'WordPress',
  'Workday',
  'Workflow Automation',
  'Workplace Safety',
  'Writing',
  'Xen',
  'Xero',
  'XML',
  'X射线衍射 (XRD)',
  'YAML',
  'Yarn',
  'Yii',
  'Yoga',
  'YouTube Advertising',
  'YouTube Marketing',
  'Zabbix',
  'Zapier',
  'Zbrush',
  'Zend Framework',
  'Zendesk',
  'Zenith Navigation',
  'Zero Waste',
  'ZigBee',
  'Zootecnia',
  'Zope',
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
                    const msg = validateGraduationYear(form.graduationYear, form.graduationYear);
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
