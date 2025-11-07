import os
from supabase_client import supabase
from datetime import datetime

# Consultar la oferta ID 10
print("=" * 50)
print("VERIFICACIÓN DE OFERTA ID 10")
print("=" * 50)

response = supabase.table('ofertas').select('*').eq('oferta_id', 10).execute()

if response.data:
    oferta = response.data[0]
    print("\nDatos de la oferta ID 10:")
    print(f"  - ID: {oferta['oferta_id']}")
    print(f"  - Producto ID: {oferta['producto_id']}")
    print(f"  - Descuento: {oferta['descuento']}%")
    print(f"  - Activo: {oferta['activo']}")
    print(f"  - Fecha inicio: {oferta['fecha_inicio']}")
    print(f"  - Fecha fin: {oferta['fecha_fin']}")
    print(f"  - Tipo oferta: {oferta.get('tipo_oferta', 'N/A')}")
    
    # Verificar si está vigente
    now = datetime.utcnow().isoformat()
    print(f"\nFecha actual UTC: {now}")
    print(f"¿Inicio <= Ahora? {oferta['fecha_inicio'] <= now}")
    print(f"¿Fin >= Ahora? {oferta['fecha_fin'] >= now}")
    vigente = oferta['activo'] and oferta['fecha_inicio'] <= now and oferta['fecha_fin'] >= now
    print(f"¿Está vigente? {vigente}")
    
    # Consultar ofertas con el filtro que usa el frontend
    print("\n" + "=" * 50)
    print("OFERTAS ACTIVAS CON FILTRO FRONTEND")
    print("=" * 50)
    ofertas_query = supabase.table('ofertas').select('*').eq('activo', True).lte('fecha_inicio', now).gte('fecha_fin', now).execute()
    print(f"\nTotal de ofertas activas encontradas: {len(ofertas_query.data)}")
    for o in ofertas_query.data:
        print(f"  - Oferta ID {o['oferta_id']}: Producto {o['producto_id']}, {o['descuento']}% OFF")
    
    # Verificar el producto
    print("\n" + "=" * 50)
    print("DATOS DEL PRODUCTO")
    print("=" * 50)
    producto = supabase.table('productos').select('producto_id, nombre, marca, precio, activo').eq('producto_id', oferta['producto_id']).execute()
    if producto.data:
        p = producto.data[0]
        print(f"\nProducto ID {p['producto_id']}: {p['nombre']}")
        print(f"  - Marca: {p['marca']}")
        print(f"  - Precio: ${p['precio']}")
        print(f"  - Activo: {p['activo']}")
else:
    print("No se encontró la oferta ID 10")

print("\n" + "=" * 50)
