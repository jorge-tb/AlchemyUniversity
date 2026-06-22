class Contract {
    constructor(address, value, depositor, arbiter, beneficiary, isApproved) {
        this.address = address;
        this.value = value;
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