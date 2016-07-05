/* @flow */

import engine from '../engine'
import HiddenString from '../util/hidden-string'
import * as Constants from '../constants/unlock-folders'

import type {TypedAsyncAction, AsyncAction} from '../constants/types/flux'
import type {ToPaperKeyInput, OnBackFromPaperKey, CheckPaperKey, Finish, Waiting,
  RegisterRekeyListenerAction, NewRekeyPopupAction} from '../constants/unlock-folders'
import type {delegateUiCtlRegisterRekeyUIRpc, loginPaperKeySubmitRpc} from '../constants/types/flow-types'
import {createServer} from '../engine/server'
import type {Dispatch} from '../constants/types/flux'

type UglyKeys = 'refresh'

export function toPaperKeyInput (): ToPaperKeyInput {
  return {type: Constants.toPaperKeyInput, payload: {}}
}

export function onBackFromPaperKey (): OnBackFromPaperKey {
  return {type: Constants.onBackFromPaperKey, payload: {}}
}

function waiting (currentlyWaiting: boolean): Waiting {
  return {type: Constants.waiting, payload: currentlyWaiting}
}

export function checkPaperKey (paperKey: HiddenString): TypedAsyncAction<CheckPaperKey | Waiting> {
  return dispatch => {
    const params: loginPaperKeySubmitRpc = {
      method: 'login.paperKeySubmit',
      param: {
        paperPhrase: paperKey.stringValue(),
      },
      waitingHandler: isWaiting => { dispatch(waiting(isWaiting)) },
      callback: error => {
        if (error) {
          dispatch({type: Constants.checkPaperKey, error: true, payload: {error: error.message}})
        } else {
          dispatch({type: Constants.checkPaperKey, payload: {success: true}})
        }
      },
    }

    engine.rpc(params)
  }
}

export function finish (): Finish {
  return {type: Constants.finish, payload: {}}
}

export function close (): AsyncAction {
  return (dispatch, getState) => {
    dispatch({type: Constants.close, payload: {}})
    uglyResponse('refresh', null)
  }
}

export function registerRekeyListener (): (dispatch: Dispatch, getState: () => Object) => void {
  return (dispatch, getState) => {
    engine.listenOnConnect('registerRekeyUI', () => {
      const params: delegateUiCtlRegisterRekeyUIRpc = {
        method: 'delegateUiCtl.registerRekeyUI',
        callback: (error, response) => {
          if (error != null) {
            console.warn('error in registering rekey ui: ', error)
          } else {
            console.log('Registered rekey ui')
          }
        },
      }

      engine.rpc(params)
    })

    if (__DEV__ && false) {
      // just for testing using the 'rekey trigger' command. conflicts with the createServer call
      engine.listenGeneralIncomingRpc({'keybase.1.rekeyUI.refresh': ({problemSetDevices}) => {
        let problemSet = {...problemSetDevices.problemSet}
        // TEMP this is empty currently
        if (problemSet && problemSet.tlfs && problemSet.tlfs.length > 0) {
          const tlf = problemSet.tlfs[0]
          if (tlf) {
            tlf.solution_kids = (problemSetDevices.devices || []).map(d => d.deviceID)
          }
        }
        dispatch({
          type: Constants.newRekeyPopup,
          payload: {
            devices: problemSetDevices.devices || [],
            username: getState().config.username || '',
            sessionID: 0,
            problemSet,
          }})
      }})
    } else {
      createServer(
        engine,
        'keybase.1.rekeyUI.delegateRekeyUI',
        null,
        () => ({
          'keybase.1.rekeyUI.delegateRekeyUI': (params, response) => { },
          'keybase.1.rekeyUI.refresh': ({sessionID, problemSetDevices}, response) => {
            console.log('Asked for rekey')
            dispatch(({type: Constants.newRekeyPopup,
              payload: {devices: problemSetDevices.devices || [],
              username: getState().config.username || '',
                sessionID, problemSet: problemSetDevices.problemSet}}: NewRekeyPopupAction))
            uglySessionIDResponseMapper['refresh'] = response
            response.result()
          },
        })
      )
    }

    dispatch(({type: Constants.registerRekeyListener, payload: {started: true}}: RegisterRekeyListenerAction))
  }
}

function uglyResponse (key: UglyKeys, result: any, err: ?any): void {
  const response = uglySessionIDResponseMapper[key]
  if (response == null) {
    console.log('lost response reference')
    return
  }

  if (err != null) {
    response.error(err)
  } else {
    response.result(result)
  }

  delete uglySessionIDResponseMapper[key]
}

const uglySessionIDResponseMapper: {[key: UglyKeys]: any} = {}
