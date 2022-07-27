//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Exchange {
    //Connecting exchnage with token address
    address public tokenAddress;

    error InvalidTokenAddress();

    constructor(address _token) {
        if (_token == address(0)) revert InvalidTokenAddress();
        tokenAddress = _token;
    }

    function addLiquidity(uint256 _tokenAmount) public payable {
        IERC20 token = IERC20(tokenAddress);
        token.transferFrom(msg.sender, address(this), _tokenAmount);
    }

    //Helper function for getting token balance of an exchange
    function getReserve() public view returns (uint256 balance) {
        balance = IERC20(tokenAddress).balanceOf(address(this));
    }
}
