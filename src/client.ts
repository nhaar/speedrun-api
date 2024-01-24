import axios, { AxiosResponse } from 'axios'
import { API_V2_URL } from './constants'
import { ArticleList, GameData, GameLeaderboard, Run, RunSettings, SettingsResponse, Value, Variable, VideoStatus } from './api-types'
import { SpeedrunCategoryId, SpeedrunCategory } from './category'

export default class SpeedrunClient {
  /**
   * The session ID that the website uses to identify the client.
   * 
   * Currently, the only way to get it is to log in to the website and get it from the cookies in the headers of a request.
   */
  sessionId: string

  /**
   * Session ID required for making requests that require authentication. You can leave it empty if you don't need to make 
   * such requests.
   * 
   * The cookie has the format `PHPSESSID={id}`. You can pass the parameter as either the whole cookie or just the id.
   * @param sessionId 
   */
  constructor (sessionId: string = '') {
    this.sessionId = sessionId

    if (sessionId.startsWith('PHPSESSID=')) {
      this.sessionId = sessionId.split('=')[1]
    }
  }

  /**
   * Sends a GET request to the specified route of the version 2 of the API
   * @param route Route, relative to the API base URL
   * @returns 
   */
  private async getRequest (route: string, params: URLSearchParams | undefined = undefined): Promise<AxiosResponse> {
    let url:string = API_V2_URL + route
    if (params !== undefined) {
      url += '?' + params.toString()
    }
    return await axios.get(url)
  }

  /**
   * Sends a POST request to the specified route of the version 2 of the API
   * @param route Route, relative to the API base URL
   * @param body JSON body of the request
   * @returns 
   */
  private async postRequest (route: string, body: object = {}): Promise<AxiosResponse> {
    return await axios.post(API_V2_URL + route, body, {
      headers: {
        'Content-Type': 'application/json',
        Cookie: `PHPSESSID=${this.sessionId}`
      }
    })
  }

  async getArticleList (): Promise<ArticleList | null> {
    const response = await this.getRequest('GetArticleList')
    if (response.status === 200) {
      return response.data as ArticleList
    } else {
      return null
    }
  }

  private async getGameData (params:{gameUrl: string} | {gameId: string}): Promise<GameData | null> {
    const response = await this.getRequest('GetGameData', new URLSearchParams(params))
    if (response.status === 200) {
      return response.data as GameData
    } else {
      return null
    }
  }

  /**
   * Gets the data of a game using the internal game ID
   * @param gameId Internal game ID
   * @returns 
   */
  async getGameDataById (gameId: string): Promise<GameData | null> {
    return await this.getGameData({ gameId })
  }

  /**
   * Gets the data of a game using the game URL
   * @param gameUrl Game URL
   * @returns The game data, or null if the game doesn't exist
   */
  async getGameDataByUrl (gameUrl: string): Promise<GameData | null> {
    return await this.getGameData({ gameUrl })
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
   * Gets all the data stored in a leaderboard, that is all the runs for a given game and category
   * @param gameId Internal game ID
   * @param categoryId Internal category ID
   * @param values ??
   * @param video ??
   * @param verified ?? 
   * @param timer ??
   * @param obsolete ?? 
   * @param platformIds ?? 
   * @param regionIds ??
   * @param dateFrom ??
   * @param dateTo ??
   * @param page ??
   * @returns 
   */
  async getGameLeaderboard (
    gameId: string,
    categoryId: string,
    optional: {
      values?: { variableId: string, valueIds: string[] }[],
      video?: VideoStatus,
      verified?: boolean,
      timer?: number,
      obsolete?: boolean,
      platformIds?: string[],
      regionIds?: string[],
      dateFrom?: string,
      dateTo?: string,
      page?: number
    }
  ): Promise<GameLeaderboard | null> {
    const response = await this.postRequest('GetGameLeaderboard2', {
      params: {
        gameId: gameId,
        categoryId: categoryId,
        values: optional.values,
        video: optional.video,
        verified: optional.verified,
        timer: optional.timer,
        obsolete: optional.obsolete,
        platformIds: optional.platformIds,
        regionIds: optional.regionIds,
        dateFrom: optional.dateFrom,
        dateTo: optional.dateTo,
      },
      page: optional.page
    })
    if (response.status === 200) {
      return response.data as GameLeaderboard
    } else {
      return null
    }
  }

  async getRun (runId: string): Promise<Run | null> {
    const response = await this.getRequest('GetRun', new URLSearchParams({
      runId: runId
    }))
    if (response.status === 200) {
      return response.data as Run
    } else {
      return null
    }
  }

  async getRunSettings (runId: string): Promise<RunSettings | null> {
    const response = await this.postRequest('GetRunSettings', {
      runId
    })
    if (response.status === 200) {
      return (response.data as SettingsResponse).settings
    } else {
      return null
    }
  }

  private async putRunSettings (settings: RunSettings, autoverify: boolean = false):Promise<boolean> {
    const response = await this.postRequest('PutRunSettings', {
      settings,
      autoverify
    })
    return response.status === 200
  }

  async editRun (
    runId: string,
    gameId: string | undefined = undefined,
    categoryId: string | undefined = undefined,
    playerNames: string[] | undefined = undefined,
    time: { hour:number, minute: number, second:number, milisecond: number} | undefined = undefined,
    platformId: string | undefined = undefined,
    emulator: string | undefined = undefined,
    video: string | undefined = undefined,
    comment: string | undefined = undefined,
    date: string | undefined = undefined,
    values: Value[] | undefined = undefined,
  ): Promise<boolean> {
    
    const originalRun = await this.getRunSettings(runId)
    if (originalRun === null) {
      return false
    }
    const newSettings = {
      gameId,
      categoryId,
      playerNames,
      time,
      platformId,
      emulator,
      video,
      comment,
      date,
      values,
    }

    const finalSettings = Object.assign(originalRun, newSettings)

    const response = await this.putRunSettings(finalSettings, true)
    return response
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
    const subcategoryVariables = variables.filter(variable => variable.isSubcategory) as Variable[]

    // can't be null at this point since the check above worked
    const gameData = await this.getGameDataByUrl(gameUrl) as GameData
    const values = gameData.values.filter(value => subcategoryVariables.some(variable => variable.id === value.variableId))
    return values
  }

  async getSubcategoryVariableAndValue (gameUrl: string, categoryName: string, subcategoryName: string): Promise<{variableId: string, valueId: string} | null> {
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

  async getSubcategoryIdFromNames (category:SpeedrunCategory): Promise<SpeedrunCategoryId | null> {
    const gameData = await this.getGameDataByUrl(category.gameUrl)
    if (gameData === null) {
      return null
    }
    const gameId:string = gameData.game.id
    const categoryId = await this.getCategoryId(category.gameUrl, category.categoryName)
    if (categoryId === null) {
      return null
    }
    const subcategoryValues: { variableId: string, valueId: string }[] = []
  
    for (const subcategoryName of category.subcategoryNames) {
      const subcategoryInfo = await this.getSubcategoryVariableAndValue(category.gameUrl, category.categoryName, subcategoryName)
      if (subcategoryInfo === null) {
        return null
      }
      subcategoryValues.push(subcategoryInfo)
    }

    return { gameId, categoryId, subcategories: subcategoryValues}
  }

  /**
   * Get the game leaderboard object for a category
   * @param gameUrl URL of the game
   * @param categoryName 
   * @param subcategoryNames 
   * @param page 
   * @returns 
   */
  async getLeaderboardForSubcategory (category:SpeedrunCategory, page: number = 1): Promise<GameLeaderboard | null> {
    const subcategory = await this.getSubcategoryIdFromNames(category)
    if (subcategory === null) {
      return null
    }

    const leaderboard = await this.getGameLeaderboard(subcategory.gameId, subcategory.categoryId, {
      values: subcategory.subcategories.map(subcategory => {
        return {
          variableId: subcategory.variableId,
          valueIds: [subcategory.valueId]
        }
      }),
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
    let runs:Run[] = []
    
    const leaderboard = await this.getLeaderboardForSubcategory(category)
    if (leaderboard === null) {
      return null
    }
    runs = runs.concat(leaderboard.runList)
    const totalPages = leaderboard.pagination.pages
    for (let i = 2; i < totalPages; i++) {
      const leaderboard = await this.getLeaderboardForSubcategory(category, i)
      runs = runs.concat(leaderboard.runList)
    }

    return runs.map(run => run.id)
  }
}