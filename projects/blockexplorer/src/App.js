import { useEffect, useState } from 'react';
import { alchemy } from './AlchemyClient';
import { Block } from './components/block/Block';

import './App.css';

function App() {
  const [blockNumber, setBlockNumber] = useState();

  useEffect(() => {
    async function getBlockNumber() {
      setBlockNumber(await alchemy.core.getBlockNumber());
    }

    getBlockNumber();
  }, []);

  return (
    <div className="App">
      Block Number: {blockNumber}
      { blockNumber && <Block number={blockNumber}></Block> }
    </div>
  )
}

export default App;
