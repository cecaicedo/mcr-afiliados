import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import CRMLayout from "./components/CRMLayout";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import LeadDetalle from "./pages/LeadDetalle";
import Productos from "./pages/Productos";
import Flujos from "./pages/Flujos";
import FlujoDetalle from "./pages/FlujoDetalle";
import Plantillas from "@/pages/Plantillas";
import PlantillasSociales from "@/pages/PlantillasSociales";
import Analiticas from "@/pages/Analiticas";
import Campanas from "@/pages/Campanas";
import Embudos from "@/pages/Embudos";
import Configuracion from "@/pages/Configuracion";
import PublicadorRedes from "./pages/PublicadorRedes";

function Router() {
  return (
    <CRMLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/leads" component={Leads} />
        <Route path="/leads/:id" component={LeadDetalle} />
        <Route path="/productos" component={Productos} />
        <Route path="/flujos" component={Flujos} />
        <Route path="/flujos/:id" component={FlujoDetalle} />
        <Route path="/plantillas" component={Plantillas} />
        <Route path="/plantillas-sociales" component={PlantillasSociales} />
        <Route path="/analiticas" component={Analiticas} />
        <Route path="/campanas" component={Campanas} />
        <Route path="/embudos" component={Embudos} />
        <Route path="/configuracion" component={Configuracion} />
        <Route path="/publicador" component={PublicadorRedes} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </CRMLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-right" richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
