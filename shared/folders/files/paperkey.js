// @flow
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'
import {navigateUp} from '../../actions/router'
import {checkPaperKey} from '../../actions/unlock-folders'
import HiddenString from '../../util/hidden-string'
import Render from '../../login/register/paper-key/index.render'

type Props = $Shape<{
  waiting: boolean,
  onBack: () => void,
  checkPaperKey: (paperKey: HiddenString) => void,
}>

type State = {
  paperKey: string,
  submitted: boolean,
}

class PaperKey extends Component<void, Props, State> {
  state: State;

  constructor (props) {
    super(props)

    this.state = {
      paperKey: '',
      submitted: false,
    }
  }

  componentWillReceiveProps (nextProps) {
    if (!nextProps.waiting && this.state.submitted) {
      this.props.onBack()
    }
  }

  render () {
    return <Render
      onSubmit={() => {
        this.props.checkPaperKey(new HiddenString(this.state.paperKey))
        this.setState({submitted: true, paperKey: ''})
      }}
      onChangePaperKey={paperKey => this.setState({paperKey})}
      onBack={this.props.onBack}
      paperKey={this.state.paperKey}
      waitingForResponse={this.props.waiting}
    />
  }

  static parseRoute (currentPath, uri) {
    return {
      componentAtTop: {
        title: 'Paperkey',
      },
    }
  }
}

export default connect(
  (state, ownProps) => {
    return {
      waiting: state.unlockFolders.waiting,
    }
  },
  dispatch => bindActionCreators({onBack: navigateUp, checkPaperKey}, dispatch),
)(PaperKey)
