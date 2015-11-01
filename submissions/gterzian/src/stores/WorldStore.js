import Immutable from 'immutable';
import {ReduceStore} from 'flux/utils';

import Dispatcher from '../dispatcher/Dispatcher';


class WorldStore extends ReduceStore {
  getInitialState() {
    return Immutable.Map({id: "", name: ""});
  }

  reduce(state, action) {
    switch (action.type) {
      case 'NEW_WORLD':
        return Immutable.Map({id: action.id, name: action.name});

      default:
        return state;
    }
  }
}

module.exports = new WorldStore(Dispatcher);
