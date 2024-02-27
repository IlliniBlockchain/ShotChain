use starknet::ContractAddress;


pub mod Errors {
    pub const APPROVAL_ISSUE: felt252 = 'question not approved!';
    pub const NOT_ANSWERED: felt252 = 'user did not answer!';
    pub const ANSWERED: felt252 = 'user did answer in withdraw!';
    pub const ALREADY_ANSWERED: felt252 = 'already answered';
    pub const NOT_DISPUTED: felt252 = 'not disputed';
    pub const CALLER_ORACLE: felt252 = 'caller != oracle';
}

#[starknet::interface]
trait IEscrow<T> {
   fn ask_question(ref self: T, bounty:u256);
    fn assign(ref self: T, qid: u64, answerer: ContractAddress); //assign answerer
    fn answer(ref self: T, qid: u64, question_maker: ContractAddress); //answer
    fn approve(ref self: T, qid: u64, question_answerer: ContractAddress); //i like the answer, transfer money to escrow //fn approve(ref self: ContractState, qid: u64)
    fn deny(ref self: T, qid: u64, question_answerer: ContractAddress); //in dispute state // fn approve(ref self: ContractState, qid: u64)
    fn arbiter(ref self: T, qid: u64, question_maker: ContractAddress, decision: bool); //either approve or deny
    fn withdraw(ref self: T, qid: u64, question_answerer: ContractAddress); //question maker wants to withdraw bc answerer didn't answer in time
    fn dispute(ref self: T, qid: u64, question_maker: ContractAddress); //question maker never clicked approve or deny in time

    // getter for question id and answer id
    fn get_qid(self: @T) -> u64;
    fn get_ansid(self: @T) -> u64;
    fn get_information(self: @T, question_maker: ContractAddress, qid: u64) -> (ContractAddress, u64, u256, bool);
}
#[starknet::contract]
mod Escrow {
    use core::num::traits::zero::Zero;
use core::traits::TryInto;
    use super::Errors;
    // use super::IERC20DispatcherTrait;
    // use super::IERC20Dispatcher;
    use openzeppelin::token::erc20::interface;
    
    use super::IEscrow;
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    use starknet::get_contract_address;
    
    // use openzeppelin::token::erc20::ERC20Component;
    // use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::token::erc20::interface::{ IERC20Dispatcher, IERC20DispatcherTrait };

    // use openzeppelin::token::erc20::interface::IERC20CamelOnly;
    // use openzeppelin::token::erc20::interface::IERC20DispatcherTrait;
    //use openzeppelin::token::erc20::erc20::ERC20Component::InternalTrait;
   
    use openzeppelin::token::erc20;
    
    use shot_chain::components::custom::component::CustomComponent;

    // component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    // component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    // component!(path: CustomComponent, storage: custom, event: CustomEvent);


    #[storage]
    struct Storage {
        mint_addr: ContractAddress,
        oracle_addr: ContractAddress,
        question_id: u64,
        answer_id: u64,
        approvals: LegacyMap::<(ContractAddress, u64), ContractAddress>, // questioner's wallet, qId  -> Answerer's id
        answers: LegacyMap::<u64, u64>, // qId -> Answer Id
        balances: LegacyMap::<u64, u256>, //qId -> balance
        dispute_status: LegacyMap::<u64, bool>, //qID -> isInDispute?
    }

    #[constructor]
    fn constructor(ref self: ContractState, oracle: ContractAddress, mint: ContractAddress) {
        self.mint_addr.write(mint);
        self.oracle_addr.write(oracle);
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
            let current_qid = self.question_id.read() + 1_u64;
            self.question_id.write(current_qid);

            
            IERC20Dispatcher { contract_address: self.mint_addr.read()}.transfer_from(caller, contract, bounty);
           
            // increment balances
        
            self.balances.write(current_qid, bounty);

            // add to Questions asked : Q's wallet addy, QID  -> Q's Wallet ADd (Temporarily)
            self.approvals.write((caller, current_qid), caller);
        }

        fn assign(ref self: ContractState, qid: u64, answerer: ContractAddress) { //DONE
            //check that (caller, qid), caller actually exists
            let caller: ContractAddress = get_caller_address();
            assert(self.approvals.read((caller, qid)) == caller, Errors::APPROVAL_ISSUE);
            
            //change to approval
            self.approvals.write((caller, qid), answerer);
        }

        fn answer(ref self: ContractState, qid: u64, question_maker: ContractAddress) { //DONE
            //check that approval is met
            let caller: ContractAddress = get_caller_address();

            assert(self.approvals.read((question_maker, qid)) == caller, Errors::APPROVAL_ISSUE);
            assert(self.answers.read(qid) == 0, Errors::ALREADY_ANSWERED);

            let curr_ans_id = self.answer_id.read() + 1;

            //add answer id to answers
            self.answers.write(qid, curr_ans_id);

            self.answer_id.write(curr_ans_id);
        }

        fn approve(ref self: ContractState, qid: u64, question_answerer: ContractAddress) {
            let caller: ContractAddress = get_caller_address();
            let answerer: ContractAddress = self.approvals.read((caller, qid));
            // let contract: ContractAddress = get_contract_address();

            //verify answered
            assert(question_answerer.is_non_zero(), Errors::NOT_ANSWERED);
            assert(answerer == question_answerer, Errors::NOT_ANSWERED);
            assert(self.answers.read(qid) != 0, Errors::NOT_ANSWERED);

            let balance = self.balances.read(qid);

            //TRANSFER TO THE ANSWERER // how much to transfer
            IERC20Dispatcher { contract_address: self.mint_addr.read(), }.transfer(answerer, balance);

            //set the balances to 0 for that qid
            self.balances.write(qid, 0);
        }

        fn deny(ref self: ContractState, qid: u64, question_answerer: ContractAddress) { //DONE
            let caller: ContractAddress = get_caller_address();
            let answerer: ContractAddress = self.approvals.read((caller, qid));
            
            //check if answerer answered
            assert(question_answerer.is_non_zero(), Errors::NOT_ANSWERED);
            assert(answerer == question_answerer, Errors::NOT_ANSWERED);
            assert(self.answers.read(qid) != 0, Errors::NOT_ANSWERED);

            //set this as a dispute status
            self.dispute_status.write(qid, true);
        }

        fn arbiter(ref self: ContractState, qid: u64, question_maker: ContractAddress, decision: bool) {
            //TRUE if question_maker should get money back, FALSE otherwise

            //VERIFY DISPUTER IS THE ORACLE
            let disputer: ContractAddress = get_caller_address();
            let answerer: ContractAddress = self.approvals.read((question_maker, qid));

            //verify disputer is the oracle
            let oracle: ContractAddress = self.oracle_addr.read();
            assert(answerer.is_non_zero(), Errors::CALLER_ORACLE);
            assert(disputer == oracle, Errors::CALLER_ORACLE);

            //check if its in dispute
            assert(self.dispute_status.read(qid), Errors::NOT_DISPUTED);

            let balance = self.balances.read(qid);

            //TRANSFER TO THE PERSON BASED ON DECISION
            if(decision) {
                //instead of this, put question back in original state
                self.dispute_status.write(qid, false);
                self.answers.write(qid, 0);
                self.approvals.write((question_maker, qid), question_maker);
            } else {
                IERC20Dispatcher { contract_address: self.mint_addr.read(), }.transfer(answerer, balance);

                self.balances.write(qid, 0);
            }
        }

        //question maker wants to withdraw bc answerer didn't answer in time
        fn withdraw(ref self: ContractState, qid: u64, question_answerer: ContractAddress) {
            let caller: ContractAddress = get_caller_address();
            let answerer: ContractAddress = self.approvals.read((caller, qid));
            
            // assert answer id is zero
            assert(self.answers.read(qid).is_zero(), Errors::ANSWERED);
            
            //assert that the answerer is non-zero
            assert(question_answerer.is_non_zero(), Errors::NOT_ANSWERED);
            
            // assert answerer is the one in mapping
            assert(answerer == question_answerer, Errors::NOT_ANSWERED);
            
            // transfer the money from the contract to the caller
            IERC20Dispatcher { contract_address: self.mint_addr.read(), }.transfer(caller, self.balances.read(qid));
           
            //balance to 0
            self.balances.write(qid, 0);
        }
        
        //ANSWERER calls
        fn dispute(ref self: ContractState, qid: u64, question_maker: ContractAddress) { //question maker never clicked approve or deny in time
            let caller: ContractAddress = get_caller_address();
            
            //approved answerer
            assert(self.approvals.read((question_maker, qid)) == caller, Errors::APPROVAL_ISSUE);

            //answered
            assert(self.answers.read(qid) != 0, Errors::ALREADY_ANSWERED);

            //ideally check a time until the answerer can dispute

            //set this as a dispute status
            self.dispute_status.write(qid, true);
        }

        fn get_qid(self: @ContractState) -> u64 {
            self.question_id.read()
        }

        fn get_ansid(self: @ContractState) -> u64 {
            self.answer_id.read()
        }

        fn get_information(self: @ContractState, question_maker: ContractAddress, qid: u64) -> (ContractAddress, u64, u256, bool) {
            (self.approvals.read((question_maker, qid)), self.answers.read(qid), self.balances.read(qid), self.dispute_status.read(qid))
        }
    }
}