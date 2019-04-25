import sodium from 'libsodium-wrappers'
import { ILobbyOptions } from 'platform/types'
import { NetServer, NetUniqueId } from 'network'
import { isP2PHash, isIP, isUrlDomain } from 'utils/network'
import { PeerCoordinator } from 'network/server'
import { initIdentity } from './identity'

type HexId = string

export class WebPlatform {
  ready: Promise<void>

  private id!: NetUniqueId<HexId>
  private server: NetServer | null = null

  constructor() {
    this.ready = initIdentity().then(keyPair => {
      this.id = new NetUniqueId<HexId>(sodium.to_hex(keyPair.publicKey))
    })
  }

  getServer() {
    return this.server
  }

  async createLobby(opts: ILobbyOptions): Promise<boolean> {
    const isHost = true
    const coordinators: PeerCoordinator[] = []

    // if (opts.p2p) {
    //   coordinators.push(new SwarmRTCPeerCoordinator(isHost))
    // }

    this.server = new NetServer({ isHost, coordinators })

    return true
  }

  private async joinP2PLobby(hash: string): Promise<boolean> {
    ga('event', { ec: 'session', ea: 'connect', el: 'p2p' })

    this.server = new NetServer({
      isHost: false,
      coordinators: []
    })

    return true
  }

  async joinLobby(lobbyId: string): Promise<boolean> {
    let success

    if (isP2PHash(lobbyId)) {
      success = await this.joinP2PLobby(lobbyId)
      // } else if (isIP(lobbyId) || isUrlDomain(lobbyId)) {
      //   success = await this.joinWebSocketLobby(lobbyId)
    } else {
      success = false
    }

    return success
  }

  leaveLobby(id: string): boolean {
    if (this.server) {
      this.server.close()
      this.server = null
    }

    return true
  }

  getLocalId(): NetUniqueId {
    return this.id
  }
}