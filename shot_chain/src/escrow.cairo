use starknet::ContractAddress;

pub mod Errors {
    pub const APPROVAL_ISSUE: felt252 = 'question not approved!';
}

#[starknet::interface]
trait IEscrow<T> {
    fn ask_question(ref self: T, bounty:u256);
    fn assign(ref self: T, qid: u64, answerer: ContractAddress); //assign answerer
    fn answer(ref self: T, qid: u64, question_maker: ContractAddress); //answer
    fn approve(ref self: T); //i like the answer, transfer money to escrow
    fn deny(ref self: T); //in dispute state
    fn arbiter(ref self: T); //either approve or deny

    // getter for question id and answer id
}
#[starknet::contract]
mod Escrow {
    use super::Errors;
    use super::IERC20DispatcherTrait;
    use super::IERC20Dispatcher;
    use openzeppelin::token::erc20::interface;
    //use super::ITokenWrapper;
    
    use super::IEscrow;
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    use starknet::get_contract_address;
    
    #[storage]
    struct Storage {
        question_id: u64,
        answer_id: u64,
        approvals: LegacyMap::<(ContractAddress, u64), ContractAddress>, // questioner's wallet, qId  -> Answerer's id
        answers: LegacyMap::<u64, u64>, // qId -> Answer Id
        balances: LegacyMap::<u64, u256>, //qId -> balance
        dispute_status: LegacyMap::<u64, bool>, //qID -> isInDispute?
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.question_id.write(0_u64);
        self.answer_id.write(0_u64);
    }

    #[abi(embed_v0)]
    impl EscrowImpl of IEscrow<ContractState> {
        fn ask_question(ref self: ContractState, bounty:u256)  {
            // should have a parameter of how much money is in stake: bounty value
            let caller: ContractAddress = get_caller_address(); // caller's addy
            let contract: ContractAddress = get_contract_address();
            
            // increment q id
            let current_qid = self.question_id.read();
            self.question_id.write(current_qid + 1_u64);

            // deposit amount to this contract
        

            // increment balances
        
            self.balances.write(current_qid, bounty);

            // add to Questions asked : Q's wallet addy, QID  -> Q's Wallet ADd (Temporarily)
            self.approvals.write((caller, current_qid), caller);

        }

        fn assign(ref self: ContractState, qid: u64, answerer: ContractAddress) {
            //check that (caller, qid), caller actually exists
            let caller: ContractAddress = get_caller_address();
            assert(self.approvals.read((caller, qid)) == caller, Errors::APPROVAL_ISSUE);
            
            //if not, revert. if so, change to approval
            self.approvals.write((caller, qid), answerer);

            //thats it
        }

        fn answer(ref self: ContractState, qid: u64, question_maker: ContractAddress) {
            //check that approval is met
            let caller: ContractAddress = get_caller_address();
            
            assert(self.approvals.read((question_maker, qid)) == caller, Errors::APPROVAL_ISSUE);

            //add answer id to answers
            
        }
    }
}