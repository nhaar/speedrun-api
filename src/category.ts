interface SubcategoryValue {
  variableId: string
  valueId: string
}

export interface SpeedrunCategoryId {
  gameId: string
  categoryId: string
  subcategories: SubcategoryValue[]
}

export interface SpeedrunCategory {
  gameUrl: string
  categoryName: string
  subcategoryNames: string[]
}
