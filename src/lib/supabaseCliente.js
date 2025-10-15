import { createClient } from '@supabase/supabase-js';

// Obtiene las variables de entorno del proyecto para la conexión
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

console.log("🔧 [DEBUG] Inicializando cliente de Supabase...");
console.log("🌐 [DEBUG] SUPABASE_URL:", supabaseUrl);
console.log("🔑 [DEBUG] SUPABASE_ANON_KEY:", supabaseAnonKey ? "Presente (longitud: " + supabaseAnonKey.length + ")" : "No configurada");

// Validación de variables de entorno
if (!supabaseUrl || !supabaseAnonKey) {
	console.error('❌ [ERROR] Variables de entorno de Supabase no configuradas');
	console.error('PUBLIC_SUPABASE_URL:', supabaseUrl);
	console.error('PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Configurada' : 'No configurada');
	throw new Error('Variables de entorno de Supabase requeridas: PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY');
}

// Crea y exporta una instancia del cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		// Guarda la sesión del usuario en el navegador
		persistSession: true,
		// Refresca el token automáticamente cuando expira
		autoRefreshToken: true,
		// Detecta la sesión en la URL después de autenticación externa
		detectSessionInUrl: true,
	},
});

console.log("✅ [SUCCESS] Cliente de Supabase creado exitosamente");