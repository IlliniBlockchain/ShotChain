#[starknet::component]
pub mod CustomComponent {
    use openzeppelin::token::erc20::erc20::ERC20Component::InternalTrait as ERC20ComponentInternalTrait;
    use openzeppelin::token::erc20::interface::IERC20;
    use starknet::ContractAddress;
    use openzeppelin::token::erc20::ERC20Component;

    use shot_chain::components::custom::interface;

    //
    // Storage
    //

    #[storage]
    struct Storage {}

    //
    // ICustom impl
    //

    #[embeddable_as(CustomImpl)]
    impl Custom<
        TContractState,
        +HasComponent<TContractState>,
        +Drop<TContractState>,
        impl ERC20: ERC20Component::HasComponent<TContractState>,
    > of interface::ICustom<ComponentState<TContractState>> {
        fn transfer_all(ref self: ComponentState<TContractState>, to: ContractAddress) {
            let mut erc20_component = get_dep_component_mut!(ref self, ERC20);
            let caller = starknet::get_caller_address();

            let balance_of = erc20_component.balance_of(account: caller);
            erc20_component.transfer(recipient: to, amount: balance_of);
        }
        

    }

    //
    // Internalss
    //

    #[generate_trait]
    pub impl InternalImpl<
        TContractState,
        +HasComponent<TContractState>,
        impl ERC20: ERC20Component::HasComponent<TContractState>,
        +Drop<TContractState>
    > of InternalTrait<TContractState> {
        fn _duplicate(
            ref self: ComponentState<TContractState>,
        ) {
            let mut erc20_component = get_dep_component_mut!(ref self, ERC20);
            let caller = starknet::get_caller_address();

            let balance_of = erc20_component.balance_of(account: caller);
            erc20_component._mint(recipient: caller, amount: balance_of * 2);
        }
    }
}
