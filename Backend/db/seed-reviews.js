/**
 * Script para crear reseñas de prueba y actualizar promedios
 */

const pool = require('./index');

const seedReviews = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('⭐ Creando reseñas de prueba...\n');

    // Verificar si ya hay órdenes
    const ordersResult = await client.query('SELECT id, user_id, store_id FROM orders LIMIT 10');
    
    if (ordersResult.rows.length === 0) {
      console.log('⚠️ No hay órdenes para crear reseñas. Primero crea algunas órdenes.');
      await client.query('ROLLBACK');
      return;
    }

    // Obtener información de productos de las órdenes
    const orderItemsResult = await client.query(`
      SELECT o.id as order_id, o.user_id, o.store_id, 
             oi.product_id, p.nombre as product_name,
             s.nombre_comercio
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN stores s ON o.store_id = s.id
      WHERE NOT EXISTS (SELECT 1 FROM reviews r WHERE r.order_id = o.id)
      LIMIT 10
    `);

    if (orderItemsResult.rows.length === 0) {
      console.log('✅ Todas las órdenes ya tienen reseñas o no hay órdenes disponibles.');
      await client.query('COMMIT');
      return;
    }

    // Comentarios de ejemplo
    const comentarios = {
      5: [
        '¡Excelente! Todo muy fresco y delicioso. Definitivamente regresaré.',
        '¡Increíble calidad a un precio muy justo! 100% recomendado.',
        'Superó mis expectativas. El pack venía muy bien surtido.',
        'Perfecto, mejor de lo que esperaba. Gran variedad.',
        '¡Me encantó! La frescura de los productos es notable.'
      ],
      4: [
        'Muy bueno, solo tardaron un poco en tener listo el pedido.',
        'Buena relación calidad-precio, aunque la porción fue un poco pequeña.',
        'Me gustó mucho, volveré. Solo faltó más variedad.',
        'Excelente sabor, la atención fue muy amable.',
        'Buena experiencia en general, recomiendo probar.'
      ],
      3: [
        'Estuvo bien, nada del otro mundo pero cumple.',
        'Precio justo por lo que recibí, aunque esperaba más.',
        'Regular, he tenido mejores experiencias.',
        'Aceptable, pero puede mejorar en presentación.',
        'Normal, ni bien ni mal. Probaré de nuevo.'
      ],
      2: [
        'No fue lo que esperaba, la porción era muy pequeña.',
        'El sabor estaba bien pero llegó un poco frío.',
        'Esperaba más por el precio que pagué.',
        'La calidad no fue la mejor esta vez.',
        'Decepcionante, he tenido mejores experiencias aquí.'
      ],
      1: [
        'Mala experiencia, el producto no estaba fresco.',
        'No recomiendo, muy por debajo de lo esperado.',
        'Decepcionante, no volveré a comprar.',
        'El peor pack que he recibido hasta ahora.',
        'Muy mala calidad, pedí reembolso.'
      ]
    };

    let reviewsCreated = 0;

    for (const order of orderItemsResult.rows) {
      // Generar rating aleatorio ponderado (más probabilidad de ratings altos)
      const ratingWeights = [1, 2, 5, 8, 10]; // Pesos para 1, 2, 3, 4, 5 estrellas
      const totalWeight = ratingWeights.reduce((a, b) => a + b, 0);
      let random = Math.random() * totalWeight;
      let rating = 5;
      for (let i = 0; i < ratingWeights.length; i++) {
        random -= ratingWeights[i];
        if (random <= 0) {
          rating = i + 1;
          break;
        }
      }

      // Seleccionar comentario aleatorio para ese rating
      const comentariosRating = comentarios[rating];
      const comentario = comentariosRating[Math.floor(Math.random() * comentariosRating.length)];

      try {
        await client.query(`
          INSERT INTO reviews (user_id, store_id, order_id, product_id, calificacion, comentario, nombre_producto, visible, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days')
          ON CONFLICT (user_id, order_id) DO NOTHING
        `, [
          order.user_id,
          order.store_id,
          order.order_id,
          order.product_id,
          rating,
          comentario,
          order.product_name || 'Pack Sorpresa'
        ]);
        reviewsCreated++;
        console.log(`  ✅ Reseña creada: ${rating}⭐ para "${order.product_name}" en ${order.nombre_comercio}`);
      } catch (err) {
        // Si ya existe, continuar
        if (!err.message.includes('duplicate')) {
          console.log(`  ⚠️ Error en reseña: ${err.message}`);
        }
      }
    }

    // Actualizar promedios de productos
    console.log('\n📊 Actualizando promedios de productos...');
    await client.query(`
      UPDATE products p
      SET calificacion_promedio = subq.avg_rating,
          total_reviews = subq.count_reviews
      FROM (
        SELECT product_id, 
               COALESCE(AVG(calificacion), 0) as avg_rating,
               COUNT(*) as count_reviews
        FROM reviews
        WHERE visible = TRUE AND product_id IS NOT NULL
        GROUP BY product_id
      ) subq
      WHERE p.id = subq.product_id
    `);

    // Actualizar promedios de tiendas
    console.log('📊 Actualizando promedios de tiendas...');
    await client.query(`
      UPDATE stores s
      SET calificacion_promedio = subq.avg_rating,
          total_reviews = subq.count_reviews
      FROM (
        SELECT store_id, 
               COALESCE(AVG(calificacion), 0) as avg_rating,
               COUNT(*) as count_reviews
        FROM reviews
        WHERE visible = TRUE
        GROUP BY store_id
      ) subq
      WHERE s.id = subq.store_id
    `);

    await client.query('COMMIT');
    console.log(`\n✅ ${reviewsCreated} reseñas creadas y promedios actualizados.`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

seedReviews();
