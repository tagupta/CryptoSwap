//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Exchange {
    //Connecting exchnage with token address
    address public tokenAddress;

    error InvalidTokenAddress();
    error InvalidReserves();
    error InsufficientEth();
    error InsufficientTokens();
    error IncorrectOutputAmount();
    error EthTransferFailed();

    constructor(address _token) {
        if (_token == address(0)) revert InvalidTokenAddress();
        tokenAddress = _token;
    }

    function addLiquidity(uint256 maxtokenAmount) public payable {
        if (getReserve() == 0) {
            IERC20 token = IERC20(tokenAddress);
            token.transferFrom(msg.sender, address(this), maxtokenAmount);
        } else {
            uint256 ethReserve = address(this).balance - msg.value;
            uint256 tokenReserve = getReserve();
            uint256 tokenAmount = (msg.value * tokenReserve) / ethReserve;
            if (maxtokenAmount < tokenAmount) revert InsufficientTokens();
            IERC20(tokenAddress).transferFrom(
                msg.sender,
                address(this),
                tokenAmount
            );
        }
    }

    //Helper function for getting token balance of an exchange
    function getReserve() public view returns (uint256 balance) {
        balance = IERC20(tokenAddress).balanceOf(address(this));
    }

    //naive function for fetching prices
    function getPrices(uint256 inputReserve, uint256 outputReserve)
        public
        pure
        returns (uint256)
    {
        if (inputReserve <= 0 || outputReserve <= 0) revert InvalidReserves();
        return (inputReserve * 1000) / outputReserve;
    }

    //Computing output amount
    function getAmounts(
        uint256 inputAmount,
        uint256 inputReserve,
        uint256 outputReserve
    ) private pure returns (uint256) {
        if (inputReserve <= 0 || outputReserve <= 0) revert InvalidReserves();
        return (inputAmount * outputReserve) / (inputReserve + inputAmount);
    }

    //get output amount for exact ETHs
    function getTokenAmount(uint256 _ethSold)
        public
        view
        returns (uint256 tokenBought)
    {
        if (_ethSold <= 0) revert InsufficientEth();
        uint256 tokenReserve = getReserve();
        tokenBought = getAmounts(_ethSold, address(this).balance, tokenReserve);
    }

    //get output amount for exact tokens
    function getEthAmount(uint256 _tokenSold)
        public
        view
        returns (uint256 ethBought)
    {
        if (_tokenSold <= 0) revert InsufficientTokens();
        uint256 tokenReserve = getReserve();
        return getAmounts(_tokenSold, tokenReserve, address(this).balance);
    }

    //Eth to token swap [Exact Eth, min tokens]
    function ethToTokenSwap(uint256 minTokens)
        public
        payable
        returns (uint256 tokensBought)
    {
        uint256 inputReserve = address(this).balance - msg.value;
        uint256 outputReserve = getReserve();
        tokensBought = getAmounts(msg.value, inputReserve, outputReserve);
        if (tokensBought < minTokens) revert IncorrectOutputAmount();
        IERC20(tokenAddress).transfer(msg.sender, tokensBought);
    }

    //Token to Eth swap [Exact token, min Eth]
    function tokenToEthSwap(uint256 tokenSold, uint256 minEther)
        public
        payable
        returns (uint256 ethBought)
    {
        uint256 inputReserve = getReserve();
        uint256 outputReserve = address(this).balance;
        ethBought = getAmounts(tokenSold, inputReserve, outputReserve);
        if (minEther > ethBought) revert IncorrectOutputAmount();
        (bool result, ) = payable(msg.sender).call{value: ethBought}("");
        if (!result) revert EthTransferFailed();
    }
}
