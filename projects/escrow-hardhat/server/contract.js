class Contract {
    constructor(depositor, arbiter, beneficiary, isApproved) {
        this.depositor = depositor;
        this.arbiter = arbiter;
        this.beneficiary = beneficiary;
        this.isApproved = isApproved;
    }
}

const Status = {
    PENDING: 1,
    APPROVED: 2
};

module.exports = { Contract };