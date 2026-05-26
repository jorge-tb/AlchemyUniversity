import { useEffect, useState } from 'react';
import { alchemy } from './AlchemyClient';
import { Block } from './components/block/Block';
import { Transaction } from './components/transaction/Transaction';

import './App.css';

function App() {
  const [blockNumber, setBlockNumber] = useState();
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    async function getBlockNumber() {
      setBlockNumber(await alchemy.core.getBlockNumber());
    }

    getBlockNumber();
  }, []);

  return (
    <div className="App">
      {selectedTx ? (
        <Transaction hash={selectedTx} onBack={() => setSelectedTx(null)} />
      ) : (
        blockNumber && <Block number={blockNumber} onSelectTx={setSelectedTx} />
      )}
    </div>
  );
}

export default App;
