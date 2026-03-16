import { eq } from 'drizzle-orm'
import { getDb } from '../../../utils/db'
import { products } from '../../../database/schema/products'
import { categories } from '../../../database/schema/categories'

export default defineEventHandler(async (event) => {
  await requireAdminRole(event)

  const db = getDb()

  const allProducts = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      imageUrl: products.imageUrl,
      categoryId: products.categoryId,
      categoryName: categories.name,
      calories: products.calories,
      protein: products.protein,
      carbs: products.carbs,
      fat: products.fat,
      isVegetarian: products.isVegetarian,
      isVegan: products.isVegan,
      isGlutenFree: products.isGlutenFree,
      isLowCarb: products.isLowCarb,
      isAvailable: products.isAvailable,
      createdAt: products.createdAt
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(categories.name, products.name)

  return allProducts
})
