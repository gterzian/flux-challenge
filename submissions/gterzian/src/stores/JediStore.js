import Immutable from 'immutable';
import {ReduceStore} from 'flux/utils';

import Dispatcher from '../dispatcher/Dispatcher';
import WorldStore from './WorldStore'
import emptyJedi from '../constants/JediConstants'
import webApi from '../utils/web-api';


class JediStore extends ReduceStore {
  getInitialState() {
    return Immutable.List([new emptyJedi({id:1}), new emptyJedi({id:2}),
       new emptyJedi({id:3}), new emptyJedi({id:4}), new emptyJedi({id:5})]);
  }

  reduce(state, action) {
    switch (action.type) {

      case 'CLEAR':
        return state.clear();

      case 'SEEK_MASTERS':
        if(this.realJedis().count() === 1) {
          //when the last one is the onely real one left, do nothing
          if (!state.last().fake){
            return state;
          }
        }
        return state.withMutations((list) => {
          return list.pop().pop().unshift(new emptyJedi({id:1})).unshift(new emptyJedi({id:2}));
        });

      case 'SEEK_APPRENTICES':
        if(this.realJedis().count() === 1) {
          //when the first one is the onely real one left, do nothing
          if (!state.first().fake){
            return state;
          }
        }
        return state.withMutations((list) => {

          return list.shift().shift().push(new emptyJedi({id:4})).push(new emptyJedi({id:5}));
        });

      case 'NEW_JEDI':
        if (this.hasJediAtHome()) {
          return state;
        }
        const currentWorld = WorldStore.getState().get('id');
        const jedi = this.checkJediHome(currentWorld)(action.jedi);
        const realJedis = this.realJedis();
        if(realJedis.count() === 5) {
          return state;
        }
        if(realJedis.count() === 0) {
          return state.pop().unshift(jedi);
        }
        const containsJedi = state.find((existing) => {
          return existing.id === jedi.id;
        });
        if (!containsJedi) {
          const first = realJedis.first();
          const last = realJedis.last();
          const master = first.master;
          const apprentice = last.apprentice;
          if(master.id === jedi.id){
            const realOnes = this.realJedis();
            const updated = realOnes.unshift(jedi);
            const missing = Immutable.Range(0, 5 - updated.count());
            let newState = [];
            missing.forEach(miss => {
              newState.unshift(new emptyJedi({id:miss}));
            });
            updated.forEach(jedi => {
              newState.push(jedi);
            })
            return Immutable.List(newState);
          }
          if(apprentice.id === jedi.id){
            const realOnes = this.realJedis();
            const updated = realOnes.push(jedi);
            console.log(updated)
            const missing = Immutable.Range(0, 5 - updated.count());
            let newState = [];
            updated.forEach(jedi => {
              newState.push(jedi);
            })
            missing.forEach(miss => {
              newState.push(new emptyJedi({id:miss}));
            });
            return Immutable.List(newState);
          }
        }
        else {
          //don't update if the Jedi is already in there
          return state;
        }

      case 'NEW_WORLD':
        const newState = this.getState().map(this.checkJediHome(action.id));
        if (this.hasJediAtHome()) {
          webApi.cancelRequests();
        }
        return newState;

      default:
        return state;
    }
  }

  realJedis() {
    return this.getState().filter(jedi => !jedi.fake);
  }

  checkJediHome(homeId) {
    return (jedi) => {
      if (jedi.fake){
        return jedi;
      }
      if (jedi.homeworld.id === homeId) {
        jedi.onCurrentWorld = true;
      }
      else {
        jedi.onCurrentWorld = false;
      }
      return jedi;
    };
  }

  hasJediAtHome() {
    return this.realJedis().some(jedi => jedi.onCurrentWorld);
  }

  firstHasMaster() {
    if (this.realJedis().isEmpty()) {
      return false;
    }
    let master = this.realJedis().first().master;
    if (master) {
      if (master.id) {
        return true;
      }
    }
    return false;
  }

  lastHasApprentice() {
    if (this.realJedis().isEmpty()) {
      return false;
    }
    let apprentice = this.realJedis().last().apprentice;
    if (apprentice) {
      if (apprentice.id) {
        return true;
      }
    }
    return false;
  }

}

module.exports = new JediStore(Dispatcher);
