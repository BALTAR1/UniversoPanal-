import { logout } from '../../utils/auth.js';

export default function Sidebar() {
    const handleLogout = () => {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            logout();
        }
    };

    return (
        <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
                <h1 className="text-2xl font-bold">🍼 Mundo Pañal</h1>
                <p className="text-sm text-gray-400 mt-1">Panel Administrativo</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
                <ul className="space-y-2">
                    <li>
                        <a href="/dashboard" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span>Inicio</span>
                        </a>
                    </li>
                    <li>
                        <a href="/dashboard/productos" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <span>Productos</span>
                        </a>
                    </li>
                    <li>
                        <a href="/dashboard/categorias" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span>Categorías</span>
                        </a>
                    </li>
                </ul>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-600 transition bg-red-500"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}
