# Script de Corrección Masiva de Controladores
# Reemplaza seller_id por store_id y corrige nombres de columnas

import os
import re

# Directorio de controladores
controllers_dir = "/workspaces/Delicrunch/Backend/controllers"

# Mapeo de reemplazos
replacements = {
    # Products
    "seller_id": "store_id",
    "p.seller_id": "p.store_id",
    
    # Users
    "u.name": "u.nombre",
    "u.role": "u.rol",
    "user.role": "user.rol",
    "users.name": "users.nombre",
    "users.role": "users.rol",
    "users.password": "users.password_hash",
    "user.password": "user.password_hash",
    
    # Products columns
    "p.name": "p.nombre",
    "p.description": "p.descripcion",
    "p.price": "p.precio_descuento",
    "p.compare_price": "p.precio_original",
    "p.stock": "p.cantidad_disponible",
    "p.category": "p.categoria",
    "p.image_url": "p.imagen_url",
    "p.is_active": "p.activo",
    
    # Reviews
    "r.rating": "r.calificacion",
    "r.comment": "r.comentario",
}

def process_file(filepath):
    """Procesa un archivo aplicando los reemplazos"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    for old, new in replacements.items():
        content = content.replace(old, new)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Actualizado: {filepath}")
        return True
    return False

def main():
    """Procesa todos los archivos de controladores"""
    updated_count = 0
    
    for filename in os.listdir(controllers_dir):
        if filename.endswith(".js"):
            filepath = os.path.join(controllers_dir, filename)
            if process_file(filepath):
                updated_count += 1
    
    print(f"\n📊 Total archivos actualizados: {updated_count}")

if __name__ == "__main__":
    main()
