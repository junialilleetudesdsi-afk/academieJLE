import './globals.css';
import './academy-ui.css';
export const metadata = { title:'Académie JLE', description:'L’espace de connaissances et de préparation TAC1 de Junia Lille Études.' };
export default function Layout({children}:{children:React.ReactNode}){return <html lang="fr"><body>{children}</body></html>}
