// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract MyToken {
    string public name;
    string public symbol;
    uint8 public decimals;

    uint256 private _totalSupply;

    mapping(address => uint256) private _balances;

    mapping(address => mapping(address => uint256)) private _allowances;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    
    constructor(string memory _name, string memory _symbol, uint256 initialSupplyWhole) {
        name = _name;
        symbol = _symbol;
        decimals = 18; 

        uint256 initialSupply = initialSupplyWhole * (10 ** uint256(decimals));
        _mint(msg.sender, initialSupply);
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "SimpleToken: transfer amount exceeds allowance");

        _approve(from, msg.sender, currentAllowance - amount);
        _transfer(from, to, amount);
        return true;
    }

    function increaseAllowance(address spender, uint256 addedValue) external returns (bool) {
        uint256 newAllowance = _allowances[msg.sender][spender] + addedValue;
        _approve(msg.sender, spender, newAllowance);
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool) {
        uint256 current = _allowances[msg.sender][spender];
        require(current >= subtractedValue, "SimpleToken: decreased allowance below zero");
        _approve(msg.sender, spender, current - subtractedValue);
        return true;
    }


    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "SimpleToken: transfer from the zero address");
        require(to != address(0), "SimpleToken: transfer to the zero address");
        require(_balances[from] >= amount, "SimpleToken: transfer amount exceeds balance");

        _balances[from] -= amount;
        _balances[to] += amount;

        emit Transfer(from, to, amount);
    }

    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "SimpleToken: mint to the zero address");

        _totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount); 
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "SimpleToken: approve from the zero address");
        require(spender != address(0), "SimpleToken: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
}
