import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, CheckCircle2, ScanLine, CalendarDays, Package, BarChart3, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className={styles.landingPage}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}><Leaf size={20} /></div>
          <span className={styles.logoText}>SmartFoodAI</span>
        </div>

        <div className={styles.navLinks}>
          <a href="#features" className={styles.navLink}>Funcionalidades</a>
          <a href="#pricing" className={styles.navLink}>Precios</a>
        </div>

        {user ? (
          <Link to="/dashboard" className={styles.loginBtn}>
            Ir al Dashboard
          </Link>
        ) : (
          <Link to="/login" className={styles.loginBtn}>
            Login
          </Link>
        )}
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Tu nutricionista <span>inteligente</span> de bolsillo
        </h1>
        <p className={styles.heroSubtitle}>
          Escanea tu lista de la compra, gestiona tu despensa y genera menús semanales adaptados a ti utilizando el poder de la Inteligencia Artificial.
        </p>
        <div className={styles.heroCta}>
          <Link to="/login" className={styles.btnPrimaryLarge}>
            Comenzar Gratis <ChevronRight size={18} style={{ display: 'inline', verticalAlign: 'text-bottom' }} />
          </Link>
          <a href="#features" className={styles.btnSecondaryLarge}>
            Descubrir más
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.features}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Todo lo que necesitas para comer mejor</h2>
          <p className={styles.sectionSubtitle}>
            SmartFoodAI combina la última tecnología en IA con una interfaz intuitiva para simplificar tu vida nutricional.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <ScanLine size={24} />
            </div>
            <h3 className={styles.featureTitle}>Escáner IA de Listas</h3>
            <p className={styles.featureDesc}>
              Sube una foto de tu ticket de compra o lista manuscrita. Nuestra IA extraerá los alimentos y los añadirá a tu despensa automáticamente.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <CalendarDays size={24} />
            </div>
            <h3 className={styles.featureTitle}>Menús Generados por IA</h3>
            <p className={styles.featureDesc}>
              Obtén planes de comidas semanales personalizados, teniendo en cuenta tus calorías objetivo, preferencias y lo que ya tienes en la despensa.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Package size={24} />
            </div>
            <h3 className={styles.featureTitle}>Gestión de Despensa</h3>
            <p className={styles.featureDesc}>
              Lleva el control de todos tus ingredientes en casa. Evita el desperdicio de comida y planifica tus compras de manera eficiente.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <BarChart3 size={24} />
            </div>
            <h3 className={styles.featureTitle}>Control de Macros</h3>
            <p className={styles.featureDesc}>
              Registra lo que comes y visualiza fácilmente tu progreso diario. Controla tus proteínas, carbohidratos, grasas y calorías totales.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className={styles.pricing}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Planes sencillos y transparentes</h2>
          <p className={styles.sectionSubtitle}>
            Empieza a mejorar tu nutrición hoy mismo. Actualiza a Premium cuando necesites el máximo poder de la IA.
          </p>
        </div>

        <div className={styles.pricingGrid}>
          {/* Plan Free */}
          <div className={styles.pricingCard}>
            <div className={styles.pricingHeader}>
              <h3 className={styles.pricingTitle}>Básico</h3>
              <div className={styles.pricingPrice}>
                <span className={styles.pricingCurrency}>€</span>0<span className={styles.pricingPeriod}>/mes</span>
              </div>
            </div>

            <ul className={styles.pricingFeatures}>
              <li className={styles.pricingFeature}>
                <CheckCircle2 className={styles.featureCheck} size={20} />
                <span>Gestión de despensa básica</span>
              </li>
              <li className={styles.pricingFeature}>
                <CheckCircle2 className={styles.featureCheck} size={20} />
                <span>Control de macros diario</span>
              </li>
              <li className={styles.pricingFeature}>
                <CheckCircle2 className={styles.featureCheck} size={20} />
                <span>Escáner de tickets limitado (10/mes)</span>
              </li>
              <li className={styles.pricingFeature}>
                <CheckCircle2 className={styles.featureCheck} size={20} />
                <span>Uso de menús prediseñados</span>
              </li>
            </ul>

            <Link to="/login" className={`${styles.pricingBtn} ${styles.free}`}>
              Empezar Gratis
            </Link>
          </div>

          {/* Plan Premium */}
          <div className={`${styles.pricingCard} ${styles.premium}`}>
            <div className={styles.premiumBadge}>Recomendado</div>
            <div className={styles.pricingHeader}>
              <h3 className={styles.pricingTitle}>Premium</h3>
              <div className={styles.pricingPrice}>
                <span className={styles.pricingCurrency}>€</span>4.99<span className={styles.pricingPeriod}>/mes</span>
              </div>
            </div>

            <ul className={styles.pricingFeatures}>
              <li className={styles.pricingFeature}>
                <CheckCircle2 className={styles.featureCheck} size={20} />
                <span>Todo lo del plan Básico</span>
              </li>
              <li className={styles.pricingFeature}>
                <CheckCircle2 className={styles.featureCheck} size={20} />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Generación ilimitada de menús con IA</span>
              </li>
              <li className={styles.pricingFeature}>
                <CheckCircle2 className={styles.featureCheck} size={20} />
                <span>Escáner de tickets ilimitado con Gemini 2.5</span>
              </li>
              <li className={styles.pricingFeature}>
                <CheckCircle2 className={styles.featureCheck} size={20} />
                <span>Búsqueda avanzada en Open Food Facts</span>
              </li>
            </ul>

            <Link to="/login" className={`${styles.pricingBtn} ${styles.paid}`}>
              Obtener Premium
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.logoContainer} style={{ justifyContent: 'center', marginBottom: '1rem', opacity: 0.8 }}>
          <Leaf size={16} />
          <span style={{ fontWeight: 600 }}>SmartFoodAI</span>
        </div>
        <p>© 2026 SmartFoodAI.</p>
      </footer>
    </div>
  );
}
