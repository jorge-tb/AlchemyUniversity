import { ethers } from 'ethers';
import Address from './Address';

export default function Escrow({
  address,
  arbiter,
  beneficiary,
  value,
  approved,
  handleApprove,
}) {
  // `value` is stored as a wei string; render it as ETH.
  const eth = ethers.utils.formatEther(value);

  return (
    <div className={`existing-contract ${approved ? 'approved' : ''}`}>
      <div className="contract-top">
        <Address value={address} className="contract-address" />
        <span className={`status-badge ${approved ? 'approved' : 'pending'}`}>
          {approved ? 'Approved' : 'Pending'}
        </span>
      </div>

      <ul className="fields">
        <li>
          <div className="field-label">Arbiter</div>
          <Address value={arbiter} />
        </li>
        <li>
          <div className="field-label">Beneficiary</div>
          <Address value={beneficiary} />
        </li>
        <li>
          <div className="field-label">Value</div>
          <div className="field-value value-eth">Ξ {eth}</div>
        </li>
      </ul>

      {!approved && (
        <div
          className="button"
          onClick={(e) => {
            e.preventDefault();
            handleApprove();
          }}
        >
          Approve
        </div>
      )}
    </div>
  );
}
