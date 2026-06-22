import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import deploy from './deploy';
import Escrow from './Escrow';
import EscrowArtifact from './artifacts/contracts/Escrow.sol/Escrow';
import Address from './Address';

const provider = new ethers.providers.Web3Provider(window.ethereum);

export async function approve(escrowContract, signer) {
  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
}

const FILTERS = ['all', 'pending', 'approved'];

function App() {
  const [escrows, setEscrows] = useState([]);
  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();
  const [filter, setFilter] = useState('all');

  function markApproved(address) {
    setEscrows((prev) =>
      prev.map((e) => (e.address === address ? { ...e, approved: true } : e))
    );
  }

  useEffect(() => {
    // Pull the escrows this account has already deployed from the server and
    // rebuild them into the same shape the UI uses for freshly-deployed ones.
    async function loadDeployed(address, currentSigner) {
      try {
        const res = await fetch(`/contracts/${address}`);
        if (!res.ok) throw new Error(`server responded ${res.status}`);
        const deployed = await res.json();

        setEscrows(
          deployed.map((c) => {
            const escrowContract = new ethers.Contract(
              c.address,
              EscrowArtifact.abi,
              provider
            );

            return {
              address: c.address,
              arbiter: c.arbiter,
              beneficiary: c.beneficiary,
              value: c.value,
              approved: c.isApproved,
              handleApprove: async () => {
                escrowContract.on('Approved', () => markApproved(c.address));
                await approve(escrowContract, currentSigner);
              },
            };
          })
        );
      } catch (err) {
        console.error('Failed to load deployed contracts from server:', err);
      }
    }

    function applyAccount(address) {
      if (address) {
        const nextSigner = provider.getSigner();
        setAccount(address);
        setSigner(nextSigner);
        loadDeployed(address, nextSigner);
      } else {
        // wallet locked / all accounts disconnected
        setAccount(undefined);
        setSigner(undefined);
        setEscrows([]);
      }
    }

    async function getAccounts() {
      const accounts = await provider.send('eth_requestAccounts', []);
      applyAccount(accounts[0]);
    }

    getAccounts();

    // Reflect account switches made in the MetaMask extension.
    function handleAccountsChanged(accounts) {
      applyAccount(accounts[0]);
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  async function newContract() {
    const beneficiary = document.getElementById('beneficiary').value;
    const arbiter = document.getElementById('arbiter').value;
    const valueInWei = ethers.utils.parseEther(document.getElementById('ether').value);
    const escrowContract = await deploy(signer, arbiter, beneficiary, valueInWei);

    const escrow = {
      address: escrowContract.address,
      arbiter,
      beneficiary,
      value: valueInWei.toString(),
      approved: false,
      handleApprove: async () => {
        escrowContract.on('Approved', () => {
          markApproved(escrowContract.address);
        });

        await approve(escrowContract, signer);
      },
    };

    setEscrows((prev) => [...prev, escrow]);
  }

  const counts = {
    all: escrows.length,
    pending: escrows.filter((e) => !e.approved).length,
    approved: escrows.filter((e) => e.approved).length,
  };

  const visible = escrows.filter((e) => {
    if (filter === 'pending') return !e.approved;
    if (filter === 'approved') return e.approved;
    return true;
  });

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark" />
          <h1 className="brand-title">
            ESCR<span>OW</span>
          </h1>
        </div>

        <div className="wallet">
          <span className={`wallet-pill ${account ? '' : 'disconnected'}`}>
            <span className="dot" />
            {account ? 'Connected' : 'Connecting…'}
          </span>
          {account ? <Address value={account} className="wallet-address" /> : null}
        </div>
      </header>

      <div className="grid">
        <div className="panel contract">
          <h1>New Contract</h1>
          <label>
            Arbiter Address
            <input type="text" id="arbiter" placeholder="0x…" />
          </label>

          <label>
            Beneficiary Address
            <input type="text" id="beneficiary" placeholder="0x…" />
          </label>

          <label>
            Deposit Amount (in Ether)
            <input type="text" id="ether" placeholder="0.0" />
          </label>

          <div
            className="button"
            id="deploy"
            onClick={(e) => {
              e.preventDefault();

              newContract();
            }}
          >
            Deploy
          </div>
        </div>

        <div className="panel existing-contracts">
          <div className="contracts-head">
            <h1>Existing Contracts</h1>
            <div className="contracts-tabs">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  className={`tab ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                  <span className="tab-count">{counts[f]}</span>
                </button>
              ))}
            </div>
          </div>

          <div id="container" className="contracts-list">
            {escrows.length === 0 ? (
              <div className="empty-state">
                No contracts yet — deploy one to get started.
              </div>
            ) : visible.length === 0 ? (
              <div className="empty-state">No {filter} contracts.</div>
            ) : (
              visible.map((escrow) => {
                return <Escrow key={escrow.address} {...escrow} />;
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
