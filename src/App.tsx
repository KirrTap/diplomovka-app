import './index.css'
import { LanguageDropdown } from './components/LanguageDropdown.tsx'
import { Logo } from './components/Logo'
import { useLanguage } from './translations/LanguageContext'
import { InputForm} from './components/InputForm'

function Content() {
const { t } = useLanguage()


return (
  <div className="min-h-screen p-6">
    <div className="w-[80%] mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-1">
          <Logo />
          <h1 className="text-3xl font-semibold leading-none">{t('title')}</h1>
        </div>
        <LanguageDropdown />
      </div>      
      <InputForm />
    </div>
  </div>
)
}

export default Content