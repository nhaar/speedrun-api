interface SubcategoryValue {
  variableId: string
  valueId: string
}

/**
 * Class represents a specific category, which in the website jargon is a combination of the game (of course), the category
 * and all subcategories that apply.
 */
export default class SpeedrunCategory {
  gameId: string
  categoryId: string
  subcategories: SubcategoryValue[]

  constructor (gameId: string, categoryId: string, subcategories: SubcategoryValue[]) {
    this.gameId = gameId
    this.categoryId = categoryId
    this.subcategories = subcategories
  }
}