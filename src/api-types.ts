enum ItemType {
  Like = 1,
  RUn = 2,
  ThreadComment = 7,
  GameNewsPost = 27,
  SiteNewsPost = 30
}

enum VerificationStatus {
  Pending = 0,
  Verified = 1,
  Rejected = 2
}

/**
 * For filtering runs by obsolete status
 */
export enum ObsoleteFilterStatus {
  /** Do not show obsolete */
  Hidden = 0,
  /** Show obsolete */
  Shown = 1,
  /** Show only obsolete */
  Exclusive = 2
}

enum VideoFilterStatus {
  Optional = 0,
  Required = 1,
  Missing = 2
}

interface Pronoun {
  idk: string
}

interface AvatarDecoration {
  idk: string
}

/**
 * Contains an image reference
 */
interface StaticAsset {
  assetType: string
  path: string
}

interface Challenge {
  id: string
  name: string
  gameId: string
  createDate: number
  updateDate: number
  startDate: number
  endDate: number
  state: number

}

interface Article {
  id: string
  slug: string
  title: string
  summary: string
  body: string
  userId: string
  gameId: string
  createDate: number
  updateDate: number
  publishDate: number
  publishTarget: string
  publishTags: string[]
  coverImagePath: string
  commentsCount: number
  community: boolean
}

interface Pagination {
  count: number
  page: number
  pages: number
  per: number
}

interface ArticleGame {
  id: string
  name: string
  url: string
  type: string
  loadtimes: boolean
  miliseconds: boolean
  igt: boolean
  verification: boolean
  autoVerify: boolean
  requireVideo: boolean
  emulator: number
  defaultTimer: number
  validTimers: number[]
  releaseDate: number
  addedDate: number
  touchDate: number
  coverPath: string
  trophy1stPath: string
  trophy2ndPath: string
  trophy3rdPath: string
  runCommentsMode: number
  runCount: number
  activePlayerCount: number
  totalPlayerCount: number
  boostReceivedCount: number
  boostDistinctDonorsCount: number
  rules: string
  viewPowerLevel: number
  playformIds: string[]
  regiondIds: string[]
  gameTypeIds: string[]
  websiteUrl: string
  discordUrl: string
  defaultView: number
  guidePermissionType: number
  resourcePermissionType: number
  staticAssets: StaticAsset[]
}

interface ArticleUser {
  id: string
  name: string
  url: string
  powerLevel: number
  pronouns: any[]
  areaId: string
  color1Id: string
  color2Id: string
  avatarDecoration: {
    enabled: boolean
  }
  iconType: number
  onlineDate: number
  signupDate: number
  touchDate: number
  staticAssets: StaticAsset[]
}

export interface ArticleList {
  articleList: Article[]
  pagination: Pagination
  gameList: ArticleGame[]
  userList: ArticleUser[]
}

interface Category {
  id: string
  name: string
  pos: number
  gameId: string
  isMisc: boolean
  isPerLevel: boolean
  numPlayer: number
  exactPlayer: boolean
  playerMatchMode: number
  timeDirection: number
  enforceMs: boolean
  archived: boolean
  rules: string
}

interface Level {

}

interface Platform {

}

interface Region {

}

interface Theme {

}

export interface Value {
  id: string
  name: string
  url: string
  pos: number
  variableId: string
  isMisc: boolean
  rules?: string
  archived: boolean
}

export interface Variable {
  id: string
  name: string
  url: string
  pos: number
  gameId: string
  categoryScope: number
  categoryId: string
  levelScope: number
  levelId?: string
  isMandatory: boolean
  isSubcategory: boolean
  isUserDefined: boolean
  isObsoleting: boolean
  defaultValue: string
  archived: boolean
  displayMode?: number
}

export interface GameData {
  game: {
    id: string
    name: string
    url: string
    type: string
    loadtimes: boolean
    miliseconds: boolean
    igt: boolean
    verification: boolean
    autoVerify: boolean
    requireVideo: boolean
    emulator: number
    defaultTimer: number
    validTimers: number[]
    releaseDate: number
  }
  categories: Category[]
  levels: Level[]
  moderators: Array<{
    gameId: string
    userId: string
    level: any
  }>
  platforms: Platform[]
  regions: Region[]
  runCounts: Array<{
    gameId: string
    categoryId: string
    variableId: string
    valueId: string
    count: number
  }>
  theme: Theme
  users: ArticleUser[]
  values: Value[]
  variables: Variable[]
}

export interface Run {
  id: string
  gameId: string
  levelId?: string
  categoryId?: string
  challengeId?: string
  time?: number
  timeWithLoads?: number
  // (another for IGT?)? : number
  enforceMs?: boolean
  platformId: string
  emulator: boolean
  regionId: string
  video: string
  comment: string
  submittedById: string
  verified: number
  verifiedById?: string
  reason?: string
  date: number
  dateSubmitted: number
  dateVerified: number
  hasSplits: boolean
  obsolete: boolean
  place: number
  // issues: ?
  playerIds: string[]
  valueIds: string[]
}

/**
 * Stores all runs of a given category
 */
export interface GameLeaderboard {
  runList: Run[]
  playerList: Array<{
    id: string
    name: string
    url: string
    powerLevel: number
    color1Id: string
    color2Id: string
    colorAnimate: number
    areaId: string
    isSupporter: boolean | null
  }>
  pagination: Pagination
}

export enum VideoStatus {
  Any = 0,
  Present = 1,
  Missing = 2
}

interface Time {
  hour: number
  minute: number
  second: number
  milisecond: number
}

export interface RunSettings {
  runId: string
  gameId: string
  categoryId: string
  playerNames: string[]
  time?: Time
  timeWithLoads?: Time
  igt?: Time
  platformId: string
  emulator: boolean
  video: string
  comment: string
  date: number
  values: Array<{
    variableId: string
    valueId: string
  }> | null
}

export interface SettingsResponse {
  settings: RunSettings
  users: User[]
}

interface User {
  id: string
  name: string
  url: string
  powerLevel: number
  pronouns: string[]
  areaId: string
  color1Id: string
  color2Id: string
  isSupporter?: boolean
  colorAnimate?: number
  // iconType?:
  onlineDate?: number
  signupDate?: number
  touchDate?: number
  staticAssets?: StaticAsset[]
}
