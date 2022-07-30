//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "./Exchange.sol";
import {InvalidTokenAddress} from "./Exchange.sol";

contract Factory {
    error ExchangeAlreadyExist();

    mapping(address => address) public tokenToExchange;
    event CreateExchange(address _tokenAddress, address _exchangeAddress);

    function createExchange(address _tokenAddress) public returns (address) {
        if (_tokenAddress == address(0)) revert InvalidTokenAddress();
        if (tokenToExchange[_tokenAddress] != address(0))
            revert ExchangeAlreadyExist();

        Exchange exchange = new Exchange(_tokenAddress);
        tokenToExchange[_tokenAddress] = address(exchange);
        emit CreateExchange(_tokenAddress, address(exchange));
        return address(exchange);
    }

    function getExchange(address _tokenAddress) public view returns (address) {
        return tokenToExchange[_tokenAddress];
    }
}
