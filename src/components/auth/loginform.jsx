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
		<div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm bg-white shadow-2xl rounded-2xl px-4 py-6 sm:p-8 mx-auto">
			{/* Icono usuario */}
			<div className="flex justify-center mb-6">
				<svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth="1.5" className="bg-blue-100 rounded-full p-2">
					<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.25a7.75 7.75 0 0115.5 0v.25a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75v-.25z" />
				</svg>
			</div>
			<form onSubmit={handleSubmit} className="w-full space-y-4 sm:space-y-6">
				{/* Campo de email */}
				<div>
					<input
						className="w-full border border-blue-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50 text-gray-900 placeholder-gray-400 text-base transition shadow-sm"
						type="email"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="Correo electrónico"
						autoComplete="username"
					/>
				</div>
				{/* Campo de contraseña */}
				<div>
					<input
						className="w-full border border-blue-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50 text-gray-900 placeholder-gray-400 text-base transition shadow-sm"
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
					className="w-full btn-responsive rounded-lg bg-blue-600 text-white font-bold text-base shadow-md hover:bg-blue-700 transition disabled:opacity-60 tracking-widest touch-target"
				>
					{loading ? "Procesando..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
				</button>
				{/* Enlace de recuperación de contraseña */}
				<div className="text-center mt-2">
					<a href="#" className="text-sm text-blue-700 hover:text-blue-900 font-medium touch-target px-2 py-1">¿Olvidaste tu contraseña?</a>
				</div>
			</form>
		</div>
	);
}
