import { useEffect, useState } from 'react';
import { alchemy } from './AlchemyClient';
import { Block } from './components/block/Block';
import { BlockNavigator } from './components/block-navigator/BlockNavigator';
import { Transaction } from './components/transaction/Transaction';

import './App.css';

function App() {
  const [latestBlock, setLatestBlock] = useState(null);
  const [currentBlock, setCurrentBlock] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    async function init() {
      const num = await alchemy.core.getBlockNumber();
      setLatestBlock(num);
      setCurrentBlock(num);
    }

    init();
  }, []);

  if (currentBlock == null) return null;

  return (
    <div className="App">
      {selectedTx ? (
        <Transaction hash={selectedTx} onBack={() => setSelectedTx(null)} />
      ) : (
        <>
          <Block number={currentBlock} onSelectTx={setSelectedTx} />
          <BlockNavigator
            number={currentBlock}
            latest={latestBlock}
            onPrev={() => setCurrentBlock((n) => n - 1)}
            onNext={() => setCurrentBlock((n) => n + 1)}
          />
        </>
      )}
    </div>
  );
}

export default App;
