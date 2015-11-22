import React, {Component} from 'react';
import Immutable from 'immutable';

import JediItem from '../views/JediItem.react.js';

export default class JediList extends Component {

  render() {
    const jedis = this.props.jedis;
    let jediItems = [];
    for (let jedi of jedis) {
      if (jedi.fake) {
        jediItems.push(<JediItem key={jedi.id} name={''} homeworld={''} isHome={false}/>);
      }
      else {
        jediItems.push(<JediItem key={jedi.name} name={jedi.name} homeworld={jedi.homeworld.name} isHome={jedi.onCurrentWorld}/>);
      }
    }
    if (jedis.count() < 5) {
      Immutable.Range(jedis.count(), 5).forEach(count => {
        jediItems.push(<JediItem key={count} name={''} homeworld={''} isHome={false}/>);
      });
    }
    return (
      <ul className="css-slots">
        {jediItems}
      </ul>
    );
  }
};
