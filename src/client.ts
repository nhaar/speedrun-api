import { GameData, GameLeaderboard, ObsoleteFilterStatus, Run, Value, Variable } from './api-types'
import { SpeedrunCategoryId, SpeedrunCategory } from './category'
import SpeedrunBaseClient from './base-client'

/**
 * Object that contains the optional parameters for editting a run; it is similar to the RunSettings object, but focusing in having only the parameters that can be edited and being optional.
 */
interface EditParams {
  gameId?: string
  categoryId?: string
  playerNames?: string[]
  time?: { hour: number, minute: number, second: number, milisecond: number }
  platformId?: string
  emulator?: string
  video?: string
  comment?: string
  date?: string
  values?: Array<{
    variableId: string
    valueId: string
  }>
}

interface LeaderboardFilterParams {
  obsolete?: ObsoleteFilterStatus
}

export default class SpeedrunClient {
  baseClient: SpeedrunBaseClient

  constructor (sessionId: string = '', csrfToken: string = '') {
    this.baseClient = new SpeedrunBaseClient(sessionId, csrfToken)
  }

  /**
   * Gets the data of a game using the internal game ID
   * @param gameId Internal game ID
   * @returns
   */
  async getGameDataById (gameId: string): Promise<GameData | null> {
    return await this.baseClient.getGameData({ gameId })
  }

  /**
   * Gets the data of a game using the game URL
   * @param gameUrl Game URL
   * @returns The game data, or null if the game doesn't exist
   */
  async getGameDataByUrl (gameUrl: string): Promise<GameData | null> {
    return await this.baseClient.getGameData({ gameUrl })
  }

  /**
   * Gets the ID of a category in a game
   * @param gameUrl Game URL
   * @param categoryName Name of the category
   * @returns The category id, or null if the game or the category doesn't exist
   */
  async getCategoryId (gameUrl: string, categoryName: string): Promise<string | null> {
    const gameData = await this.getGameDataByUrl(gameUrl)
    if (gameData === null) {
      return null
    }

    for (const category of gameData.categories) {
      if (category.name === categoryName) {
        return category.id
      }
    }

    return null
  }

  /**
   * Edit a run's information.
   *
   * Requires CSRF authentication.
   * @param runId
   * @param params Object containing all the parameters that should be editted. Omitting parameters will leave them unchanged.
   * @returns
   */
  async editRun (
    runId: string,
    params: EditParams
  ): Promise<boolean> {
    const originalRun = await this.baseClient.getRunSettings(runId)
    if (originalRun === null) {
      return false
    }

    const finalSettings = Object.assign(originalRun, params)

    const response = await this.baseClient.putRunSettings(finalSettings)
    return response !== null
  }

  async getAllVariablesInCategory (gameUrl: string, categoryName: string): Promise<Variable[] | null> {
    const gameData = await this.getGameDataByUrl(gameUrl)
    if (gameData === null) {
      return null
    }

    const categoryId = await this.getCategoryId(gameUrl, categoryName)
    if (categoryId === null) {
      return null
    }

    const variables = gameData.variables.filter(variable => variable.categoryId === categoryId)

    return variables
  }

  async getAllSubcategoriesInCategory (gameUrl: string, categoryName: string): Promise<Value[] | null> {
    const variables = await this.getAllVariablesInCategory(gameUrl, categoryName)
    if (variables === null) {
      return null
    }

    // not sure why I need to recast here
    const subcategoryVariables = variables.filter(variable => variable.isSubcategory)

    // can't be null at this point since the check above worked
    const gameData = await this.getGameDataByUrl(gameUrl)
    const values = gameData?.values.filter(value => subcategoryVariables.some(variable => variable.id === value.variableId)) ?? null
    return values
  }

  async getSubcategoryVariableAndValue (gameUrl: string, categoryName: string, subcategoryName: string): Promise<{ variableId: string, valueId: string } | null> {
    const subcategories = await this.getAllSubcategoriesInCategory(gameUrl, categoryName)
    if (subcategories === null) {
      return null
    }

    const subcategory = subcategories.find(subcategory => subcategory.name === subcategoryName)

    if (subcategory === undefined) {
      return null
    }

    return {
      variableId: subcategory.variableId,
      valueId: subcategory.id
    }
  }

  async getSubcategoryIdFromNames (category: SpeedrunCategory): Promise<SpeedrunCategoryId | null> {
    const gameData = await this.getGameDataByUrl(category.gameUrl)
    if (gameData === null) {
      return null
    }
    const gameId: string = gameData.game.id
    const categoryId = await this.getCategoryId(category.gameUrl, category.categoryName)
    if (categoryId === null) {
      return null
    }
    const subcategoryValues: Array<{ variableId: string, valueId: string }> = []

    for (const subcategoryName of category.subcategoryNames) {
      const subcategoryInfo = await this.getSubcategoryVariableAndValue(category.gameUrl, category.categoryName, subcategoryName)
      if (subcategoryInfo === null) {
        return null
      }
      subcategoryValues.push(subcategoryInfo)
    }

    return { gameId, categoryId, subcategories: subcategoryValues }
  }

  /**
   * Get the game leaderboard object for a category
   * @param gameUrl URL of the game
   * @param categoryName
   * @param subcategoryNames
   * @param page
   * @returns
   */
  async getLeaderboardForSubcategory (category: SpeedrunCategory, leaderboardParams: LeaderboardFilterParams, page: number = 1): Promise<GameLeaderboard | null> {
    const subcategory = await this.getSubcategoryIdFromNames(category)
    if (subcategory === null) {
      return null
    }

    const leaderboard = await this.baseClient.getGameLeaderboard(subcategory.gameId, subcategory.categoryId, {
      values: subcategory.subcategories.map(subcategory => {
        return {
          variableId: subcategory.variableId,
          valueIds: [subcategory.valueId]
        }
      }),
      obsolete: leaderboardParams.obsolete,
      page
    })

    if (leaderboard === null) {
      return null
    }
    return leaderboard
  }

  /**
   * Gets a list of all the run IDs in a given category
   * @param category
   * @returns
   */
  async getAllRunsInCategory (category: SpeedrunCategory): Promise<string[] | null> {
    let runs: Run[] = []

    const filterParams = {
      obsolete: ObsoleteFilterStatus.Shown
    }
    const leaderboard = await this.getLeaderboardForSubcategory(category, filterParams)
    if (leaderboard === null) {
      return null
    }
    runs = runs.concat(leaderboard.runList)
    const totalPages = leaderboard.pagination.pages
    for (let i = 2; i < totalPages; i++) {
      const leaderboard = await this.getLeaderboardForSubcategory(category, filterParams, i)
      if (leaderboard !== null) {
        runs = runs.concat(leaderboard.runList)
      }
    }

    return runs.map(run => run.id)
  }

  /**
   * Edits all runs in a category.
   * @param category
   * @param editParams
   * @returns True if all runs were edited successfully, false otherwise
   */
  async editAllRunsInCategory (category: SpeedrunCategory, editParams: EditParams): Promise<boolean> {
    const runs = await this.getAllRunsInCategory(category)
    if (runs === null) {
      return false
    }

    for (const runId of runs) {
      await this.editRun(runId, editParams)
    }

    return true
  }

  /**
   * Moves a run to a new category using the internal variable IDs
   * @param runId
   * @param oldCategory
   * @param newCategory
   * @returns True if the run was moved successfully, false otherwise
   */
  private async moveRunToCategoryWithId (runId: string, oldCategory: SpeedrunCategoryId, newCategory: SpeedrunCategoryId): Promise<boolean> {
    const oldSettings = await this.baseClient.getRunSettings(runId)
    if (oldSettings === null) {
      return false
    }

    const subcategoryIds = {}
    for (const subcategory of oldCategory.subcategories) {
      subcategoryIds[subcategory.variableId] = subcategory.valueId
    }

    const newValues = oldSettings.values?.filter(value => {
      return value.valueId !== subcategoryIds[value.variableId]
    })?.concat(newCategory.subcategories.map(subcategory => ({
      variableId: subcategory.variableId,
      valueId: subcategory.valueId
    })))

    const moveResponse = await this.editRun(runId, {
      categoryId: newCategory.categoryId,
      values: newValues
    })

    if (!moveResponse) {
      return false
    }
    return true
  }

  /**
   * Move a run from a category to a new one.
   *
   * Requires CSRF authentication.
   * @param runId
   * @param oldCategory
   * @param newCategory
   * @returns True if the run was moved successfully, false otherwise
   */
  async moveRunToCategory (runId: string, oldCategory: SpeedrunCategory, newCategory: SpeedrunCategory): Promise<boolean> {
    const oldCategoryId = await this.getSubcategoryIdFromNames(oldCategory)
    if (oldCategoryId === null) {
      return false
    }
    const newCategoryId = await this.getSubcategoryIdFromNames(newCategory)
    if (newCategoryId === null) {
      return false
    }
    return await this.moveRunToCategoryWithId(runId, oldCategoryId, newCategoryId)
  }

  /**
   * Moves all runs from one category to another
   *
   * Requires CSRF authentication.
   * @param category
   * @param newCategory
   * @returns True if all runs were moved successfully, false otherwise
   */
  async moveAllRunsInCategory (category: SpeedrunCategory, newCategory: SpeedrunCategory): Promise<boolean> {
    const runs = await this.getAllRunsInCategory(category)
    if (runs === null) {
      return false
    }

    const oldCategoryId = await this.getSubcategoryIdFromNames(category)
    if (oldCategoryId === null) {
      return false
    }

    const newCategoryId = await this.getSubcategoryIdFromNames(newCategory)
    if (newCategoryId === null) {
      return false
    }

    for (const runId of runs) {
      await this.moveRunToCategoryWithId(runId, oldCategoryId, newCategoryId)
    }

    return true
  }
}
