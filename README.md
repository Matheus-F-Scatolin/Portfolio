# Matheus Ferracciú Scatolin | Portfolio

A modern, animated personal portfolio website built with Next.js 14, showcasing my experience as a Computer Engineer & AI Researcher.

🔗 **Live Demo:** [matheus-scatolin.vercel.app](https://matheus-scatolin.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-12-FF0055?style=flat-square&logo=framer)

---

## ✨ Features

### UI/UX
- **Smooth Scrolling** - Butter-smooth scroll experience using [Lenis](https://lenis.studiofreight.com/)
- **Custom Cursor** - Interactive cursor with spring physics that reacts to clickable elements
- **Scroll Progress Indicator** - Visual progress bar showing page scroll position
- **Responsive Design** - Fully optimized for mobile, tablet, and desktop devices

### Animations
- **Blur Reveal Effect** - Name appears with a blur-to-focus animation on load
- **Staggered Animations** - Content sections animate in sequence as you scroll
- **Hover Effects** - Interactive cards with background image reveals and shimmer effects
- **Timeline Animation** - Experience section features an animated timeline with dots

### Sections
- **Hero** - Introduction with animated name, bio, and social links
- **Experience** - Professional timeline with companies and roles
- **Projects** - Grid of technical projects with hover previews and tags
- **About** - Personal narrative, skills arsenal, and highlights
- **Awards** - Expandable accordion of honors and achievements
- **Gallery** - Responsive image grid with captions
- **Footer** - Contact information and social links

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Animations** | Framer Motion |
| **Smooth Scroll** | Lenis |
| **Icons** | Lucide React |
| **Font** | Inter (Google Fonts) |
| **Deployment** | Vercel |

---

## 📁 Project Structure

```
├── app/
│   ├── globals.css       # Global styles and Tailwind imports
│   ├── layout.tsx        # Root layout with metadata and providers
│   └── page.tsx          # Main page composing all sections
├── components/
│   ├── About.tsx         # About section with skills and bio
│   ├── Awards.tsx        # Expandable awards accordion
│   ├── CustomCursor.tsx  # Animated custom cursor
│   ├── Experience.tsx    # Timeline-based experience section
│   ├── Footer.tsx        # Footer with contact info
│   ├── Gallery.tsx       # Responsive image gallery grid
│   ├── Hero.tsx          # Hero section with blur reveal
│   ├── Navbar.tsx        # Fixed navigation header
│   ├── Projects.tsx      # Projects grid with hover effects
│   ├── ScrollProgress.tsx # Scroll progress indicator
│   └── SmoothScroll.tsx  # Lenis smooth scroll wrapper
├── public/
│   ├── images/           # Gallery images
│   └── previews/         # Project preview thumbnails
└── ...config files
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Matheus-F-Scatolin/Portfolio.git
   cd Portfolio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Create optimized production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint for code quality |

---

## 🎨 Customization

To use this template for your own portfolio:

1. Update personal information in component files:
   - `components/Hero.tsx` - Name, title, and bio
   - `components/Experience.tsx` - Work experience entries
   - `components/Projects.tsx` - Project showcase
   - `components/About.tsx` - Skills and personal details
   - `components/Awards.tsx` - Honors and achievements
   - `components/Footer.tsx` - Contact information

2. Replace images in the `public/` folder:
   - `/images/` - Gallery photos
   - `/previews/` - Project thumbnails

3. Update metadata in `app/layout.tsx`:
   - Title, description, keywords
   - Open Graph settings
   - Site URL

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 📬 Contact

**Matheus Ferracciú Scatolin**

- 📧 Email: [m252099@dac.unicamp.br](mailto:m252099@dac.unicamp.br)
- 💼 LinkedIn: [matheus-scatolin](https://linkedin.com/in/matheus-scatolin)
- 🐙 GitHub: [Matheus-F-Scatolin](https://github.com/Matheus-F-Scatolin)
- 📍 Campinas, Brazil

---

<p align="center">
  <i>Engineered in Next.js</i>
</p>