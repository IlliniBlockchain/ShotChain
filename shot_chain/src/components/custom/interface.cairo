use starknet::ContractAddress;

#[starknet::interface]
pub trait ICustom<TState> {
    fn transfer_all(ref self: TState, to: ContractAddress);
    
}
