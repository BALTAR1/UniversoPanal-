import { useState } from "react";
import { supabase } from "../../lib/supabaseCliente.js";

// Middleware to include JWT token in backend requests
function withAuthHeaders(fetchFunction) {
  return async (url, options = {}) => {
    const token = localStorage.getItem("supabase_token");
    if (token) {
      options.headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      };
    }
    return fetchFunction(url, options);
  };
}

const fetchWithAuth = withAuthHeaders(fetch);

// Componente de formulario de login y registro
export default function LoginForm() {

	// Estado para alternar entre login y registro
	const [mode, setMode] = useState("login"); // "login" | "register"
	// Estado para el email del usuario
	const [email, setEmail] = useState("");
	// Estado para la contraseña del usuario
	const [password, setPassword] = useState("");
	// Estado para mostrar si está cargando
	const [loading, setLoading] = useState(false);
	// Estado para mostrar mensajes de error o éxito
	const [mensaje, setMensaje] = useState("");

	// Maneja el envío del formulario
	async function handleSubmit(e) {
            // Previene el comportamiento por defecto del formulario
			e.preventDefault();
			console.log("🔍 [DEBUG] Iniciando proceso de autenticación...");
			console.log("📧 [DEBUG] Email ingresado:", email);
			console.log("🔑 [DEBUG] Contraseña ingresada:", password ? "***" + password.slice(-3) : "vacía");
            // Valida que el email y la contraseña no estén vacíos
			setLoading(true);
			setMensaje("");
			try {
				if (mode === "login") {
					console.log("🔐 [DEBUG] Intentando iniciar sesión con Supabase...");
					// Iniciar sesión con Supabase
					const { data, error } = await supabase.auth.signInWithPassword({ email, password });
					
					console.log("📦 [DEBUG] Respuesta de Supabase:", { data, error });
					
					if (error) {
						console.error("❌ [ERROR] Error de Supabase:", error);
						throw error;
					}
					
					console.log("✅ [SUCCESS] Login exitoso!");
					console.log("🎫 [DEBUG] Token recibido:", data?.session?.access_token ? "Token presente" : "No hay token");
					
					// Guardar el token JWT en localStorage para usarlo en el backend
					if (data && data.session && data.session.access_token) {
						localStorage.setItem("supabase_token", data.session.access_token);
						console.log("💾 [DEBUG] Token guardado en localStorage");
					}
					// Redirige al usuario si el login es exitoso
					console.log("🔄 [DEBUG] Redirigiendo al dashboard...");
					window.location.href = "/dashboard";
				} else {
					console.log("📝 [DEBUG] Intentando registrar usuario...");
					// Registrar usuario con Supabase
					const { error } = await supabase.auth.signUp({ email, password });
					if (error) {
						console.error("❌ [ERROR] Error al registrar:", error);
						throw error;
					}
					console.log("✅ [SUCCESS] Registro exitoso!");
					setMensaje("Revisa tu correo para verificar la cuenta.");
				}
			} catch (err) {
				// Muestra mensaje de error
				console.error("❌ [ERROR FINAL] Error capturado:", err);
				console.error("📝 [ERROR DETAILS] Mensaje:", err.message);
				console.error("📝 [ERROR DETAILS] Código:", err.code);
				console.error("📝 [ERROR DETAILS] Status:", err.status);
				setMensaje(err.message || "Ocurrió un error");
			} finally {
				setLoading(false);
				console.log("🏁 [DEBUG] Proceso de autenticación finalizado");
			}
		}

		return (
			<div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm bg-white/70 shadow-xl rounded-2xl px-3 py-4 sm:px-5 sm:py-6 mx-auto backdrop-blur-md border border-[#e0f2fe]/60">
				<form onSubmit={handleSubmit} className="w-full space-y-4 sm:space-y-6">
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
					{/* Botón principal: login o registro */}
							<button
								type="submit"
								disabled={loading}
								className="w-full btn-responsive rounded-lg bg-[#2563eb] text-white font-bold text-base shadow-md hover:scale-105 hover:shadow-xl transition disabled:opacity-60 tracking-widest touch-target py-2.5"
							>
								{loading ? "Procesando..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
							</button>
					{/* Enlace de recuperación de contraseña */}
							<div className="text-center mt-2">
								<a href="#" className="text-sm text-[#2563eb] hover:underline font-medium touch-target px-2 py-1 transition-colors">¿Olvidaste tu contraseña?</a>
							</div>
					
				</form>
			</div>
		);
}
