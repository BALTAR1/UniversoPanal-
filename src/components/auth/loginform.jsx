// Importa el hook useState de React para manejar estados locales en el componente
import { useState } from "react";
// Importa la instancia de Supabase configurada para el proyecto
import { supabase } from "../../lib/supabaseCliente.js";

// Middleware para incluir el token JWT en las peticiones al backend
function withAuthHeaders(fetchFunction) {
  // Retorna una función que agrega el header Authorization si existe el token
  return async (url, options = {}) => {
    // Obtiene el token JWT guardado en localStorage
    const token = localStorage.getItem("supabase_token");
    // Si existe el token, lo agrega al header Authorization
    if (token) {
      options.headers = {
        ...(options.headers || {}), // Mantiene otros headers existentes
        Authorization: `Bearer ${token}`, // Agrega el token JWT
      };
    }
    // Ejecuta la función fetch original con los headers modificados
    return fetchFunction(url, options);
  };
}

// Crea una versión de fetch que incluye el token JWT automáticamente
const fetchWithAuth = withAuthHeaders(fetch);

// Componente principal de formulario de login
export default function LoginForm() {

	// Estado para el email del usuario
	const [email, setEmail] = useState("");
	// Estado para la contraseña del usuario
	const [password, setPassword] = useState("");
	// Estado para mostrar si está cargando (deshabilita el botón)
	const [loading, setLoading] = useState(false);
	// Estado para mostrar mensajes de error o éxito
	const [mensaje, setMensaje] = useState("");
	// Estado para mostrar el formulario de recuperación
	const [mostrarRecuperacion, setMostrarRecuperacion] = useState(false);

	// Función que maneja el envío del formulario de login
	async function handleSubmit(e) {
    // Previene el comportamiento por defecto del formulario (evita recarga)
		e.preventDefault();
    // Limpia estados y muestra loading
		setLoading(true);
		setMensaje("");
		try {
			// Inicia sesión con Supabase usando email y password
			const { data, error } = await supabase.auth.signInWithPassword({ email, password });
			
			if (error) {
				throw error; // Lanza el error para ser capturado abajo
			}
			
			// Si el login fue exitoso, guarda el token JWT en localStorage
			if (data && data.session && data.session.access_token) {
				localStorage.setItem("supabase_token", data.session.access_token);
			}
			// Redirige al usuario al dashboard
			window.location.href = "/dashboard";
		} catch (err) {
			// Captura y muestra cualquier error ocurrido en login
			setMensaje(err.message || "Ocurrió un error");
		} finally {
			// Finaliza el proceso y quita el estado de loading
			setLoading(false);
		}
	}

	// Función para manejar la recuperación de contraseña
	async function handleRecuperacion(e) {
		e.preventDefault();
		setLoading(true);
		setMensaje("");
		try {
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: `${window.location.origin}/reset-password`,
			});
			
			if (error) {
				throw error;
			}
			
			setMensaje("✅ Te enviamos un correo para recuperar tu contraseña");
		} catch (err) {
			setMensaje(err.message || "Error al enviar el correo");
		} finally {
			setLoading(false);
		}
	}

	// Renderiza el formulario de login
	return (
		<div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm bg-white/70 shadow-xl rounded-2xl px-3 py-4 sm:px-5 sm:py-6 mx-auto backdrop-blur-md border border-[#e0f2fe]/60">
			{!mostrarRecuperacion ? (
				/* Formulario de Login */
				<form onSubmit={handleSubmit} className="w-full space-y-4 sm:space-y-6">
					<div className="text-center mb-2">
						<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#7be3f7] to-[#2563eb] rounded-full mb-3">
							<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
						</div>
						<h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Bienvenido</h2>
						<p className="text-xs sm:text-sm text-gray-600">Ingresa a tu panel de administración</p>
					</div>
					{/* Campo de email */}
					<div className="relative">
						<span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7be3f7]">
							<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l9 6 9-6" /><rect x="3" y="6" width="18" height="12" rx="2" strokeWidth="1.5" /></svg>
						</span>
						<input
							className="w-full border border-[#b6f0fa] rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#7be3f7] bg-[#fafdff] text-gray-900 placeholder-gray-400 text-base transition shadow-sm"
							type="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Correo electrónico"
							autoComplete="username"
						/>
					</div>
					{/* Campo de contraseña */}
					<div className="relative">
						<span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#f7b6d2]">
							<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="6" y="10" width="12" height="8" rx="2" strokeWidth="1.5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14v2" /><circle cx="12" cy="13" r="1" /></svg>
						</span>
						<input
							className="w-full border border-[#f7b6d2] rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#f7b6d2] bg-[#fdf6fa] text-gray-900 placeholder-gray-400 text-base transition shadow-sm"
							type="password"
							minLength={6}
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Contraseña"
							autoComplete="current-password"
						/>
					</div>
					{/* Mensaje de error o éxito */}
					{mensaje && <p className="text-sm text-red-600 text-center font-medium px-2">{mensaje}</p>}
					{/* Botón de login */}
					<button
						type="submit"
						disabled={loading}
						className="w-full btn-responsive rounded-lg bg-[#2563eb] text-white font-bold text-base shadow-md hover:scale-105 hover:shadow-xl transition disabled:opacity-60 tracking-widest touch-target py-2.5"
					>
						{loading ? "Procesando..." : "Iniciar sesión"}
					</button>
					{/* Enlace de recuperación de contraseña */}
					<div className="text-center mt-2">
						<button 
							type="button"
							onClick={() => setMostrarRecuperacion(true)}
							className="text-sm text-[#2563eb] hover:underline font-medium touch-target px-2 py-1 transition-colors"
						>
							¿Olvidaste tu contraseña?
						</button>
					</div>
				</form>
			) : (
				/* Formulario de Recuperación */
				<form onSubmit={handleRecuperacion} className="w-full space-y-4 sm:space-y-5">
					<div className="text-center mb-2">
						<div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#7be3f7] to-[#2563eb] rounded-full mb-2">
							<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
							</svg>
						</div>
						<h3 className="text-lg sm:text-xl font-bold text-gray-800">Recuperar contraseña</h3>
						<p className="text-xs sm:text-sm text-gray-600 mt-1">Te enviaremos un correo para restablecer tu contraseña</p>
					</div>
					{/* Campo de email */}
					<div className="relative">
						<span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7be3f7]">
							<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l9 6 9-6" /><rect x="3" y="6" width="18" height="12" rx="2" strokeWidth="1.5" /></svg>
						</span>
						<input
							className="w-full border border-[#b6f0fa] rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#7be3f7] bg-[#fafdff] text-gray-900 placeholder-gray-400 text-base transition shadow-sm"
							type="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Correo electrónico"
							autoComplete="username"
						/>
					</div>
					{/* Mensaje de error o éxito */}
					{mensaje && <p className="text-sm text-center font-medium px-2" style={{color: mensaje.includes('✅') ? '#10b981' : '#dc2626'}}>{mensaje}</p>}
					{/* Botón de enviar */}
					<button
						type="submit"
						disabled={loading}
						className="w-full btn-responsive rounded-lg bg-[#2563eb] text-white font-bold text-base shadow-md hover:scale-105 hover:shadow-xl transition disabled:opacity-60 tracking-widest touch-target py-2.5"
					>
						{loading ? "Enviando..." : "Enviar correo"}
					</button>
					{/* Volver al login */}
					<div className="text-center mt-2">
						<button 
							type="button"
							onClick={() => {
								setMostrarRecuperacion(false);
								setMensaje("");
							}}
							className="text-sm text-[#2563eb] hover:underline font-medium touch-target px-2 py-1 transition-colors"
						>
							← Volver al login
						</button>
					</div>
				</form>
			)}
		</div>
	);
}
