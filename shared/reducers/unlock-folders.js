/* @flow */

import * as Constants from '../constants/unlock-folders'
import * as CommonConstants from '../constants/common'
import type {UnlockFolderActions, Device} from '../constants/unlock-folders'
import {toDeviceType} from '../constants/types/more'
import type {$Exact} from '../constants/types/more'
import {canonicalizePath} from '../util/kbfs'

export type State = {
  started: boolean,
  closed: boolean,
  phase: 'dead' | 'promptOtherDevice' | 'paperKeyInput' | 'success',
  devices: Array<Device>,
  tlfs: Array<$Exact<{
    name: string,
    waitingForParticipantUnlock: Array<Device>,
    youCanUnlock: Array<Device>,
  }>>,
  waiting: boolean,
  paperkeyError: ?string,
  sessionID: ?number
}

const initialState: State = {
  started: false,
  closed: true,
  phase: 'dead',
  waiting: false,
  devices: [],
  tlfs: [],
  paperkeyError: null,
  sessionID: null,
}

export default function (state: State = initialState, action: UnlockFolderActions): State {
  switch (action.type) {
    case CommonConstants.resetStore:
      return {
        ...initialState,
        started: state.started,
      }

    case Constants.close:
      return {
        ...state,
        closed: true,
      }
    case Constants.waiting:
      if (action.error) {
        return state
      }

      return {
        ...state,
        waiting: action.payload,
      }

    case Constants.onBackFromPaperKey:
      return {
        ...state,
        phase: 'promptOtherDevice',
      }

    case Constants.toPaperKeyInput:
      return {
        ...state,
        phase: 'paperKeyInput',
      }
    case Constants.checkPaperKey:
      if (action.error) {
        return {
          ...state,
          paperkeyError: action.payload.error,
        }
      } else {
        return {
          ...state,
          phase: 'success',
        }
      }
    case Constants.finish:
      return {
        ...state,
        phase: 'dead',
        closed: true,
      }

    case Constants.registerRekeyListener:
      if (action.payload && action.payload.started) {
        return {
          ...state,
          started: true,
        }
      } else {
        return state
      }
    case Constants.newRekeyPopup:
      if (state.started && action.payload) {
        const devices = action.payload.devices.map(({name, type, deviceID}) => ({
          type: toDeviceType(type),
          name, deviceID,
        }))

        const username = (action.payload && action.payload.username) || ''
        const tlfs = (action.payload.problemSet.tlfs || [])
          .map(problemTLF => {
            const solutions = (problemTLF.solution_kids || []).map(kid => devices.find(d => d.deviceID === kid))
            // All solutions are currently your own solutions...
            const waitingForParticipantUnlock = []
            const youCanUnlock = solutions

            return {
              name: canonicalizePath(username, problemTLF.tlf.name),
              waitingForParticipantUnlock,
              youCanUnlock,
            }
          })

        return {
          ...state,
          devices,
          tlfs,
          closed: !devices.length,
          sessionID: action.payload.sessionID,
        }
      }
      return state

    default:
      return state
  }
}

