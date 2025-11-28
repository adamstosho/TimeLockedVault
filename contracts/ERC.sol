// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract ERC20Token{

    // metadata
    string private _name;
    string private _symbol;
    uint8 private _decimals = 18;
    uint256 private _totalSupply;

    mapping (address user => uint256 balance) public balances;
    mapping(address owner => mapping(address spender => uint256 allowance)) public allowances;

    address public owner;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _n, string memory _s){
        owner = msg.sender;
        _name = _n;
        _symbol = _s;

        mint(msg.sender, 1_000_000 * (10 ** decimals()));
    }

    // get methods
    function name() public view returns (string memory){
        return _name;
    }

    function symbol() public view returns (string memory){
        return _symbol;
    }

    function decimals() public view returns (uint8){
        return _decimals;
    }

    function totalSupply() public view returns(uint256){
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256){
        return balances[account];
    }

    // core methods
    function transfer(address to, uint256 value) public returns(bool){
        require(msg.sender != address(0), "Invalid sender address");
        require(to != address(0), "Invalid recipient address");
        require(value > 0, "Amount must be greater than zero");
        require(balances[msg.sender] >= value, "Insufficient balance");

        balances[msg.sender] -= value;
        balances[to] += value;

        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) public returns(bool){
        require(msg.sender != address(0), "Invalid sender address");
        require(spender != address(0), "Invalid spender address");
        require(balances[msg.sender] >= value, "Insufficient balance");
        require(value > 0, "Amount must be greater than zero");

        allowances[msg.sender][spender] += value;

        emit Approval(msg.sender, spender, value);
        return true;
    }

    function allowance(address _owner, address spender) public view returns(uint256){
        return allowances[_owner][spender];
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool){
        require(msg.sender != address(0), "Invalid caller address");
        require(from != address(0), "Invalid owner address");
        require(to != address(0), "Invalid recipient address");
        require(value > 0, "Amount must be greater than zero");
        require(balances[from] >= value, "Insufficient balance");
        require(allowances[from][msg.sender] >= value, "allownce exceeded");

        allowances[from][msg.sender] -= value;
        balances[from] -= value;
        balances[to] += value;

        emit Transfer(from, to, value);
        return true;
    }

    function mint(address to, uint256 value) public {
        require(msg.sender == owner, "Only owner can mint token");
        require(to != address(0), "Invalid recipient address");
        require(value > 0, "Amount must be greater than zero");

        _totalSupply += value;
        balances[to] += value;

        emit Transfer(address(0), to, value);
    }

    function burn(uint256 value) public {
        require(value > 0, "Amount must be greater than zero");
        require(balances[msg.sender] >= value, "Insufficient balance");

        _totalSupply -= value;
        balances[msg.sender] -= value;

        emit Transfer(msg.sender, address(0), value);
    }
}