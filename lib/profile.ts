// Every fact rendered on the homepage comes from this file, and every fact
// in this file comes from public/llms.txt (the Master Profile). Update
// llms.txt first, then mirror the change here. Never invent metrics.

export const links = {
  site: "https://matheus-scatolin.vercel.app",
  llms: "/llms.txt",
  linkedin: "https://www.linkedin.com/in/matheus-scatolin",
  github: "https://github.com/Matheus-F-Scatolin",
  scholar: "https://scholar.google.com/citations?hl=en&authuser=2&user=ieyEKR4AAAAJ",
  researchgate: "https://www.researchgate.net/profile/Matheus-Ferracciu-Scatolin",
  orcid: "https://orcid.org/0009-0003-2014-356X",
} as const;

export const person = {
  name: "Matheus Ferracciú Scatolin",
  shortName: "Matheus Scatolin",
  role: "AI Engineer and Researcher",
} as const;

// Ranks always travel with the size of the field.
export const proof = [
  { value: "1st", field: "of 102", label: "Computer Engineering at Unicamp, GPA 3.94/4.0" },
  { value: "2nd", field: "of ~1,000 teams", label: "Itaú Asset Quant AI Challenge 2025" },
  { value: "60", field: "of 2,000+", label: "Selected for MBZUAI UGRIP 2025, then Best Team among 15 groups" },
  { value: "90", field: "of ~105,000", label: "Selected for the Santander Open Academy at IE University" },
] as const;

export type Photo = {
  src: string;
  alt: string;
  // object-position for the crop; "contain" shows diagrams whole on white.
  position?: string;
  fit?: "cover" | "contain";
};

export type Role = {
  org: string;
  title: string;
  dates: string;
  place: string;
  kind: "industry" | "research";
  summary: string;
  metrics: string[];
  photo: Photo;
};

// Newest first.
export const roles: Role[] = [
  {
    org: "Valor Capital Group",
    title: "AI Engineer, Tech Summer",
    dates: "Jun 2026 - Present",
    place: "San Francisco, CA",
    kind: "industry",
    summary:
      "Agentic workflows, data pipelines and technical diligence, working directly with the firm's Head of AI.",
    metrics: ["Agentic workflows", "Data pipelines", "Technical diligence"],
    photo: {
      src: "/gallery/valor-sf.jpg",
      alt: "Matheus at brunch in San Francisco with four others during the Tech Summer",
      position: "50% 40%",
    },
  },
  {
    org: "Enter",
    title: "AI Fellow",
    dates: "Mar 2026 - Jun 2026",
    place: "São Paulo, Brazil",
    kind: "industry",
    summary:
      "Turned a local script into a distributed production pipeline (FastAPI, Hatchet, React, LLMs) that processed thousands of judicial decisions.",
    metrics: ["FastAPI, Hatchet, React, LLMs", "Featured on Enter's blog"],
    photo: {
      src: "/gallery/enter-fellowship.jpg",
      alt: "Matheus with the Enter AI Fellowship cohort in front of the Enter logo",
      position: "50% 45%",
    },
  },
  {
    org: "XP Inc.",
    title: "Machine Learning Summer Intern",
    dates: "Jan 2026 - Feb 2026",
    place: "São Paulo, Brazil",
    kind: "industry",
    summary:
      "Churn prediction MVP for high-net-worth clients with XGBoost, validated out-of-sample and out-of-time.",
    metrics: ["XGBoost", "Out-of-sample and out-of-time"],
    photo: {
      src: "/gallery/xp-office.jpg",
      alt: "Matheus taking a selfie with Guilherme Benchimol, founder of XP Inc., in São Paulo",
      position: "50% 40%",
    },
  },
  {
    org: "Instituto Kunumi",
    title: "AI Researcher",
    dates: "Aug 2025 - Aug 2026",
    place: "Campinas, Brazil",
    kind: "research",
    summary:
      "Automatic knowledge graph generation and Graph-RAG question answering.",
    metrics: ["Knowledge graphs", "Graph-RAG", "Entity and relation extraction"],
    photo: {
      src: "/gallery/kunumi-work.jpg",
      alt: "Matheus working on a laptop at a shared table",
      position: "50% 22%",
    },
  },
  {
    org: "MBZUAI",
    title: "UGRIP Research Intern",
    dates: "Jun 2025 - Sep 2025",
    place: "Abu Dhabi, UAE",
    kind: "research",
    summary:
      "3D brain tumor segmentation, missing-modality synthesis and response prediction, for the BraTS 2025 Challenge.",
    metrics: ["3 papers", "Best Team of 15", "Top 3% of 2,000+"],
    photo: {
      src: "/gallery/mbzuai-entrance.jpg",
      alt: "Matheus wearing a Brazilian flag at the main entrance of MBZUAI in Abu Dhabi",
      position: "50% 72%",
    },
  },
  {
    org: "Hyundai Motor Company",
    title: "Data Analysis & ML Summer Intern",
    dates: "Jan 2025 - Feb 2025",
    place: "São Paulo, Brazil",
    kind: "industry",
    summary:
      "Lead conversion model from 21% to 39% F1. Monthly data processing from 3 days to 3 minutes.",
    metrics: ["F1 21% → 39%", "3 days → 3 minutes"],
    photo: {
      src: "/gallery/hyundai-interns.jpg",
      alt: "The Hyundai summer interns in front of the Hyundai logo",
    },
  },
  {
    org: "Semantix AI",
    title: "Research Fellow / AI Researcher",
    dates: "Mar 2024 - Aug 2025",
    place: "Campinas, Brazil",
    kind: "research",
    summary:
      "Designed and led STELLAR. Built a hallucination benchmark of 7 models across 90,000+ questions.",
    metrics: ["STELLAR, JBCS 2026", "7 models", "90,000+ questions"],
    photo: {
      src: "/previews/stellar.png",
      alt: "STELLAR module diagram: a directed acyclic graph of nine specialized LLM modules",
      fit: "contain",
    },
  },
];

export type School = {
  id: string;
  name: string;
  // For the index row under the paragraph.
  short: string;
  years: string;
  program: string;
  dates: string;
  place: string;
  detail: string;
  photo?: Photo;
};

// In the order the Education paragraph (below) mentions them.
export const schools: School[] = [
  {
    id: "unicamp",
    short: "Unicamp",
    years: "2023 - 2027",
    name: "Unicamp",
    program: "B.Sc. Computer Engineering",
    dates: "Feb 2023 - Dec 2027 (expected)",
    place: "Campinas, Brazil",
    detail: "1st of 102 · GPA 3.94/4.0",
    photo: {
      src: "/gallery/unicamp-admission.jpg",
      alt: "Four students, Matheus among them, with universities and courses painted on their arms after the entrance exams",
      position: "50% 35%",
    },
  },
  {
    id: "ilimit",
    short: "Ilimit Educacional",
    years: "2016 - 2022",
    name: "Ilimit Educacional",
    program: "Primary and secondary education, bilingual program",
    dates: "Feb 2016 - Dec 2022",
    place: "Brazil",
    detail: "Valedictorian in 9th and 12th grade · Final grade 99%",
  },
  {
    id: "canada",
    short: "Lindsay Thurber",
    years: "2022",
    name: "Lindsay Thurber Comprehensive High School",
    program: "Grade 12 exchange semester",
    dates: "Jan 2022 - Jun 2022",
    place: "Red Deer, Alberta, Canada",
    detail: "96% average · 99% in Calculus",
    photo: {
      src: "/gallery/canada-flag.jpg",
      alt: "A Canadian flag marked Red Deer, AB, 2022, covered in goodbye messages from classmates",
    },
  },
  {
    id: "ie",
    short: "IE University",
    years: "2026",
    name: "IE University",
    program: "Santander Open Academy: Innovation & AI Experience",
    dates: "2026",
    place: "Madrid, Spain",
    detail: "90 of ~105,000 applicants · Demo Day top 3 of 15",
    photo: {
      src: "/gallery/ie-team.jpg",
      alt: "Matheus with five others on the IE University stage in Madrid",
      position: "50% 40%",
    },
  },
];

// The Education paragraph, first person like the hero. A segment with a
// school id is a link that opens that school's card.
export const educationStory: { text: string; school?: School["id"] }[] = [
  { text: "I study Computer Engineering at " },
  { text: "Unicamp", school: "unicamp" },
  { text: ", ranked 1st of 102 with a 3.94 GPA. I got into both Unicamp and USP straight from high school, after being valedictorian twice at " },
  { text: "Ilimit", school: "ilimit" },
  { text: " and spending a Grade 12 semester in " },
  { text: "Red Deer, Canada", school: "canada" },
  { text: ", with a 96% average. In 2026, Santander and " },
  { text: "IE University", school: "ie" },
  { text: " picked 90 of about 105,000 applicants for two weeks in Madrid. I was one of them, and my team reached the Demo Day final." },
];

export type Work = {
  slug: string;
  title: string;
  context: string;
  summary: string;
  metrics: string[];
  // ratio is width / height, so photos render uncropped at their own shape.
  image: { src: string; alt: string; fit: "cover" | "contain"; ratio: number };
  // Optional supporting photo shown beside the main image on the homepage.
  secondImage?: { src: string; alt: string; ratio: number };
  // A case study page under /projects, or an external write-up.
  href: string;
  external?: { label: string };
};

export const work: Work[] = [
  {
    slug: "brain-tumor-ai",
    title: "Brain tumor AI",
    context: "MBZUAI UGRIP, 2025",
    summary:
      "A multimodal 3D MRI pipeline for tumor segmentation, missing-modality synthesis and therapy response prediction.",
    metrics: ["LesionWise DSC 0.897", "ROC AUC 0.81", "Best Team among 15 groups"],
    image: {
      src: "/gallery/mbzuai-presentation.jpg",
      alt: "Matheus presenting the response prediction pipeline, ResNet-18 features and radiomics into CatBoost, at MBZUAI",
      fit: "cover",
      ratio: 1600 / 1378,
    },
    secondImage: {
      src: "/gallery/mbzuai-best-team.jpg",
      alt: "The UGRIP team holding Best Team Award certificates at MBZUAI",
      ratio: 3 / 2,
    },
    href: "/projects/brain-tumor-ai",
  },
  {
    slug: "enter-reports",
    title: "Judicial report pipeline",
    context: "Enter AI Fellowship, 2026",
    summary:
      "A report generation tool that turned a local script into a distributed, concurrent production pipeline over thousands of judicial decisions.",
    metrics: ["FastAPI, Hatchet, React, LLMs", "Thousands of judicial decisions", "Featured on Enter's blog"],
    image: {
      src: "/gallery/enter-pipeline.jpg",
      alt: "Sequence diagram of the pipeline: the backoffice requests a report, a Hatchet worker fans out concurrent LLM analysis of the decisions, and the results are stored in S3 for download",
      fit: "cover",
      ratio: 1964 / 1616,
    },
    secondImage: {
      src: "/gallery/enter-fellowship.jpg",
      alt: "Matheus with the Enter AI Fellowship cohort in front of the Enter logo",
      ratio: 2000 / 1709,
    },
    href: "https://www.blog.getenter.ai/en/posts/ai-fellowship",
    external: { label: "Read the post on Enter's blog" },
  },
  {
    slug: "kernelnet",
    title: "KernelNet",
    context: "Itaú Asset Quant AI Challenge, 2025",
    summary:
      "A market-neutral trading strategy that replaces static correlations with nonlinear causality networks.",
    metrics: ["Sharpe 1.29", "54.85% annualized vs 22.78% benchmark", "2nd of ~1,000 teams"],
    image: {
      src: "/gallery/itau-quant-stage.jpg",
      alt: "Matheus presenting KernelNet on stage at the Itaú Quant AI Challenge final",
      fit: "cover",
      ratio: 3 / 4,
    },
    secondImage: {
      src: "/gallery/itau-quant-award.jpg",
      alt: "The KernelNet team holding their Quant AI 2025 trophies at Itaú Asset Management",
      ratio: 4 / 3,
    },
    href: "/projects/kernelnet",
  },
  {
    slug: "stellar",
    title: "STELLAR",
    context: "Semantix AI, 2024-2025",
    summary:
      "An LLM architecture for reliable customer support, built as a directed acyclic graph of nine specialized modules and eleven workflows.",
    metrics: ["First-author paper, JBCS 2026", "Qualis A2", "Scopus-indexed"],
    image: {
      src: "/previews/stellar.png",
      alt: "STELLAR module diagram: a directed acyclic graph of nine specialized LLM modules",
      fit: "contain",
      ratio: 16 / 9,
    },
    href: "/projects/stellar",
  },
];

export type Paper = {
  id: string;
  title: string;
  authors: string;
  year: number;
  venue: string;
  details: string;
  role: "First author" | "Co-first author" | "Co-author";
  metric?: string;
  links: { label: string; href: string }[];
  bibtex: string;
};

export const papers: Paper[] = [
  {
    id: "stellar",
    title:
      "STELLAR: A Structured, Trustworthy, and Explainable LLM-Led Architecture for Reliable Customer Support",
    authors: "Scatolin, M. F., & Pedrini, H.",
    year: 2026,
    venue: "Journal of the Brazilian Computer Society",
    details: "32(1), 128-144. Qualis A2, Scopus-indexed.",
    role: "First author",
    links: [
      { label: "DOI", href: "https://doi.org/10.5753/jbcs.2026.6044" },
      { label: "Code", href: "https://github.com/Matheus-F-Scatolin/STELLAR" },
    ],
    bibtex: `@article{scatolin2026stellar,
  title   = {STELLAR: A Structured, Trustworthy, and Explainable LLM-Led Architecture for Reliable Customer Support},
  author  = {Scatolin, Matheus Ferracci{\\'u} and Pedrini, H{\\'e}lio},
  journal = {Journal of the Brazilian Computer Society},
  volume  = {32},
  number  = {1},
  pages   = {128--144},
  year    = {2026},
  doi     = {10.5753/jbcs.2026.6044}
}`,
  },
  {
    id: "tumor-response",
    title:
      "Predicting Brain Tumor Response to Therapy using a Hybrid Deep Learning and Radiomics Approach",
    authors:
      "Tikhonov, D., Scatolin, M., Banerjee, M., Ji, Q., Jaheen, A., Salem, M., Elsayed, A., Wang, H., Hashmi, S., & Yaqub, M.",
    year: 2025,
    venue: "BraTS-Lighthouse 2025 Challenge (MICCAI 2025)",
    details: "Submitted. arXiv:2509.06511.",
    role: "Co-first author",
    metric: "Mean ROC AUC 0.81",
    links: [{ label: "arXiv", href: "https://arxiv.org/abs/2509.06511" }],
    bibtex: `@misc{tikhonov2025response,
  title  = {Predicting Brain Tumor Response to Therapy using a Hybrid Deep Learning and Radiomics Approach},
  author = {Tikhonov, D. and Scatolin, M. and Banerjee, M. and Ji, Q. and Jaheen, A. and Salem, M. and Elsayed, A. and Wang, H. and Hashmi, S. and Yaqub, M.},
  year   = {2025},
  eprint = {2509.06511},
  archivePrefix = {arXiv}
}`,
  },
  {
    id: "emednext",
    title:
      "EMedNeXt: An Enhanced Brain Tumor Segmentation Framework for Sub-Saharan Africa Using MedNeXt V2 with Deep Supervision",
    authors:
      "Jaheen, A., Elsayed, A., Kim, D., Tikhonov, D., Scatolin, M., Banerjee, M., Ji, Q., Salem, M., Wang, H., Hashmi, S., & Yaqub, M.",
    year: 2026,
    venue: "Lecture Notes in Computer Science, vol. 16376 (MICCAI 2025 / BraTS-Lighthouse)",
    details: "pp. 224-236. Springer, Cham.",
    role: "Co-author",
    metric: "LesionWise DSC 0.897",
    links: [
      { label: "DOI", href: "https://doi.org/10.1007/978-3-032-16365-3_21" },
      { label: "Code", href: "https://github.com/BioMedIA-MBZUAI/EMedNeXt-BraTS-SSA-2025" },
    ],
    bibtex: `@inproceedings{jaheen2026emednext,
  title     = {EMedNeXt: An Enhanced Brain Tumor Segmentation Framework for Sub-Saharan Africa Using MedNeXt V2 with Deep Supervision},
  author    = {Jaheen, A. and Elsayed, A. and Kim, D. and Tikhonov, D. and Scatolin, M. and Banerjee, M. and Ji, Q. and Salem, M. and Wang, H. and Hashmi, S. and Yaqub, M.},
  booktitle = {Segmentation, Classification, and Synthesis for Brain Tumors and Traumatic Brain Injuries},
  series    = {Lecture Notes in Computer Science},
  volume    = {16376},
  pages     = {224--236},
  publisher = {Springer, Cham},
  year      = {2026},
  doi       = {10.1007/978-3-032-16365-3_21}
}`,
  },
  {
    id: "misfit",
    title:
      "MISFIT: Modality Inference via Style Fusion and Invertible Translation for Cross-Modality Synthesis of 3D MRI Volumes",
    authors:
      "Banerjee, M., Ji, Q., Hashmi, S., Elsayed, A., Tikhonov, D., Scatolin, M. F., Jaheen, A., Kim, D., Wang, H., Salem, M., & Yaqub, M.",
    year: 2026,
    venue: "Lecture Notes in Computer Science, vol. 16377 (MICCAI 2025 / BraTS-Lighthouse)",
    details: "pp. 42-53. Springer, Cham.",
    role: "Co-author",
    links: [
      { label: "DOI", href: "https://doi.org/10.1007/978-3-032-16370-7_4" },
      { label: "Code", href: "https://github.com/mohrsalt/MISFIT" },
    ],
    bibtex: `@inproceedings{banerjee2026misfit,
  title     = {MISFIT: Modality Inference via Style Fusion and Invertible Translation for Cross-Modality Synthesis of 3D MRI Volumes},
  author    = {Banerjee, M. and Ji, Q. and Hashmi, S. and Elsayed, A. and Tikhonov, D. and Scatolin, M. F. and Jaheen, A. and Kim, D. and Wang, H. and Salem, M. and Yaqub, M.},
  booktitle = {Segmentation, Classification, and Synthesis for Brain Tumors and Traumatic Brain Injuries},
  series    = {Lecture Notes in Computer Science},
  volume    = {16377},
  pages     = {42--53},
  publisher = {Springer, Cham},
  year      = {2026},
  doi       = {10.1007/978-3-032-16370-7_4}
}`,
  },
];
