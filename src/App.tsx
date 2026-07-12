import { About } from './components/About'
import { Contact } from './components/Contact'
import { Evolution } from './components/Evolution'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Services } from './components/Services'
import { SolarEnergy } from './components/SolarEnergy'
import { WhatsAppButton } from './components/WhatsAppButton'

function App() {
  return (
    <div className="min-h-screen bg-white text-brand-900">
      <Header />
      <main>
        <Hero />
        <Evolution />
        <Services />
        <SolarEnergy />
        <About />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}

export default App
