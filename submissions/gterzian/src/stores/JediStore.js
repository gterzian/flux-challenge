import Immutable from 'immutable';
import {ReduceStore} from 'flux/utils';

import Dispatcher from '../dispatcher/Dispatcher';
import WorldStore from './WorldStore'
import emptyJedi from '../constants/JediConstants'
import webApi from '../utils/web-api';


class JediStore extends ReduceStore {

  getInitialState() {
    return Immutable.List([new emptyJedi({id:Math.random()}), new emptyJedi({id:Math.random()}),
       new emptyJedi({id:Math.random()}), new emptyJedi({id:Math.random()}), new emptyJedi({id:Math.random()})]);
  }

  reduce(state, action) {
    switch (action.type) {

      case 'CLEAR':
        return state.clear();

      case 'SEEK_MASTERS':
        if(this.realJedis().count() === 1 && !state.last().fake) {
          //when the last one is the onely real one left, do nothing
          return state;
        }
        if(this.realJedis().count() === 2 && !state.last().fake) {
          //when the last one is the onely real one left, do nothing
          return state;
        }
        else {
          const updated = this.getState().pop().pop()
          const missing = Immutable.Range(0, 5 - updated.count());
          let newState = [];
          updated.forEach(jedi => {
            newState.push(jedi);
          })
          missing.forEach(miss => {
            newState.unshift(new emptyJedi({id:Math.random()}));
          });
          console.log(newState)
          return Immutable.List(newState);
        }

      case 'SEEK_APPRENTICES':
        if(this.realJedis().count() === 1 && !state.first().fake) {
          //when the last one is the onely real one left, do nothing
          return state;
        }
        if(this.realJedis().count() === 2 && !state.first().fake) {
          //when the last one is the onely real one left, do nothing
          return state;
        }
        else {
          const updated = this.getState().shift().shift()
          const missing = Immutable.Range(0, 5 - updated.count());
          let newState = [];
          updated.forEach(jedi => {
            newState.push(jedi);
          })
          missing.forEach(miss => {
            newState.push(new emptyJedi({id:Math.random()}));
          });
          console.log(newState)
          return Immutable.List(newState);
        }

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
          webApi.getJedi(jedi.apprentice.url, 'Apprentice');
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
          if (master.id === jedi.id) {
            const realOnes = this.realJedis();
            const updated = realOnes.unshift(jedi);
            const missing = Immutable.Range(0, 5 - updated.count());
            let newState = [];
            missing.forEach(miss => {
              newState.unshift(new emptyJedi({id:Math.random()}));
            });
            updated.forEach(jedi => {
              newState.push(jedi);
            })
            if (jedi.master && realOnes.count() < 5) {
              webApi.getJedi(jedi.master.url, 'Master');
            }
            return Immutable.List(newState);
          }
          if (apprentice.id === jedi.id) {
            const realOnes = this.realJedis();
            const updated = realOnes.push(jedi);
            const missing = Immutable.Range(0, 5 - updated.count());
            let newState = [];
            updated.forEach(jedi => {
              newState.push(jedi);
            })
            missing.forEach(miss => {
              newState.push(new emptyJedi({id:Math.random()}));
            });
            if (jedi.apprentice.url && realOnes.count() < 5) {
              console.log(jedi.apprentice)
              webApi.getJedi(jedi.apprentice.url, 'Apprentice');
            }
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
