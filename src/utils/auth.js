/**
 * Utilidades de autenticación
 * Funciones para manejar la autenticación de usuarios
 */

import { supabase } from '../lib/supabaseCliente.js';

/**
 * Verifica si el usuario está autenticado
 * Si no lo está, redirige a la página de login
 */
export async function requireAuth() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('❌ Error al verificar sesión:', error);
            window.location.href = '/login';
            return null;
        }

        if (!session) {
            console.log('⚠️ No hay sesión activa, redirigiendo a login...');
            window.location.href = '/login';
            return null;
        }

        console.log('✅ Usuario autenticado:', session.user.email);
        return session;
    } catch (error) {
        console.error('❌ Error en requireAuth:', error);
        window.location.href = '/login';
        return null;
    }
}

/**
 * Cierra la sesión del usuario actual
 */
export async function logout() {
    try {
        console.log('🔓 Cerrando sesión...');
        
        // Limpiar token del localStorage
        localStorage.removeItem('supabase_token');
        
        // Cerrar sesión en Supabase
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error('❌ Error al cerrar sesión:', error);
            throw error;
        }

        console.log('✅ Sesión cerrada exitosamente');
        
        // Redirigir a la página de login
        window.location.href = '/login';
    } catch (error) {
        console.error('❌ Error en logout:', error);
        alert('Error al cerrar sesión. Inténtalo de nuevo.');
    }
}

/**
 * Obtiene la sesión actual del usuario
 * @returns {Promise<Session|null>} La sesión actual o null si no hay sesión
 */
export async function getSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('❌ Error al obtener sesión:', error);
            return null;
        }

        return session;
    } catch (error) {
        console.error('❌ Error en getSession:', error);
        return null;
    }
}

/**
 * Obtiene el usuario actual
 * @returns {Promise<User|null>} El usuario actual o null si no hay sesión
 */
export async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            console.error('❌ Error al obtener usuario:', error);
            return null;
        }

        return user;
    } catch (error) {
        console.error('❌ Error en getCurrentUser:', error);
        return null;
    }
}

/**
 * Verifica si el usuario actual es administrador
 * @returns {Promise<boolean>} True si es admin, false en caso contrario
 */
export async function isAdmin() {
    try {
        const user = await getCurrentUser();
        
        if (!user) {
            return false;
        }

        // Aquí puedes agregar lógica adicional para verificar roles
        // Por ahora, cualquier usuario autenticado es considerado admin
        const adminEmail = import.meta.env.PUBLIC_ADMIN_EMAIL || 'devfue993@gmail.com';
        
        return user.email === adminEmail;
    } catch (error) {
        console.error('❌ Error en isAdmin:', error);
        return false;
    }
}

/**
 * Escucha cambios en el estado de autenticación
 * @param {Function} callback - Función que se ejecuta cuando cambia el estado
 */
export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔄 Estado de autenticación cambió:', event);
        callback(event, session);
    });
}
