// @flow
import React, {Component} from 'react'
import {connect} from 'react-redux'
import Render from './render'
import {favoriteList} from '../actions/favorite'
import {openInKBFS} from '../actions/kbfs'
import {bindActionCreators} from 'redux'
import {routeAppend} from '../actions/router'
import Files from './files'
import flags from '../util/feature-flags'
import type {Props as RenderProps} from './render'

export type Props = {
  favoriteList: () => void,
  folderProps: ?RenderProps,
  openInKBFS: (path: string) => void,
  username: string,
  routeAppend: (path: any) => void,
}

type State = {
  showingPrivate: boolean
}

class Folders extends Component<void, Props, State> {
  state: State;

  constructor (props: Props) {
    super(props)
    this.state = {
      showingPrivate: true,
    }
  }

  componentDidMount () {
    this.props.favoriteList()
  }

  render () {
    return (
      <Render
        {...this.props.folderProps}
        onClick={path => this.props.routeAppend(path)}
        onRekey={path => this.props.routeAppend(path)}
        onOpen={path => this.props.openInKBFS(path)}
        onSwitchTab={showingPrivate => this.setState({showingPrivate})}
        showingPrivate={this.state.showingPrivate}
        showComingSoon={!flags.tabFoldersEnabled}
        username={this.props.username}
      />
    )
  }

  static parseRoute () {
    return {
      componentAtTop: {title: 'Folders'},
      parseNextRoute: Files.parseRoute,
    }
  }
}

// Set rekey meta if this tlf is part of the rekey set
const injectMeta = (tlf, lockedTLFs) => ({
  ...tlf,
  meta: lockedTLFs.find(lockedTLF => lockedTLF.name === tlf.path) ? 'rekey' : tlf.meta,
})

const injectTlfsIgnored = (folders, lockedTLFs) => ({
  ...folders,
  tlfs: (folders.tlfs || []).map(tlf => injectMeta(tlf, lockedTLFs)),
  ignored: (folders.ignored || []).map(tlf => injectMeta(tlf, lockedTLFs)),
})

const injectRekey = (folderProps, lockedTLFs) => {
  return {
    ...folderProps,
    private: injectTlfsIgnored(folderProps.private, lockedTLFs),
    public: injectTlfsIgnored(folderProps.public, lockedTLFs),
  }
}

export default connect(
  state => ({
    username: state.config.username,
    folderProps: injectRekey(state.favorite, state.unlockFolders.tlfs),
  }),
  dispatch => bindActionCreators({favoriteList, routeAppend, openInKBFS}, dispatch)
)(Folders)
