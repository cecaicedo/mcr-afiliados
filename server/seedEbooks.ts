import { getDb } from "./db";
import { productos } from "../drizzle/schema";

const hotlinks = [
  { nombre: "Finanzas Personales y Libertad Financiera", enlace: "https://go.hotmart.com/K106106565Q", categoria: "Finanzas", precio: 27.00, rating: 9.6 },
  { nombre: "Estrategias de Contenido para Redes Sociales", enlace: "https://go.hotmart.com/R105989386B", categoria: "Marketing", precio: 34.99, rating: 9.4 },
  { nombre: "Monetización de Instagram y TikTok", enlace: "https://go.hotmart.com/Q106091229E", categoria: "Marketing", precio: 29.99, rating: 9.7 },
  { nombre: "Masterclass de Ventas por WhatsApp", enlace: "https://go.hotmart.com/G105574791V", categoria: "Ventas", precio: 37.00, rating: 9.8 },
  { nombre: "Hábitos de Alta Productividad Diaria", enlace: "https://go.hotmart.com/S104989629A", categoria: "Desarrollo Personal", precio: 24.99, rating: 9.3 },
  { nombre: "Emprendimiento Digital desde Cero", enlace: "https://go.hotmart.com/D105861625R", categoria: "Negocios", precio: 39.99, rating: 9.5 },
  { nombre: "Copywriting Persuasivo para Afiliados", enlace: "https://go.hotmart.com/U105996846E", categoria: "Marketing", precio: 27.50, rating: 9.6 },
  { nombre: "Nutrición Consciente y Estilo de Vida", enlace: "https://go.hotmart.com/N106338508K", categoria: "Bienestar", precio: 22.00, rating: 9.2 },
  { nombre: "Inversiones en Criptomonedas para Principiantes", enlace: "https://go.hotmart.com/T105869649C", categoria: "Finanzas", precio: 47.00, rating: 9.4 },
  { nombre: "Marketing de Afiliados Hotmart Avanzado", enlace: "https://go.hotmart.com/M105939478U", categoria: "Negocios", precio: 49.99, rating: 9.9 },
  { nombre: "Diseño Gráfico con Canva para Emprendedores", enlace: "https://go.hotmart.com/I105968421U", categoria: "Diseño", precio: 25.00, rating: 9.5 },
  { nombre: "Ingles Fluido en 90 Días", enlace: "https://go.hotmart.com/T107058792G", categoria: "Educación", precio: 35.00, rating: 9.3 },
  { nombre: "Psicología del Consumidor y Ventas Online", enlace: "https://go.hotmart.com/W105806820T", categoria: "Ventas", precio: 32.00, rating: 9.6 },
  { nombre: "Automatización de Negocios con IA", enlace: "https://go.hotmart.com/B105565939R", categoria: "Tecnología", precio: 49.00, rating: 9.8 },
  { nombre: "Yoga y Meditación para la Paz Interior", enlace: "https://go.hotmart.com/O106022440S", categoria: "Bienestar", precio: 19.99, rating: 9.4 },
  { nombre: "E-commerce y Dropshipping Exitoso", enlace: "https://go.hotmart.com/R105843778Q", categoria: "Negocios", precio: 39.00, rating: 9.5 },
  { nombre: "Repostería Artesanal Rentable en Casa", enlace: "https://go.hotmart.com/G105858370B", categoria: "Gastronomía", precio: 29.99, rating: 9.7 },
  { nombre: "Fotografía con Smartphone Profesional", enlace: "https://go.hotmart.com/W105957649E", categoria: "Diseño", precio: 27.00, rating: 9.4 },
  { nombre: "Liderazgo y Oratoria de Alto Impacto", enlace: "https://go.hotmart.com/P105772906D", categoria: "Desarrollo Personal", precio: 29.00, rating: 9.5 },
  { nombre: "Maquillaje Profesional Paso a Paso", enlace: "https://go.hotmart.com/H106391322D", categoria: "Belleza", precio: 24.99, rating: 9.6 },
  { nombre: "Bienes Raíces sin Capital Inicial", enlace: "https://go.hotmart.com/U106325925X", categoria: "Finanzas", precio: 59.00, rating: 9.8 },
  // Adicionales
  { nombre: "Superación de la Ansiedad y Estrés", enlace: "https://go.hotmart.com/T105973831J", categoria: "Bienestar", precio: 23.50, rating: 9.5 },
  { nombre: "Tráfico Pago en Facebook e Instagram Ads", enlace: "https://go.hotmart.com/H106792159W", categoria: "Marketing", precio: 49.99, rating: 9.7 },
  { nombre: "Manual de Cripto-Trading Profesional", enlace: "https://go.hotmart.com/J105318959Y?ap=fdc3", categoria: "Finanzas", precio: 67.00, rating: 9.8 },
  { nombre: "Edición de Videos con CapCut para TikTok", enlace: "https://go.hotmart.com/R106996469U", categoria: "Marketing", precio: 27.00, rating: 9.6 },
  { nombre: "Técnicas de Cierre de Ventas en Llamadas", enlace: "https://go.hotmart.com/W106311613G", categoria: "Ventas", precio: 39.00, rating: 9.7 },
  { nombre: "Huerta Orgánica Urbana en Casa", enlace: "https://go.hotmart.com/L105923099M", categoria: "Hogar", precio: 21.00, rating: 9.3 },
  { nombre: "Master en Tik Tok Organic Growth", enlace: "https://go.hotmart.com/E105545596C?ap=c2a6", categoria: "Marketing", precio: 34.99, rating: 9.6 }
];

async function seed() {
  const db = await getDb();
  if (!db) {
    console.error("DB not available");
    return;
  }
  console.log("Iniciando inserción de ebooks...");
  for (const item of hotlinks) {
    try {
      await db.insert(productos).values({
        nombre: item.nombre,
        descripcion: `Ebook especializado enfocado en ${item.categoria.toLowerCase()}. Ideal para campañas de conversión y automatización por WhatsApp.`,
        enlaceAfiliado: item.enlace,
        precio: item.precio,
        categoria: item.categoria,
        rating: item.rating,
        comentariosCount: Math.floor(Math.random() * 200) + 80,
        imagenUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
        activo: true,
      });
      console.log(`Insertado: ${item.nombre}`);
    } catch (e) {
      console.log(`Error insertando ${item.nombre}:`, e);
    }
  }
  console.log("¡Seed completado con éxito!");
  process.exit(0);
}

seed();
