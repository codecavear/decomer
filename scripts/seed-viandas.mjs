import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('[seed-viandas] ERROR: DATABASE_URL environment variable is not set')
  process.exit(1)
}

const sql = postgres(connectionString)

const sampleViandas = [
  {
    name: 'Pollo al horno con batatas',
    slug: 'pollo-horno-batatas',
    description: 'Pechuga de pollo marinada con especias, acompañada de batatas asadas y vegetales salteados.',
    calories: 520,
    protein: '45.5',
    carbs: '38.2',
    fats: '15.8',
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: true,
    isLowCarb: false,
    isHighProtein: true,
    ingredients: JSON.stringify(['pechuga de pollo', 'batatas', 'pimientos', 'cebolla', 'aceite de oliva', 'especias']),
    price: '3500.00'
  },
  {
    name: 'Fideos integrales con salsa de tomate casera',
    slug: 'fideos-integrales-tomate',
    description: 'Pasta integral con salsa de tomate natural, albahaca fresca y queso rallado.',
    calories: 450,
    protein: '18.0',
    carbs: '65.0',
    fats: '12.5',
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    isLowCarb: false,
    isHighProtein: false,
    ingredients: JSON.stringify(['fideos integrales', 'tomate', 'albahaca', 'ajo', 'aceite de oliva', 'queso rallado']),
    price: '2800.00'
  },
  {
    name: 'Bowl vegano de quinoa y garbanzos',
    slug: 'bowl-quinoa-garbanzos',
    description: 'Quinoa cocida con garbanzos especiados, espinaca, zanahoria y hummus casero.',
    calories: 480,
    protein: '22.0',
    carbs: '58.0',
    fats: '16.0',
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    isLowCarb: false,
    isHighProtein: false,
    ingredients: JSON.stringify(['quinoa', 'garbanzos', 'espinaca', 'zanahoria', 'hummus', 'tahini', 'limon']),
    price: '3200.00'
  },
  {
    name: 'Salmón grillado con brócoli',
    slug: 'salmon-brocoli',
    description: 'Filet de salmón a la parrilla con brócoli al vapor y arroz yamaní.',
    calories: 550,
    protein: '42.0',
    carbs: '35.0',
    fats: '22.0',
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: true,
    isLowCarb: false,
    isHighProtein: true,
    ingredients: JSON.stringify(['salmón', 'brócoli', 'arroz yamaní', 'limón', 'aceite de oliva', 'ajo']),
    price: '4500.00'
  },
  {
    name: 'Carne al wok con verduras',
    slug: 'carne-wok-verduras',
    description: 'Tiras de carne magra salteadas al wok con mix de vegetales frescos y salsa teriyaki casera.',
    calories: 490,
    protein: '38.0',
    carbs: '28.0',
    fats: '18.5',
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isLowCarb: true,
    isHighProtein: true,
    ingredients: JSON.stringify(['carne magra', 'brócoli', 'pimientos', 'zanahoria', 'cebolla', 'salsa teriyaki', 'jengibre']),
    price: '3800.00'
  },
  {
    name: 'Milanesa de berenjena con ensalada',
    slug: 'milanesa-berenjena',
    description: 'Milanesas de berenjena al horno acompañadas de ensalada mixta.',
    calories: 380,
    protein: '12.0',
    carbs: '42.0',
    fats: '18.0',
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    isLowCarb: false,
    isHighProtein: false,
    ingredients: JSON.stringify(['berenjena', 'pan rallado', 'huevo', 'lechuga', 'tomate', 'zanahoria', 'aceite de oliva']),
    price: '2600.00'
  },
  {
    name: 'Pechuga de pollo a la mostaza',
    slug: 'pollo-mostaza',
    description: 'Pechuga de pollo con salsa de mostaza y miel, acompañada de puré de calabaza.',
    calories: 510,
    protein: '44.0',
    carbs: '32.0',
    fats: '16.0',
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: true,
    isLowCarb: false,
    isHighProtein: true,
    ingredients: JSON.stringify(['pechuga de pollo', 'mostaza', 'miel', 'calabaza', 'leche', 'manteca', 'nuez moscada']),
    price: '3400.00'
  },
  {
    name: 'Risotto de hongos y espinaca',
    slug: 'risotto-hongos',
    description: 'Arroz arborio cremoso con hongos salteados, espinaca y queso parmesano.',
    calories: 480,
    protein: '16.0',
    carbs: '62.0',
    fats: '18.0',
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: true,
    isLowCarb: false,
    isHighProtein: false,
    ingredients: JSON.stringify(['arroz arborio', 'hongos', 'espinaca', 'cebolla', 'vino blanco', 'queso parmesano', 'caldo de verduras']),
    price: '3600.00'
  },
  {
    name: 'Taco bowl bajo en carbos',
    slug: 'taco-bowl-low-carb',
    description: 'Carne picada especiada sobre base de coliflor, con palta, tomate y queso.',
    calories: 420,
    protein: '35.0',
    carbs: '18.0',
    fats: '22.0',
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: true,
    isLowCarb: true,
    isHighProtein: true,
    ingredients: JSON.stringify(['carne picada', 'coliflor', 'palta', 'tomate', 'queso rallado', 'especias mexicanas', 'cilantro']),
    price: '3700.00'
  },
  {
    name: 'Lentejas con vegetales',
    slug: 'lentejas-vegetales',
    description: 'Guiso de lentejas rojas con zanahoria, apio y batatas. Comfort food saludable.',
    calories: 390,
    protein: '20.0',
    carbs: '55.0',
    fats: '8.0',
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    isLowCarb: false,
    isHighProtein: false,
    ingredients: JSON.stringify(['lentejas rojas', 'zanahoria', 'apio', 'batata', 'cebolla', 'ajo', 'comino', 'caldo de verduras']),
    price: '2900.00'
  }
]

async function seedViandas() {
  console.log('[seed-viandas] 🍽️  Starting viandas seed...')

  try {
    // Insert viandas
    console.log('[seed-viandas] 📦 Seeding viandas...')
    for (const vianda of sampleViandas) {
      await sql`
        INSERT INTO decomer_viandas (
          name, slug, description, 
          calories, protein, carbs, fats,
          is_vegetarian, is_vegan, is_gluten_free, is_low_carb, is_high_protein,
          ingredients, price, is_available
        ) VALUES (
          ${vianda.name}, ${vianda.slug}, ${vianda.description},
          ${vianda.calories}, ${vianda.protein}, ${vianda.carbs}, ${vianda.fats},
          ${vianda.isVegetarian}, ${vianda.isVegan}, ${vianda.isGlutenFree}, ${vianda.isLowCarb}, ${vianda.isHighProtein},
          ${vianda.ingredients}, ${vianda.price}, true
        )
        ON CONFLICT DO NOTHING
      `
    }
    console.log(`[seed-viandas] ✅ ${sampleViandas.length} viandas seeded`)

    // Create a weekly menu for this week
    console.log('[seed-viandas] 📅 Creating weekly menu...')
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - now.getDay() + 1) // Get Monday
    monday.setHours(0, 0, 0, 0)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    const result = await sql`
      INSERT INTO decomer_weekly_menus (week_start, week_end, is_active)
      VALUES (${monday.toISOString()}, ${sunday.toISOString()}, true)
      ON CONFLICT DO NOTHING
      RETURNING id
    `

    if (result.length > 0) {
      const weeklyMenuId = result[0].id
      console.log(`[seed-viandas] ✅ Weekly menu created for ${monday.toISOString().split('T')[0]}`)

      // Get all viandas
      const allViandas = await sql`SELECT id FROM decomer_viandas`

      // Add all viandas to this week's menu
      console.log('[seed-viandas] 🔗 Adding viandas to weekly menu...')
      for (const vianda of allViandas) {
        await sql`
          INSERT INTO decomer_weekly_menu_viandas (weekly_menu_id, vianda_id, is_available)
          VALUES (${weeklyMenuId}, ${vianda.id}, true)
          ON CONFLICT DO NOTHING
        `
      }
      console.log(`[seed-viandas] ✅ ${allViandas.length} viandas added to weekly menu`)
    } else {
      console.log('[seed-viandas] ℹ️  Weekly menu already exists')
    }

    console.log('[seed-viandas] ✨ Viandas seed completed successfully!')
  } catch (error) {
    console.error('[seed-viandas] ❌ Viandas seed failed:', error.message)
    throw error
  } finally {
    await sql.end()
  }
}

seedViandas()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
