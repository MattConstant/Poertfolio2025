import Header from '@/components/Header'
import LampSection from '@/components/LampSection'
import AnimatedAbout from '@/components/AnimatedAbout'
import WorkExperience from '@/components/WorkExperience'
import AnimatedProjects from '@/components/AnimatedProjects'
import Skills from '@/components/Skills'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <LampSection />
      <AnimatedAbout />
      <WorkExperience />
      <AnimatedProjects />
      <Skills />
      <Contact />
      <Footer />
    </main>
  )
}
