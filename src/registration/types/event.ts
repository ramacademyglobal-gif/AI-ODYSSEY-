export type TeamSize = 3 | 4

export type EventConfig = {
  readonly id: string
  readonly name: string
  readonly tagline: string
  readonly registration: {
    readonly mode: 'individual'
    readonly soloParticipationAllowed: false
    readonly requiresTeam: true
    readonly allowedTeamSizes: readonly TeamSize[]
    readonly teamSizeLockedAfterCreation: true
    readonly creatorSelectsTeamSize: true
  }
  readonly teamCode: {
    readonly prefix: string
    readonly segmentLength: number
    readonly formatLabel: string
    readonly pattern: RegExp
  }
  readonly rules: readonly string[]
  readonly payment: {
    readonly qrImageSrc: string
    readonly heading: string
    readonly amountPerPerson: number
    readonly notices: readonly string[]
  }
  readonly whatsapp: {
    readonly groupUrl: string
    readonly label: string
  }
}
