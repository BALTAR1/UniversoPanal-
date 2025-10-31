import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseCliente.js";

// Componente para restablecer la contraseña
export default function ResetPasswordForm() {
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [mensaje, setMensaje] = useState("");
	const [error, setError] = useState(false);
	const [tokenValido, setTokenValido] = useState(false);

	// Verificar si hay un token válido en la URL
	useEffect(() => {
		// Supabase automáticamente detecta el hash fragment con el token
		const checkSession = async () => {
			const { data: { session }, error } = await supabase.auth.getSession();
			
			if (error || !session) {
				setError(true);
				setMensaje("❌ El enlace de recuperación es inválido o ha expirado");
			} else {
				setTokenValido(true);
			}
		};

		checkSession();
	}, []);

	// Función para manejar el cambio de contraseña
	async function handleSubmit(e) {
		e.preventDefault();
		
		// Validar que las contraseñas coincidan
		if (password !== confirmPassword) {
			setError(true);
			setMensaje("❌ Las contraseñas no coinciden");
			return;
		}

		// Validar longitud mínima
		if (password.length < 6) {
			setError(true);
			setMensaje("❌ La contraseña debe tener al menos 6 caracteres");
			return;
		}

		setLoading(true);
		setMensaje("");
		setError(false);

		try {
			const { error } = await supabase.auth.updateUser({
				password: password
			});

			if (error) {
				throw error;
			}

			setError(false);
			setMensaje("✅ Contraseña actualizada correctamente. Redirigiendo...");
			
			// Redirigir al login después de 2 segundos
			setTimeout(() => {
				window.location.href = "/loginAM";
			}, 2000);

		} catch (err) {
			setError(true);
			setMensaje(err.message || "Error al actualizar la contraseña");
		} finally {
			setLoading(false);
		}
	}

	// Si el token no es válido, mostrar mensaje de error
	if (error && !tokenValido) {
		return (
			<div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm bg-white/70 shadow-xl rounded-2xl px-3 py-4 sm:px-5 sm:py-6 mx-auto backdrop-blur-md border border-red-200">
				<div className="text-center">
					<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full mb-4">
						<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
					</div>
					<h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Enlace inválido</h2>
					<p className="text-sm text-gray-600 mb-6 px-4">{mensaje}</p>
					<a 
						href="/loginAM" 
						className="inline-block bg-[#2563eb] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#1d4ed8] transition shadow-md hover:shadow-lg text-sm"
					>
						Volver al login
					</a>
				</div>
			</div>
		);
	}

	// Formulario para cambiar la contraseña
	return (
		<div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm bg-white/70 shadow-xl rounded-2xl px-3 py-4 sm:px-5 sm:py-6 mx-auto backdrop-blur-md border border-[#e0f2fe]/60">
			<div className="w-full mb-4 text-center">
				<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#7be3f7] to-[#2563eb] rounded-full mb-3">
					<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
					</svg>
				</div>
				<h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Nueva contraseña</h2>
				<p className="text-xs sm:text-sm text-gray-600">Ingresa tu nueva contraseña de forma segura</p>
			</div>

			<form onSubmit={handleSubmit} className="w-full space-y-4 sm:space-y-5">
				{/* Campo de nueva contraseña */}
				<div className="relative">
					<span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#f7b6d2]">
						<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<rect x="6" y="10" width="12" height="8" rx="2" strokeWidth="1.5" />
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14v2" />
							<circle cx="12" cy="13" r="1" />
						</svg>
					</span>
					<input
						className="w-full border border-[#f7b6d2] rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#f7b6d2] bg-[#fdf6fa] text-gray-900 placeholder-gray-400 text-base transition shadow-sm"
						type="password"
						minLength={6}
						required
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Nueva contraseña"
						autoComplete="new-password"
					/>
				</div>

				{/* Campo de confirmar contraseña */}
				<div className="relative">
					<span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#f7b6d2]">
						<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<rect x="6" y="10" width="12" height="8" rx="2" strokeWidth="1.5" />
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14v2" />
							<circle cx="12" cy="13" r="1" />
						</svg>
					</span>
					<input
						className="w-full border border-[#f7b6d2] rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#f7b6d2] bg-[#fdf6fa] text-gray-900 placeholder-gray-400 text-base transition shadow-sm"
						type="password"
						minLength={6}
						required
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						placeholder="Confirmar contraseña"
						autoComplete="new-password"
					/>
				</div>

				{/* Mensaje de error o éxito */}
				{mensaje && (
					<p 
						className="text-sm text-center font-medium px-2" 
						style={{color: error ? '#dc2626' : '#10b981'}}
					>
						{mensaje}
					</p>
				)}

				{/* Botón de enviar */}
				<button
					type="submit"
					disabled={loading}
					className="w-full btn-responsive rounded-lg bg-[#2563eb] text-white font-bold text-base shadow-md hover:scale-105 hover:shadow-xl transition disabled:opacity-60 tracking-widest touch-target py-2.5"
				>
					{loading ? "Actualizando..." : "Cambiar contraseña"}
				</button>

				{/* Volver al login */}
				<div className="text-center mt-2">
					<a 
						href="/loginAM"
						className="text-sm text-[#2563eb] hover:underline font-medium touch-target px-2 py-1 transition-colors"
					>
						Volver al login
					</a>
				</div>
			</form>
		</div>
	);
}
