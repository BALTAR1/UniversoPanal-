import { useState, useEffect } from 'react';
import DataTable from '../../ui/DataTable.jsx';
import Modal from '../../ui/Modal.jsx';
import Button from '../../ui/Button.jsx';
import { ofertasService } from '../../../services/ofertasService.js';
import { productosService } from '../../../services/apiServices.js';

export default function OfertasManager() {
    // Estados
    const [ofertas, setOfertas] = useState([]);
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingOferta, setEditingOferta] = useState(null);
    const [formData, setFormData] = useState({
        producto_id: '',
        descuento: '',
        fecha_inicio: '',
        fecha_fin: '',
        activo: true,
        tipo_oferta: ''
    });
    
    // Tipos de oferta disponibles
    const tiposOferta = [
        { value: '', label: 'Sin especificar' },
        { value: 'temporada', label: 'Temporada' },
        { value: 'liquidacion', label: 'Liquidación' },
        { value: 'oferta_flash', label: 'Oferta Flash' },
        { value: 'black_friday', label: 'Black Friday' },
        { value: 'cyber_monday', label: 'Cyber Monday' },
        { value: 'aniversario', label: 'Aniversario' },
    ];
    
    // Columnas de la tabla
    const columns = [
        { key: 'oferta_id', label: 'ID' },
        {
            key: 'producto',
            label: 'Producto',
            render: (producto) => {
                if (!producto) return <span className="text-gray-400">Sin producto</span>;
                return (
                    <div className="flex items-center gap-2">
                        {producto.imagen_url && (
                            <img
                                src={producto.imagen_url}
                                alt={producto.nombre}
                                className="h-10 w-10 object-cover rounded border border-gray-200"
                            />
                        )}
                        <div>
                            <div className="font-medium text-gray-900">{producto.nombre}</div>
                            <div className="text-xs text-gray-500">{producto.marca}</div>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'producto',
            label: 'Precio Original',
            render: (producto) => {
                if (!producto) return '-';
                return `$${parseFloat(producto.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
            }
        },
        {
            key: 'descuento',
            label: 'Descuento',
            render: (value, row) => {
                const precioOriginal = row.producto?.precio || 0;
                const precioFinal = precioOriginal * (1 - value / 100);
                return (
                    <div>
                        <span className="font-bold text-red-600">{value}% OFF</span>
                        <div className="text-xs text-green-700 font-medium">
                            ${precioFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'tipo_oferta',
            label: 'Tipo',
            render: (value) => {
                if (!value) return <span className="text-gray-400">-</span>;
                const tipo = tiposOferta.find(t => t.value === value);
                return (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        {tipo?.label || value}
                    </span>
                );
            }
        },
        {
            key: 'fecha_inicio',
            label: 'Vigencia',
            render: (inicio, row) => {
                if (!inicio || !row.fecha_fin) return <span className="text-gray-400">Sin vigencia</span>;
                const inicioDate = new Date(inicio).toLocaleDateString('es-AR');
                const finDate = new Date(row.fecha_fin).toLocaleDateString('es-AR');
                
                // Verificar si está vigente
                const now = new Date();
                const start = new Date(inicio);
                const end = new Date(row.fecha_fin);
                const esVigente = now >= start && now <= end;
                
                return (
                    <div className="text-xs">
                        <div className={esVigente ? 'text-green-700 font-medium' : 'text-gray-600'}>
                            {inicioDate} - {finDate}
                        </div>
                        {esVigente && <span className="text-green-600 font-bold">● Vigente</span>}
                    </div>
                );
            }
        },
        {
            key: 'activo',
            label: 'Estado',
            render: (value) => (
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {value ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
    ];

    // Cargar datos al montar
    useEffect(() => {
        cargarDatos();
    }, []);

    async function cargarDatos() {
        try {
            setLoading(true);
            const [ofertasData, productosData] = await Promise.all([
                ofertasService.obtenerTodas({ limit: 100 }),
                productosService.obtenerTodos({ limit: 100 }),
            ]);
            
            setOfertas(ofertasData);
            setProductos(productosData);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            alert('Error al cargar los datos: ' + error.message);
        } finally {
            setLoading(false);
        }
    }

    function handleInputChange(e) {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    }

    function handleCreate() {
        setEditingOferta(null);
        setFormData({
            producto_id: '',
            descuento: '',
            fecha_inicio: '',
            fecha_fin: '',
            activo: true,
            tipo_oferta: ''
        });
        setModalOpen(true);
    }

    function handleEdit(oferta) {
        setEditingOferta(oferta);
        setFormData({
            producto_id: oferta.producto_id || '',
            descuento: oferta.descuento || '',
            fecha_inicio: oferta.fecha_inicio ? oferta.fecha_inicio.split('T')[0] : '',
            fecha_fin: oferta.fecha_fin ? oferta.fecha_fin.split('T')[0] : '',
            activo: oferta.activo !== undefined ? oferta.activo : true,
            tipo_oferta: oferta.tipo_oferta || ''
        });
        setModalOpen(true);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        // Validaciones
        if (!formData.producto_id) {
            alert('Debes seleccionar un producto');
            return;
        }
        const descuento = parseFloat(formData.descuento);
        if (!descuento || descuento <= 0 || descuento > 100) {
            alert('El descuento debe estar entre 0 y 100');
            return;
        }

        try {
            const data = {
                ...formData,
                producto_id: parseInt(formData.producto_id),
                descuento: descuento
            };

            if (editingOferta) {
                await ofertasService.actualizar(editingOferta.oferta_id, data);
                alert('Oferta actualizada correctamente');
            } else {
                await ofertasService.crear(data);
                alert('Oferta creada correctamente');
            }

            setModalOpen(false);
            cargarDatos();
        } catch (error) {
            console.error('Error al guardar oferta:', error);
            alert('Error al guardar: ' + error.message);
        }
    }

    async function handleDelete(oferta) {
        const producto = oferta.producto;
        if (!confirm(`¿Estás seguro de eliminar la oferta del producto "${producto?.nombre || 'N/A'}"?`)) {
            return;
        }

        try {
            await ofertasService.eliminar(oferta.oferta_id);
            alert('Oferta eliminada correctamente');
            cargarDatos();
        } catch (error) {
            console.error('Error al eliminar oferta:', error);
            alert('Error al eliminar: ' + error.message);
        }
    }

    async function handleToggle(oferta) {
        try {
            await ofertasService.toggle(oferta.oferta_id);
            cargarDatos();
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            alert('Error al cambiar estado: ' + error.message);
        }
    }

    function calcularPrecioFinal() {
        if (!formData.producto_id || !formData.descuento) return null;
        const producto = productos.find(p => p.producto_id === parseInt(formData.producto_id));
        if (!producto) return null;
        const precioFinal = producto.precio * (1 - parseFloat(formData.descuento) / 100);
        return {
            original: producto.precio,
            final: precioFinal,
            ahorro: producto.precio - precioFinal
        };
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Ofertas</h1>
                    <p className="text-gray-600 mt-1">Administra descuentos y promociones para productos</p>
                </div>
                <Button onClick={handleCreate}>
                    + Crear Oferta
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={ofertas}
                onEdit={handleEdit}
                onDelete={handleDelete}
                customActions={(oferta) => (
                    <button
                        onClick={() => handleToggle(oferta)}
                        className={`px-3 py-1 rounded text-xs font-medium ${
                            oferta.activo
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                    >
                        {oferta.activo ? 'Desactivar' : 'Activar'}
                    </button>
                )}
            />

            {/* Modal de formulario */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingOferta ? 'Editar Oferta' : 'Crear Oferta'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Seleccionar producto */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Producto *
                        </label>
                        <select
                            name="producto_id"
                            value={formData.producto_id}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            disabled={!!editingOferta}
                        >
                            <option value="">Seleccionar producto</option>
                            {productos.map(producto => (
                                <option key={producto.producto_id} value={producto.producto_id}>
                                    {producto.nombre} - ${producto.precio} ({producto.marca})
                                </option>
                            ))}
                        </select>
                        {editingOferta && (
                            <p className="text-xs text-gray-500 mt-1">No se puede cambiar el producto de una oferta existente</p>
                        )}
                    </div>

                    {/* Descuento */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Porcentaje de Descuento * (0-100)
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                name="descuento"
                                value={formData.descuento}
                                onChange={handleInputChange}
                                step="0.01"
                                min="0"
                                max="100"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                            <span className="text-gray-700 font-medium">%</span>
                        </div>
                    </div>

                    {/* Vista previa de precio */}
                    {(() => {
                        const precios = calcularPrecioFinal();
                        return precios && (
                            <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Vista Previa del Descuento</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Precio Original:</span>
                                        <span className="line-through text-gray-500">
                                            ${precios.original.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Descuento:</span>
                                        <span className="text-red-600 font-bold">{formData.descuento}% OFF</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t border-red-200 pt-2 mt-2">
                                        <span className="text-green-700">Precio Final:</span>
                                        <span className="text-green-700">
                                            ${precios.final.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="text-center text-green-600 font-medium">
                                        ¡Ahorro de ${precios.ahorro.toLocaleString('es-AR', { minimumFractionDigits: 2 })}!
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Tipo de oferta */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Oferta
                        </label>
                        <select
                            name="tipo_oferta"
                            value={formData.tipo_oferta}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {tiposOferta.map(tipo => (
                                <option key={tipo.value} value={tipo.value}>
                                    {tipo.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Fechas de vigencia */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha Inicio
                            </label>
                            <input
                                type="date"
                                name="fecha_inicio"
                                value={formData.fecha_inicio}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha Fin
                            </label>
                            <input
                                type="date"
                                name="fecha_fin"
                                value={formData.fecha_fin}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Estado activo */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="activo"
                            checked={formData.activo}
                            onChange={handleInputChange}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label className="text-sm font-medium text-gray-700">
                            Oferta activa
                        </label>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">
                            {editingOferta ? 'Actualizar' : 'Crear'}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                            Cancelar
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
