import axios, { AxiosResponse } from 'axios'

import { API_V2_URL } from './constants'
import { ArticleList, GameData, GameLeaderboard, ObsoleteFilterStatus, Run, RunSettings, VideoStatus } from './api-types'

enum RequestMethod {
  GET,
  POST
}

export interface RequestParams {
  [key: string]: string
}

export interface RequestBody {
  [key: string]: any
}

/**
 * Wrapper for all the endpoints of the API
 */
export default class SpeedrunBaseClient {
  /**
   * The session ID that the website uses to identify the client.
   *
   * Currently, the only way to get it is to log in to the website and get it from the cookies in the headers of a request.
   */
  sessionId: string

  /**
   * An authorization token for some requests.
   *
   * Currently can only be obtained by inspecting your browser.
   */
  csrfToken: string

  /**
   *
   * @param sessionId Session ID required for making requests that require authentication. You can leave it empty if you don't need to make such requests.

   The cookie has the format `PHPSESSID={id}`. You can pass the parameter as either the whole cookie or just the id.
   * @param csrfToken Token required for making some requests that require authentication. You can leave it empty if you don't need to make such requests.
   */
  constructor (sessionId: string = '', csrfToken: string = '') {
    this.sessionId = sessionId
    this.csrfToken = csrfToken

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
    let url: string = API_V2_URL + route
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
  private async postRequest (route: string, body: { [key: string]: any } = {}, useToken: boolean = false): Promise<AxiosResponse> {
    if (useToken) {
      body.csrfToken = this.csrfToken
    }
    return await axios.post(API_V2_URL + route, body, {
      headers: {
        'Content-Type': 'application/json',
        Cookie: `PHPSESSID=${this.sessionId}`
      }
    })
  }

  private async sendRequest<T> (method: RequestMethod, route: string, options: {
    params?: RequestParams
    body?: RequestBody
    auth?: boolean
  } = {}): Promise<T | null> {
    let response: AxiosResponse

    route = '/' + route

    switch (method) {
      case RequestMethod.GET:
        response = await this.getRequest(route, new URLSearchParams(options.params))
        break
      case RequestMethod.POST:
        response = await this.postRequest(route, options.body, options.auth)
        break
    }

    if (response.status === 200) {
      return response.data as T
    } else {
      return null
    }
  }

  async getArticleList (): Promise<ArticleList | null> {
    return await this.sendRequest<ArticleList>(RequestMethod.GET, 'GetArticleList')
  }

  async getGameData (params: { gameUrl: string } | { gameId: string }): Promise<GameData | null> {
    return await this.sendRequest<GameData>(RequestMethod.GET, 'GetGameData', { params })
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
      values?: Array<{ variableId: string, valueIds: string[] }>
      video?: VideoStatus
      verified?: boolean
      timer?: number
      obsolete?: ObsoleteFilterStatus
      platformIds?: string[]
      regionIds?: string[]
      dateFrom?: string
      dateTo?: string
      page?: number
    }
  ): Promise<GameLeaderboard | null> {
    return await this.sendRequest<GameLeaderboard>(RequestMethod.POST, 'GetGameLeaderboard2', {
      body: {
        params: {
          gameId,
          categoryId,
          values: optional.values,
          video: optional.video,
          verified: optional.verified,
          timer: optional.timer,
          obsolete: optional.obsolete,
          platformIds: optional.platformIds,
          regionIds: optional.regionIds,
          dateFrom: optional.dateFrom,
          dateTo: optional.dateTo
        },
        page: optional.page
      }
    })
  }

  async getRun (runId: string): Promise<Run | null> {
    return await this.sendRequest<Run>(RequestMethod.GET, 'GetRun', { params: { runId } })
  }

  async getRunSettings (runId: string): Promise<RunSettings | null> {
    return await this.sendRequest<RunSettings>(RequestMethod.POST, 'GetRunSettings', {
      body: {
        runId
      }
    })
  }

  async putRunSettings (settings: RunSettings, autoverify: boolean = false): Promise<{ runId: string } | null> {
    return await this.sendRequest<{ runId: string }>(RequestMethod.POST, 'PutRunSettings', {
      body: {
        settings,
        autoverify
      },
      auth: true
    })
  }
}
